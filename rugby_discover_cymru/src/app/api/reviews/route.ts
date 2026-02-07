import { NextRequest, NextResponse } from "next/server";
import * as sql from "mssql";
import { getPool } from "@/lib/db";

// ─── Ensure the Review_team4 table exists ─────────────────────────────────────
async function ensureTable(pool: sql.ConnectionPool) {
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.tables
      WHERE name = 'Review_team4' AND schema_id = SCHEMA_ID('dbo')
    )
    BEGIN
      CREATE TABLE dbo.Review_team4 (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        OrganisationId  INT           NOT NULL,
        ReviewerName    NVARCHAR(100) NOT NULL,
        Rating          INT           NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        Title           NVARCHAR(200) NOT NULL,
        ReviewText      NVARCHAR(MAX) NOT NULL,
        CreatedAt       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Review_Organisation FOREIGN KEY (OrganisationId)
          REFERENCES dbo.Organisation_team4 (Id)
      );
    END
  `);
}

// ─── Seed dummy reviews if the table is empty ─────────────────────────────────
async function seedIfEmpty(pool: sql.ConnectionPool) {
  const countResult = await pool
    .request()
    .query("SELECT COUNT(*) AS cnt FROM dbo.Review_team4");
  if (countResult.recordset[0].cnt > 0) return;

  // Grab first 6 organisation IDs
  const orgResult = await pool
    .request()
    .query("SELECT TOP 6 Id FROM dbo.Organisation_team4 ORDER BY Id");
  const orgIds = orgResult.recordset.map((r: { Id: number }) => r.Id);
  if (orgIds.length === 0) return;

  const reviews = [
    // Organisation 1
    { orgIdx: 0, name: "Dafydd Williams", rating: 5, title: "Fantastic club atmosphere", text: "Joined as a complete beginner last year and the welcome I received was unbelievable. The coaches are patient, the players are supportive, and every Saturday feels like a family gathering. Could not recommend more highly!", date: "2025-11-15T10:30:00" },
    { orgIdx: 0, name: "Sian Davies", rating: 4, title: "Great for kids too", text: "My two sons have been playing at the minis section for three seasons now. The coaching is structured, safeguarding is taken seriously, and the kids absolutely love it. Only reason it is not 5 stars is the changing rooms could do with an update.", date: "2025-12-02T14:20:00" },
    { orgIdx: 0, name: "Tom Jenkins", rating: 5, title: "Proper Welsh rugby club", text: "This is what grassroots rugby is all about. Good people, good rugby, and a proper clubhouse. Training is well organised and the social side is brilliant.", date: "2026-01-10T09:45:00" },
    // Organisation 2
    { orgIdx: 1, name: "Rhian Morgan", rating: 5, title: "Welcoming and inclusive", text: "As a woman returning to rugby after 10 years, I was nervous about joining. The club made me feel at home from day one. Mixed sessions are genuinely mixed — everyone gets involved.", date: "2025-10-22T18:15:00" },
    { orgIdx: 1, name: "Gareth Price", rating: 4, title: "Solid training sessions", text: "Midweek training is well structured. Good mix of fitness, skills, and game play. Coaches know their stuff and always make time for individual feedback.", date: "2025-11-30T20:00:00" },
    { orgIdx: 1, name: "Emily Rees", rating: 3, title: "Good but parking is a pain", text: "Love the club and the people, but getting parked on match days is a nightmare. The rugby itself is top quality and the atmosphere is always buzzing.", date: "2026-01-18T11:30:00" },
    // Organisation 3
    { orgIdx: 2, name: "Owain Hughes", rating: 5, title: "Best decision I ever made", text: "Moved to the area and joined the club to meet people. Three years later, some of my best mates are from the team. Rugby aside, the community aspect is second to none.", date: "2025-09-05T16:00:00" },
    { orgIdx: 2, name: "Catrin Lloyd", rating: 4, title: "Excellent youth setup", text: "My daughter plays in the girls section and it is brilliantly run. The coaches focus on enjoyment first and skills development second — exactly the right way round for young players.", date: "2025-12-14T13:10:00" },
    // Organisation 4
    { orgIdx: 3, name: "Ieuan Thomas", rating: 4, title: "Competitive but friendly", text: "Good standard of rugby at senior level. Training is intense which I appreciate, but the lads are always up for a pint afterwards. Perfect balance of competition and camaraderie.", date: "2026-01-05T19:30:00" },
    { orgIdx: 3, name: "Hannah Jones", rating: 5, title: "Amazing community spirit", text: "Volunteered at the annual fundraiser and was blown away by how many people turned up. This club is more than rugby — it is the heart of the community.", date: "2025-11-20T08:45:00" },
    { orgIdx: 3, name: "Mark Evans", rating: 3, title: "Decent but needs more coaches", text: "The club has grown a lot recently which is great, but they need more qualified coaches to keep up with demand. Sessions can feel crowded at times.", date: "2026-01-25T17:00:00" },
    // Organisation 5
    { orgIdx: 4, name: "Carys Griffiths", rating: 5, title: "Perfect for beginners", text: "Never played rugby in my life before joining the touch rugby sessions here. Everyone is incredibly patient and encouraging. I actually look forward to Tuesday evenings now!", date: "2025-10-30T20:30:00" },
    { orgIdx: 4, name: "Rhodri ap Iorwerth", rating: 4, title: "Great facilities", text: "Recently refurbished clubhouse and the pitch is always in good nick. The committee clearly puts a lot of effort into maintaining everything. Proud to be a member.", date: "2026-02-01T12:15:00" },
    // Organisation 6
    { orgIdx: 5, name: "Lowri Bettws", rating: 5, title: "My home away from home", text: "Been a member for over a decade. Through injuries, life changes, and everything in between — this club has always been there. The people make it special.", date: "2025-08-20T15:45:00" },
    { orgIdx: 5, name: "Dai Shepherd", rating: 4, title: "Strong vets section", text: "The veterans section is thriving. Proper competitive fixtures but with a sensible approach to player welfare. Great way to keep playing into your 40s and beyond.", date: "2025-12-28T10:00:00" },
    { orgIdx: 5, name: "Ffion Harries", rating: 5, title: "Safeguarding is top notch", text: "As a parent, safeguarding is my number one concern. This club takes it incredibly seriously — DBS checks, qualified first aiders at every session, clear policies. Peace of mind.", date: "2026-01-15T14:30:00" },
  ];

  for (const r of reviews) {
    const orgId = orgIds[r.orgIdx];
    if (!orgId) continue;
    await pool
      .request()
      .input("orgId", sql.Int, orgId)
      .input("name", sql.NVarChar(100), r.name)
      .input("rating", sql.Int, r.rating)
      .input("title", sql.NVarChar(200), r.title)
      .input("text", sql.NVarChar(sql.MAX), r.text)
      .input("date", sql.DateTime2, new Date(r.date))
      .query(
        `INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt)
         VALUES (@orgId, @name, @rating, @title, @text, @date)`
      );
  }
}

/**
 * GET /api/reviews?organisationId=123
 *
 * Returns all reviews for a given organisation, newest first.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organisationId = searchParams.get("organisationId");

  if (!organisationId) {
    return NextResponse.json(
      { error: "organisationId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const pool = await getPool();

    // Auto-create table & seed on first call
    await ensureTable(pool);
    await seedIfEmpty(pool);

    const result = await pool
      .request()
      .input("orgId", sql.Int, parseInt(organisationId, 10))
      .query(
        `SELECT Id, OrganisationId, ReviewerName, Rating, Title, ReviewText, CreatedAt
         FROM dbo.Review_team4
         WHERE OrganisationId = @orgId
         ORDER BY CreatedAt DESC`
      );

    // Compute average rating
    const reviews = result.recordset;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { Rating: number }) => sum + r.Rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (err: unknown) {
    console.error("Review fetch error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 *
 * Body: { organisationId, reviewerName, rating, title, reviewText }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organisationId, reviewerName, rating, title, reviewText } = body;

    // Validation
    if (!organisationId || !reviewerName || !rating || !title || !reviewText) {
      return NextResponse.json(
        { error: "All fields are required: organisationId, reviewerName, rating, title, reviewText" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    if (reviewerName.trim().length < 2) {
      return NextResponse.json(
        { error: "Reviewer name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (reviewText.trim().length < 10) {
      return NextResponse.json(
        { error: "Review text must be at least 10 characters" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Ensure table exists
    await ensureTable(pool);

    const result = await pool
      .request()
      .input("orgId", sql.Int, organisationId)
      .input("name", sql.NVarChar(100), reviewerName.trim())
      .input("rating", sql.Int, rating)
      .input("title", sql.NVarChar(200), title.trim())
      .input("text", sql.NVarChar(sql.MAX), reviewText.trim())
      .query(
        `INSERT INTO dbo.Review_team4 (OrganisationId, ReviewerName, Rating, Title, ReviewText)
         OUTPUT INSERTED.*
         VALUES (@orgId, @name, @rating, @title, @text)`
      );

    return NextResponse.json({ review: result.recordset[0] }, { status: 201 });
  } catch (err: unknown) {
    console.error("Review insert error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
