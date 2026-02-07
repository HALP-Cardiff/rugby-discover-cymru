"use client";

import { useEffect, useRef, useState, useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────
interface Organization {
  OrganisationId: number;
  OrganisationName: string;
  OrganisationType: string;
  TeamTemplateId: number;
  TeamTemplateName: string;
  MinAge: number;
  MaxAge: number;
  GameFormat: string;
  Sex: string | null;
}

interface TeamInfo {
  id: number;
  teamName: string;
  minAge: number;
  maxAge: number;
  gameFormat: string;
  sex: string | null;
}

/** One marker on the map = one unique organisation with all its teams. */
interface GeocodedOrganization {
  name: string;
  orgType: string;
  lat: number;
  lng: number;
  teams: TeamInfo[];
}

interface MapComponentProps {
  organizations: Organization[];
}

// ── Component ────────────────────────────────────────────────────────────
export default function MapComponent({ organizations }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const [geocodedOrgs, setGeocodedOrgs] = useState<GeocodedOrganization[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Group organisations by name ──────────────────────────────────────
  const groupedOrgs = useMemo(() => {
    const groups = new Map<string, Organization[]>();
    for (const org of organizations) {
      const existing = groups.get(org.OrganisationName) || [];
      existing.push(org);
      groups.set(org.OrganisationName, existing);
    }
    return groups;
  }, [organizations]);

  // Stable key that changes when the set of organisation names changes
  const orgNamesKey = useMemo(
    () => [...groupedOrgs.keys()].sort().join("|"),
    [groupedOrgs]
  );

  // ── Load Google Maps JavaScript API (once) ───────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          setMapLoaded(true);
          clearInterval(check);
        }
      }, 200);
      return () => clearInterval(check);
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key is not configured");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps script");
    document.head.appendChild(script);
  }, []);

  // ── Batch-geocode all unique organisation names ──────────────────────
  // Re-runs whenever the set of organisation names changes (e.g. filters).
  useEffect(() => {
    if (organizations.length === 0) {
      setGeocodedOrgs([]);
      return;
    }

    const uniqueNames = [...groupedOrgs.keys()];
    let cancelled = false;

    setIsGeocoding(true);
    setGeocodingStatus(
      `Locating ${uniqueNames.length} organisations on the map…`
    );

    fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationNames: uniqueNames }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Geocoding API error: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const results: GeocodedOrganization[] = [];

        for (const [name, coords] of Object.entries(
          data.results as Record<string, { lat: number; lng: number } | null>
        )) {
          if (coords) {
            const orgs = groupedOrgs.get(name) || [];
            results.push({
              name,
              orgType: orgs[0]?.OrganisationType ?? "",
              lat: coords.lat,
              lng: coords.lng,
              teams: orgs.map((o) => ({
                id: o.TeamTemplateId,
                teamName: o.TeamTemplateName,
                minAge: o.MinAge,
                maxAge: o.MaxAge,
                gameFormat: o.GameFormat,
                sex: o.Sex,
              })),
            });
          }
        }

        setGeocodedOrgs(results);
        setGeocodingStatus(
          `Showing ${results.length} of ${uniqueNames.length} organisations`
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Batch geocoding error:", err);
        setError(err instanceof Error ? err.message : "Geocoding failed");
      })
      .finally(() => {
        if (!cancelled) setIsGeocoding(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgNamesKey]);

  // ── Initialise / update map markers ──────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || geocodedOrgs.length === 0 || !mapLoaded)
      return;

    try {
      // Create map instance once
      if (!map.current) {
        map.current = new google.maps.Map(mapContainer.current, {
          center: { lat: 52.13, lng: -3.78 },
          zoom: 8,
          mapId: "RUGBY_DISCOVER_CYMRU",
        });
        infoWindow.current = new google.maps.InfoWindow();
      }

      // Clear old markers
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];

      // Add one marker per organisation
      geocodedOrgs.forEach((org) => {
        if (!map.current) return;

        const pin = document.createElement("div");
        pin.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #dc2626, #991b1b);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.15s ease;
          "
          onmouseover="this.style.transform='scale(1.25)'"
          onmouseout="this.style.transform='scale(1)'"
          title="${org.name}"
          >&#127945;</div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: org.lat, lng: org.lng },
          map: map.current,
          content: pin,
          title: org.name,
        });

        // Build popup content listing all teams with richer details
        const teamsHtml = org.teams
          .map(
            (t) => `
            <div style="padding: 6px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="font-size: 13px; font-weight: 500; color: #374151;">${t.teamName}</div>
              <div style="font-size: 12px; color: #6b7280;">
                Ages ${t.minAge}–${t.maxAge}
                ${t.sex ? ` &middot; ${t.sex}` : ""}
                &middot; ${t.gameFormat}
              </div>
            </div>`
          )
          .join("");

        const popupContent = `
          <div style="min-width: 260px; max-width: 340px; padding: 12px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1f2937;">
              ${org.name}
            </h3>
            <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
              ${org.orgType} &middot; ${org.teams.length} team${org.teams.length !== 1 ? "s" : ""}
            </p>
            <div style="max-height: 200px; overflow-y: auto;">
              ${teamsHtml}
            </div>
          </div>
        `;

        marker.addListener("click", () => {
          infoWindow.current?.setContent(popupContent);
          infoWindow.current?.open(map.current!, marker);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds
      if (geocodedOrgs.length > 0 && map.current) {
        const bounds = new google.maps.LatLngBounds();
        geocodedOrgs.forEach((org) =>
          bounds.extend({ lat: org.lat, lng: org.lng })
        );
        map.current.fitBounds(bounds, 60);
      }
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize the map");
    }
  }, [geocodedOrgs, mapLoaded]);

  // ── Derived state ────────────────────────────────────────────────────
  const isLoading = isGeocoding || (!mapLoaded && !error);
  const isReady = !isGeocoding && mapLoaded && geocodedOrgs.length > 0;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full min-h-[500px] relative">
      <div
        ref={mapContainer}
        className="w-full h-full min-h-[500px] rounded-lg"
        style={{ backgroundColor: "#e5e7eb" }}
      />

      {isLoading && !error && (
        <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600 mb-4" />
          <p className="text-gray-700 font-medium">
            {isGeocoding ? geocodingStatus : "Loading Google Maps…"}
          </p>
          {isGeocoding && (
            <p className="text-sm text-gray-500 mt-1">
              {groupedOrgs.size} unique organisations to locate
            </p>
          )}
        </div>
      )}

      {isReady && (
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-sm text-gray-700">
          <strong>{geocodedOrgs.length}</strong> organisations on map
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 bg-red-50 rounded-lg flex flex-col items-center justify-center text-red-700 p-6">
          <svg
            className="w-10 h-10 mb-3 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-semibold mb-1">Something went wrong</p>
          <p className="text-sm text-center text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
