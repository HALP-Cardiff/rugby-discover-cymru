"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

const LOGO_BASE_URL = "https://public.wru.wales/organisation/logos/";

interface Organization {
  Id: number;
  OrganisationName: string;
  LogoUrl: string | null;
  TeamTemplateName: string;
  MinAge: number;
  MaxAge: number;
}

interface Review {
  Id: number;
  OrganisationId: number;
  ReviewerName: string;
  Rating: number;
  Title: string;
  ReviewText: string;
  CreatedAt: string;
}

// Dummy contact & safeguarding data per club
const CLUB_CONTACTS: Record<
  number,
  {
    secretary: { name: string; email: string; phone: string };
    safeguarding: { name: string; email: string; phone: string };
  }
> = {
  // Default fallback used for any org id not explicitly listed
};

function getClubContacts(orgId: number) {
  if (CLUB_CONTACTS[orgId]) return CLUB_CONTACTS[orgId];
  // Generate deterministic dummy data based on org id
  return {
    secretary: {
      name: "Rhys Morgan",
      email: `secretary@club${orgId}.wru.example.com`,
      phone: "+44 29 2000 " + String(orgId).padStart(4, "0"),
    },
    safeguarding: {
      name: "Nia Evans",
      email: `safeguarding@club${orgId}.wru.example.com`,
      phone: "+44 29 2001 " + String(orgId).padStart(4, "0"),
    },
  };
}

export default function OrganizationPage() {
  const params = useParams();
  const id = params.id;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Review state ────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    reviewerName: "",
    rating: 5,
    title: "",
    reviewText: "",
  });
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // ── Fetch organisation ──────────────────────────────────────────────
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

  // ── Fetch reviews ───────────────────────────────────────────────────
  const fetchReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/reviews?organisationId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Submit review ───────────────────────────────────────────────────
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(false);

    if (!reviewFormData.reviewerName.trim()) {
      setReviewError("Please enter your name.");
      return;
    }
    if (!reviewFormData.title.trim()) {
      setReviewError("Please enter a review title.");
      return;
    }
    if (reviewFormData.reviewText.trim().length < 10) {
      setReviewError("Review must be at least 10 characters long.");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: parseInt(id as string),
          reviewerName: reviewFormData.reviewerName.trim(),
          rating: reviewFormData.rating,
          title: reviewFormData.title.trim(),
          reviewText: reviewFormData.reviewText.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit review");
      }

      setReviewSuccess(true);
      setReviewFormData({ reviewerName: "", rating: 5, title: "", reviewText: "" });
      setShowReviewForm(false);
      // Refresh reviews
      await fetchReviews();
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

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

          {/* ── Club Contact & Safeguarding ────────────────────────────── */}
          {(() => {
            const contacts = getClubContacts(organization.Id);
            return (
              <section className="mt-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Club Contact &amp; Safeguarding
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Club Secretary Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Club Secretary
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {contacts.secretary.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{contacts.secretary.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{contacts.secretary.phone}</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`mailto:${contacts.secretary.email}?subject=Enquiry – ${organization.OrganisationName}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </a>
                      <a
                        href={`tel:${contacts.secretary.phone}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone
                      </a>
                    </div>
                  </div>

                  {/* Safeguarding Officer Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Safeguarding Officer
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {contacts.safeguarding.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{contacts.safeguarding.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{contacts.safeguarding.phone}</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`mailto:${contacts.safeguarding.email}?subject=Safeguarding Enquiry – ${organization.OrganisationName}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </a>
                      <a
                        href={`tel:${contacts.safeguarding.phone}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone
                      </a>
                    </div>
                  </div>
                </div>

                {/* Safeguarding Information Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-800 mb-2">
                        Safeguarding &amp; Welfare
                      </h3>
                      <p className="text-sm text-emerald-700 leading-relaxed mb-3">
                        The safety and welfare of every participant is our highest priority.
                        All coaches and volunteers at this club hold valid DBS checks and have completed
                        WRU safeguarding training. We follow the Welsh Rugby Union&apos;s safeguarding
                        policies and procedures to ensure a safe, inclusive environment for players
                        of all ages.
                      </p>
                      <ul className="text-sm text-emerald-700 space-y-1.5 mb-4">
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          DBS-checked coaches and volunteers
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          WRU-accredited safeguarding training completed
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Dedicated safeguarding officer available for concerns
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Inclusive and welcoming environment for all abilities
                        </li>
                      </ul>
                      <a
                        href="https://www.wru.wales/safeguarding/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 transition-colors"
                      >
                        Learn more about WRU Safeguarding
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Enquiry Form CTA */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Interested in joining {organization.OrganisationName}?
                  </h3>
                  <p className="text-sm text-gray-600 mb-5 max-w-lg mx-auto">
                    Whether you&apos;re a complete beginner or a returning player, we&apos;d love to hear from you.
                    Get in touch with the club directly or send an enquiry below.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`mailto:${contacts.secretary.email}?subject=Membership Enquiry – ${organization.OrganisationName}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Enquiry
                    </a>
                    <a
                      href={`tel:${contacts.secretary.phone}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call the Club
                    </a>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ── Reviews & Community Insight ─────────────────────────────── */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Reviews &amp; Community Insight
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Hear from members about the club culture and atmosphere
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReviewForm(!showReviewForm);
                  setReviewError(null);
                  setReviewSuccess(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Write a Review
              </button>
            </div>

            {/* Average Rating Summary */}
            {totalReviews > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-amber-700">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(averageRating)
                              ? "text-amber-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-xs text-amber-600 mt-1">out of 5</div>
                  </div>
                  <div className="border-l border-amber-200 pl-6">
                    <div className="text-sm text-amber-800 font-semibold">
                      {totalReviews} {totalReviews === 1 ? "review" : "reviews"} from club members
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Reviews help new players understand what to expect when joining this club.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success message */}
            {reviewSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700 font-medium">
                  Your review has been submitted successfully. Thank you for your feedback!
                </p>
              </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Share Your Experience
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="reviewerName" className="block text-sm font-semibold text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      id="reviewerName"
                      type="text"
                      value={reviewFormData.reviewerName}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, reviewerName: e.target.value })
                      }
                      placeholder="e.g. Rhys Morgan"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setReviewFormData({ ...reviewFormData, rating: star })
                          }
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <svg
                            className={`w-8 h-8 ${
                              star <= reviewFormData.rating
                                ? "text-amber-400"
                                : "text-gray-300 hover:text-amber-200"
                            } transition-colors`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        {reviewFormData.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="reviewTitle" className="block text-sm font-semibold text-gray-700 mb-1">
                      Review Title
                    </label>
                    <input
                      id="reviewTitle"
                      type="text"
                      value={reviewFormData.title}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, title: e.target.value })
                      }
                      placeholder="e.g. Fantastic club atmosphere"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Review Text */}
                  <div>
                    <label htmlFor="reviewText" className="block text-sm font-semibold text-gray-700 mb-1">
                      Your Review
                    </label>
                    <textarea
                      id="reviewText"
                      value={reviewFormData.reviewText}
                      onChange={(e) =>
                        setReviewFormData({ ...reviewFormData, reviewText: e.target.value })
                      }
                      placeholder="Tell other players about your experience at this club..."
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-vertical"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
                  </div>

                  {/* Error */}
                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700">{reviewError}</p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      {submittingReview ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewError(null);
                      }}
                      className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">Loading reviews...</div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 text-sm font-medium mb-1">No reviews yet</p>
                <p className="text-gray-400 text-xs">
                  Be the first to share your experience at this club!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.Id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-red-600">
                            {review.ReviewerName.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {review.ReviewerName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.CreatedAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.Rating
                                ? "text-amber-400"
                                : "text-gray-200"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <h4 className="text-base font-semibold text-gray-800 mb-2">
                      {review.Title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {review.ReviewText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
