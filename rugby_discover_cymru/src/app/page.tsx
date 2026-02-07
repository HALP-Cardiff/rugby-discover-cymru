"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "./components/Header";
import "./globals.css";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

interface Organization {
  Id: number;
  OrganisationName: string;
  TeamTemplateName: string;
  MinAge: number;
  MaxAge: number;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hello");
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const result = await response.json();
        setOrganizations(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch organizations",
        );
        console.error("Error fetching organizations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <Header />
      <main className="flex flex-1 w-full flex-col items-start justify-start px-16 bg-white">
        <div className="flex flex-col items-start max-w-3xl w-full">
          <div className="mb-8"></div>
            <h1 className="text-5xl font-bold text-gray-900 mb-1">
              Discover Welsh Rugby
            </h1>
          </div>
          {/* View Toggle Buttons */}
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

          {viewMode === "map" && (
            <div className="w-175 flex flex-col items-start h-96">
              {loading ? (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  Loading organizations...
                </div>
              ) : error ? (
                <div className="w-full h-96 bg-red-100 rounded-lg flex items-center justify-center text-red-700">
                  {error}
                </div>
              ) : organizations.length === 0 ? (
                <div className="w-full h-96 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-700">
                  No organizations found with location data
                </div>
              ) : (
                <MapComponent organizations={organizations} />
              )}
            </div>
          )}

          {viewMode === "list" && (
            <div className="w-175 h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-600">
                  Loading organizations...
                </div>
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : organizations.length === 0 ? (
                <div className="text-center text-yellow-600">
                  No organizations found
                </div>
              ) : (
                <div className="space-y-3">
                  {organizations.map((org, index) => (
                    <Link key={`${org.Id}-${org.OrganisationName}-${index}`} href={`/org/${org.Id}`}>
                      <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 cursor-pointer transition-colors">
                        <p className="font-semibold text-gray-800">
                          {org.OrganisationName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Team: {org.TeamTemplateName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Age Range: {org.MinAge} - {org.MaxAge}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="mb-8">
            
          </div>
      </main>
      <button
        className="fixed bottom-4 right-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => (window.location.href = "/club_page")}
      >
        Club page
      </button>
    </div>
  );
}
