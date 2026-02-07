import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Organization {
  Id: number;
  OrganisationName: string;
  TeamTemplateName: string;
  MinAge: number;
  MaxAge: number;
}

interface OrganizationWithCoords extends Organization {
  Latitude: number;
  Longitude: number;
}

interface MapComponentProps {
  organizations: Organization[];
}

// Geocode organization name to coordinates using Nominatim API
async function geocodeOrganization(
  orgName: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    // Add Wales context to improve search accuracy
    const query = `${orgName}, Wales, UK`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Rugby-Discover-Cymru",
        },
      },
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to geocode ${orgName}:`, error);
    return null;
  }
}

export default function MapComponent({ organizations }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [orgsWithCoords, setOrgsWithCoords] = useState<
    OrganizationWithCoords[]
  >([]);
  const [geocodingProgress, setGeocodingProgress] = useState(0);

  // Geocode all organizations on mount
  useEffect(() => {
    const geocodeAll = async () => {
      const results: OrganizationWithCoords[] = [];

      for (let i = 0; i < organizations.length; i++) {
        const org = organizations[i];
        const coords = await geocodeOrganization(org.OrganisationName);

        if (coords) {
          results.push({
            ...org,
            Latitude: coords.lat,
            Longitude: coords.lon,
          });
        }

        setGeocodingProgress(
          Math.round(((i + 1) / organizations.length) * 100),
        );
        // Add delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setOrgsWithCoords(results);
    };

    if (organizations.length > 0) {
      geocodeAll();
    }
  }, [organizations]);

  useEffect(() => {
    if (!mapContainer.current || orgsWithCoords.length === 0) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([52.3555, -3.1107], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Clear existing markers
    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.current?.removeLayer(layer);
      }
    });

    // Add markers for each organization
    orgsWithCoords.forEach((org) => {
      if (map.current) {
        const marker = L.marker([org.Latitude, org.Longitude]).addTo(
          map.current,
        );

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${org.OrganisationName}</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Team:</strong> ${org.TeamTemplateName}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Age Range:</strong> ${org.MinAge} - ${org.MaxAge}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Lat: ${org.Latitude.toFixed(4)}, Lon: ${org.Longitude.toFixed(4)}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });

    // Fit bounds to all markers if there are any
    if (orgsWithCoords.length > 0 && map.current) {
      const bounds = L.latLngBounds(
        orgsWithCoords.map(
          (org) => [org.Latitude, org.Longitude] as L.LatLngTuple,
        ),
      );
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [orgsWithCoords]);

  return (
    <div>
      {orgsWithCoords.length === 0 && geocodingProgress > 0 && (
        <div className="w-full h-96 bg-blue-100 rounded-lg flex flex-col items-center justify-center text-blue-700">
          <p className="mb-4">Geocoding organizations: {geocodingProgress}%</p>
          <div className="w-48 h-2 bg-blue-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${geocodingProgress}%` }}
            />
          </div>
        </div>
      )}
      {orgsWithCoords.length > 0 && (
        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "600px",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
        />
      )}
    </div>
  );
}
