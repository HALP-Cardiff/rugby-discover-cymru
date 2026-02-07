"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import Header from "./components/Header";
import PathwaysButton from "./components/PathwaysButton";
import Chatbot from "./components/Chatbot";

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

interface PlayNowOpportunity {
  id: number;
  organisationName: string;
  type: "weekend_fixture" | "social_session" | "short_term";
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  lat: number;
  lng: number;
  commitment: string;
  intensity: string;
  ageRange: string;
  sex: string;
  spotsAvailable: number;
  contactEmail: string;
  tags: string[];
}

interface FilterOptions {
  sexes: { Id: number; Value: string }[];
  gameFormats: { Id: number; Value: string }[];
  organisationTypes: { Id: number; Name: string; Description: string }[];
}

const LOGO_BASE_URL = "https://public.wru.wales/organisation/logos/";

// ── Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [viewMode, setViewMode] = useState<"map" | "list" | "play_now">("map");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Play Now state
  const [playNowOpportunities, setPlayNowOpportunities] = useState<PlayNowOpportunity[]>([]);
  const [playNowLoading, setPlayNowLoading] = useState(false);
  const [playNowFilter, setPlayNowFilter] = useState<string>("");

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

  // ── Fetch Play Now opportunities ──────────────────────────────────────
  const fetchPlayNow = useCallback(async () => {
    try {
      setPlayNowLoading(true);
      const params = new URLSearchParams();
      if (playNowFilter) params.set("type", playNowFilter);
      const qs = params.toString();
      const url = `/api/play-now${qs ? `?${qs}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const result = await response.json();
      setPlayNowOpportunities(result.data || []);
    } catch (err) {
      console.error("Error fetching play now opportunities:", err);
    } finally {
      setPlayNowLoading(false);
    }
  }, [playNowFilter]);

  useEffect(() => {
    if (viewMode === "play_now") {
      fetchPlayNow();
    }
  }, [viewMode, fetchPlayNow]);

  // ── Pathway button toggle (drives the sex filter) ─────────────────
  const getSexId = (sexValue: string): string => {
    const sexOption = filterOptions?.sexes.find(
      (s) => s.Value.toLowerCase() === sexValue.toLowerCase()
    );
    return sexOption ? String(sexOption.Id) : "";
  };

  const handlePathwayToggle = (sexValue: string) => {
    const sexId = getSexId(sexValue);
    setSelectedSex((prev) => (prev === sexId ? "" : sexId));
  };

  // ── Play Now helpers ─────────────────────────────────────────────────
  const getUrgencyLabel = (dateStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return "Past";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 3) return `In ${diffDays} days`;
    if (diffDays <= 7) return "This week";
    if (diffDays <= 14) return "Next week";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getUrgencyColor = (dateStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 1) return "bg-red-600 text-white";
    if (diffDays <= 3) return "bg-orange-500 text-white";
    if (diffDays <= 7) return "bg-yellow-500 text-white";
    return "bg-blue-500 text-white";
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "weekend_fixture": return "Weekend Fixture";
      case "social_session": return "Social / Casual";
      case "short_term": return "Short-Term Programme";
      default: return type;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "weekend_fixture": return "bg-red-100 text-red-700";
      case "social_session": return "bg-emerald-100 text-emerald-700";
      case "short_term": return "bg-violet-100 text-violet-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <Header />
      <Chatbot />
      
      {/* Hero Section - Full Width */}
      <div 
        className="w-full relative h-150 flex items-center justify-center mb-5"
        style={{ 
          backgroundImage: "url('/cover.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Text content */}
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-2">
            Discover Rugby in Wales
          </h1>
          <p className="text-lg text-white">
            Find rugby clubs, teams, and organizations across Wales. Filter by
            location, age group, game format, and more to find the perfect fit
            for you.
          </p>
        </div>
      </div>

      <main className="flex flex-1 w-full flex-col items-start justify-start px-16 bg-white">
        <div className="flex flex-col items-start w-full max-w-5xl">
          {/* Pathways Filter Buttons (sex filter) */}
          <div className="flex gap-4 mb-6">
            <PathwaysButton
              label="WOMEN"
              imageSrc={womenPathwayImg.src}
              isActive={selectedSex === getSexId("Female")}
              onToggle={() => handlePathwayToggle("Female")}
            />
            <PathwaysButton
              label="MEN"
              imageSrc={menPathwayImg.src}
              isActive={selectedSex === getSexId("Male")}
              onToggle={() => handlePathwayToggle("Male")}
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
            <button
              onClick={() => setViewMode("play_now")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                viewMode === "play_now"
                  ? "bg-red-600 text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Play Now
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
                      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 cursor-pointer transition-colors mb-2">
                        {/* Organisation details */}
                        <div className="flex-1 min-w-0">
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
                        {/* Organisation logo on the right */}
                        {org.LogoUrl && (
                          <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 bg-white">
                            <Image
                              src={`${LOGO_BASE_URL}${org.LogoUrl}`}
                              alt={`${org.OrganisationName} logo`}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ── Play Now View ─────────────────────────────────────────── */}
          {viewMode === "play_now" && (
            <div className="w-full">
              {/* Play Now Header */}
              <div className="mb-6 p-5 bg-gradient-to-r from-red-600 to-red-800 rounded-xl text-white">
                <h2 className="text-2xl font-bold mb-1">Play Now</h2>
                <p className="text-red-100 text-sm">
                  Clubs across Wales are looking for players right now. Find a session, fixture, or programme and get involved — no long-term commitment needed.
                </p>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { value: "", label: "All Opportunities" },
                  { value: "weekend_fixture", label: "Weekend Fixtures" },
                  { value: "social_session", label: "Social & Casual" },
                  { value: "short_term", label: "Short-Term Programmes" },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setPlayNowFilter(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      playNowFilter === cat.value
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Opportunities Cards */}
              {playNowLoading ? (
                <div className="text-center py-12 text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-200 border-t-red-600 mx-auto mb-3" />
                  Loading opportunities...
                </div>
              ) : playNowOpportunities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No opportunities found for this category.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto pr-1">
                  {playNowOpportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getUrgencyColor(opp.date)}`}>
                              {getUrgencyLabel(opp.date)}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(opp.type)}`}>
                              {getTypeLabel(opp.type)}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight mt-2">
                            {opp.title}
                          </h3>
                          <p className="text-sm text-red-700 font-semibold mt-0.5">
                            {opp.organisationName}
                          </p>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-4 pb-3 flex-1">
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                          {opp.description}
                        </p>
                      </div>

                      {/* Card Details */}
                      <div className="px-4 pb-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(opp.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {opp.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{opp.commitment}</span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {opp.sex}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {opp.ageRange}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            opp.spotsAvailable <= 3
                              ? "bg-red-100 text-red-700 font-bold"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {opp.spotsAvailable} spot{opp.spotsAvailable !== 1 ? "s" : ""} left
                          </span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="px-4 py-3">
                        <a
                          href={`mailto:${opp.contactEmail}?subject=Play Now: ${encodeURIComponent(opp.title)}`}
                          className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                        >
                          Get Involved
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Result count */}
              {!playNowLoading && playNowOpportunities.length > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {playNowOpportunities.length}
                  </span>{" "}
                  opportunit{playNowOpportunities.length !== 1 ? "ies" : "y"}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
