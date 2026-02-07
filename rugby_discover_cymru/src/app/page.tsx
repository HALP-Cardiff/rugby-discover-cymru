"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "./components/Header";
import PathwaysButton from "./components/PathwaysButton";

// import images for the pathways buttons
import womenPathwayImg from '../../public/womens_thumbnail.jpg'
import menPathwayImg from '../../public/mens_thumbnail.jpeg'
import "./globals.css";
import Footer from "./components/Footer";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

// ── Types ────────────────────────────────────────────────────────────────
interface Organization {
  OrganisationId: number;
  OrganisationName: string;
  OrganisationType: string;
  OrganisationTypeId: number;
  TeamTemplateId: number;
  TeamTemplateName: string;
  MinAge: number;
  MaxAge: number;
  MaxTeamSize: number | null;
  GameFormatId: number;
  GameFormat: string;
  SexId: number | null;
  Sex: string | null;
  LogoUrl: string | null;
}

interface PathwaysFilterState {
  [key: string]: boolean;
}

interface FilterOptions {
  sexes: { Id: number; Value: string }[];
  gameFormats: { Id: number; Value: string }[];
  organisationTypes: { Id: number; Name: string; Description: string }[];
}

// ── Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activeFilters, setActiveFilters] = useState<PathwaysFilterState>({
    women: false,
    men: false,
    kids: false,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleFilter = (filterName: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Filter options (loaded once)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );

  // Active filter values
  const [selectedSex, setSelectedSex] = useState("");
  const [selectedGameFormat, setSelectedGameFormat] = useState("");
  const [selectedOrgType, setSelectedOrgType] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  // ── Load filter options on mount ─────────────────────────────────────
  useEffect(() => {
    fetch("/api/filters")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load filters");
        return res.json();
      })
      .then(setFilterOptions)
      .catch((err) => console.error("Error loading filters:", err));
  }, []);

  // ── Fetch organisations (with filters) ───────────────────────────────
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedSex) params.set("sexId", selectedSex);
      if (selectedGameFormat) params.set("gameFormatId", selectedGameFormat);
      if (selectedOrgType)
        params.set("organisationTypeId", selectedOrgType);
      if (minAge) params.set("minAge", minAge);
      if (maxAge) params.set("maxAge", maxAge);

      const qs = params.toString();
      const url = `/api/organisations${qs ? `?${qs}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const result = await response.json();
      setOrganizations(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch organizations"
      );
      console.error("Error fetching organizations:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSex, selectedGameFormat, selectedOrgType, minAge, maxAge]);

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // ── Clear all filters ────────────────────────────────────────────────
  const clearFilters = () => {
    setSelectedSex("");
    setSelectedGameFormat("");
    setSelectedOrgType("");
    setMinAge("");
    setMaxAge("");
  };

  const hasActiveFilters =
    selectedSex || selectedGameFormat || selectedOrgType || minAge || maxAge;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <Header />
      <main className="flex flex-1 w-full flex-col items-start justify-start py-5 px-16 bg-white">
        <div className="flex flex-col items-start w-full max-w-5xl">
          {/* Pathways Filter Buttons */}
          <div className="flex gap-4 mb-6">
            <PathwaysButton
              label="Women"
              imageSrc={womenPathwayImg.src}
              isActive={activeFilters.women}
              onToggle={() => toggleFilter("women")}
            />
            <PathwaysButton
              label="Men"
              imageSrc={menPathwayImg.src}
              isActive={activeFilters.men}
              onToggle={() => toggleFilter("men")}
            />
          </div>

          {/* ── Filters ──────────────────────────────────────────────── */}
          <div className="w-full mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Filter Organisations
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sex */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex
                </label>
                <select
                  value={selectedSex}
                  onChange={(e) => setSelectedSex(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                >
                  <option value="">All</option>
                  {filterOptions?.sexes.map((s) => (
                    <option key={s.Id} value={s.Id}>
                      {s.Value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game Format
                </label>
                <select
                  value={selectedGameFormat}
                  onChange={(e) => setSelectedGameFormat(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                >
                  <option value="">All</option>
                  {filterOptions?.gameFormats.map((gf) => (
                    <option key={gf.Id} value={gf.Id}>
                      {gf.Value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Organisation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation Type
                </label>
                <select
                  value={selectedOrgType}
                  onChange={(e) => setSelectedOrgType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                >
                  <option value="">All</option>
                  {filterOptions?.organisationTypes.map((ot) => (
                    <option key={ot.Id} value={ot.Id}>
                      {ot.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Age
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  placeholder="Any"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>

              {/* Max Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Age
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  placeholder="Any"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            {/* Result count */}
            {!loading && (
              <p className="mt-3 text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {organizations.length}
                </span>{" "}
                result{organizations.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* ── View Toggle ──────────────────────────────────────────── */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setViewMode("map")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "map"
                  ? "bg-red-600 text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-red-600 text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              List
            </button>
          </div>

          {/* ── Map View ─────────────────────────────────────────────── */}
          {viewMode === "map" && (
            <div
              className="w-full"
              style={{ minHeight: "500px", height: "65vh" }}
            >
              {loading ? (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  Loading organizations...
                </div>
              ) : error ? (
                <div className="w-full h-full bg-red-100 rounded-lg flex items-center justify-center text-red-700">
                  {error}
                </div>
              ) : organizations.length === 0 ? (
                <div className="w-full h-full bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-700">
                  No organizations found matching your filters
                </div>
              ) : (
                <MapComponent organizations={organizations} />
              )}
            </div>
          )}

          {/* ── List View ────────────────────────────────────────────── */}
          {viewMode === "list" && (
            <div className="w-full max-h-[65vh] overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-600">
                  Loading organizations...
                </div>
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : organizations.length === 0 ? (
                <div className="text-center text-yellow-600">
                  No organizations found matching your filters
                </div>
              ) : (
                <div className="space-y-3">
                  {organizations.map((org, index) => (
                    <Link
                      key={`${org.OrganisationId}-${org.TeamTemplateId}-${index}`}
                      href={`/org/${org.OrganisationId}`}
                    >
                      <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 cursor-pointer transition-colors">
                        <p className="font-semibold text-gray-800">
                          {org.OrganisationName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Team: {org.TeamTemplateName}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Ages {org.MinAge}–{org.MaxAge}
                          </span>
                          {org.Sex && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {org.Sex}
                            </span>
                          )}
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {org.GameFormat}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {org.OrganisationType}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
