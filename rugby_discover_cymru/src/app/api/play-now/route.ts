import { NextRequest, NextResponse } from "next/server";
import playNowData from "@/data/playNow.json";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // weekend_fixture | social_session | short_term
    const sex = searchParams.get("sex"); // Male | Female | Mixed
    const intensity = searchParams.get("intensity"); // Competitive | Social | Casual

    let results = [...playNowData];

    if (type) {
      results = results.filter((item) => item.type === type);
    }

    if (sex) {
      results = results.filter(
        (item) =>
          item.sex.toLowerCase() === sex.toLowerCase() ||
          item.sex.toLowerCase() === "mixed"
      );
    }

    if (intensity) {
      results = results.filter(
        (item) => item.intensity.toLowerCase() === intensity.toLowerCase()
      );
    }

    // Sort by date (soonest first), then by spots available (fewest first for urgency)
    results.sort((a, b) => {
      const dateCompare =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.spotsAvailable - b.spotsAvailable;
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Play Now API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch play now opportunities" },
      { status: 500 }
    );
  }
}
