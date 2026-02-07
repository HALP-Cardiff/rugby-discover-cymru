"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Header from "@/app/components/Header";

const LOGO_BASE_URL = "https://public.wru.wales/organisation/logos/";

interface Organization {
  Id: number;
  OrganisationName: string;
  LogoUrl: string | null;
  TeamTemplateName: string;
  MinAge: number;
  MaxAge: number;
}

export default function OrganizationPage() {
  const params = useParams();
  const id = params.id;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hello");
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const result = await response.json();
        const organizations = result.data || [];
        
        // Find the organization with matching ID
        const foundOrg = organizations.find(
          (org: Organization) => org.Id === parseInt(id as string)
        );
        
        if (!foundOrg) {
          throw new Error("Organization not found");
        }
        
        setOrganization(foundOrg);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch organization"
        );
        console.error("Error fetching organization:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganization();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-600 text-lg">Loading organization details...</div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="text-red-600 text-lg mb-4">
            {error || "Organization not found"}
          </div>
          <Link href="/">
            <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <Header />
      <main className="flex flex-1 flex-col py-12 px-16 bg-white">
        <div className="max-w-4xl w-full mx-auto">
          {/* Back Button */}
          <Link href="/">
            <button className="mb-6 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors">
              ← Back to Home
            </button>
          </Link>

          {/* Organization Header with Logo */}
          <div className="flex items-center gap-6 mb-8">
            {organization.LogoUrl && (
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                <Image
                  src={`${LOGO_BASE_URL}${organization.LogoUrl}`}
                  alt={`${organization.OrganisationName} logo`}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-800">
              {organization.OrganisationName}
            </h1>
          </div>

          {/* Organization Details */}
          <div className="bg-gray-50 rounded-lg border border-gray-300 p-8 space-y-6">
            {/* Team Template */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Team Template
              </h2>
              <p className="text-xl text-gray-800 mt-2">
                {organization.TeamTemplateName}
              </p>
            </div>

            {/* Age Range */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Age Range
              </h2>
              <p className="text-xl text-gray-800 mt-2">
                {organization.MinAge} - {organization.MaxAge} years old
              </p>
            </div>

            {/* Organization ID */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Organization ID
              </h2>
              <p className="text-xl text-gray-800 mt-2">
                {organization.Id}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
