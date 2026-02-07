import { NextRequest, NextResponse } from "next/server";
import * as sql from "mssql";
import { getPool } from "@/lib/db";

/**
 * GET /api/organisations
 *
 * Returns organisations with their teams, optionally filtered.
 *
 * Query-string parameters (all optional):
 *   sexId              – filter by Sex_team4.Id
 *   gameFormatId       – filter by GameFormat_team4.Id
 *   organisationTypeId – filter by OrganisationType_team4.Id
 *   minAge             – only teams whose MinAge >= value
 *   maxAge             – only teams whose MaxAge <= value
 *
 * Example: /api/organisations?sexId=1&gameFormatId=1&minAge=6&maxAge=18
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sexId = searchParams.get("sexId");
  const gameFormatId = searchParams.get("gameFormatId");
  const organisationTypeId = searchParams.get("organisationTypeId");
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");

  try {
    const pool = await getPool();
    const req = pool.request();

    // ── Base query ────────────────────────────────────────────────────
    // Joins every related table so we can filter on any dimension and
    // return rich data to the frontend.
    let query = `
      SELECT
        o.Id              AS OrganisationId,
        o.Name            AS OrganisationName,
        o.LogoUrl,
        ot.Id             AS OrganisationTypeId,
        ot.Name           AS OrganisationType,
        tt.Id             AS TeamTemplateId,
        tt.Name           AS TeamTemplateName,
        tt.MinAge,
        tt.MaxAge,
        tt.MaxTeamSize,
        gf.Id             AS GameFormatId,
        gf.Value          AS GameFormat,
        s.Id              AS SexId,
        s.Value           AS Sex
      FROM dbo.Team_team4 t
      JOIN dbo.TeamTemplate_team4 tt  ON t.TeamTemplateId   = tt.Id
      JOIN dbo.Organisation_team4 o   ON t.OrganisationId   = o.Id
      JOIN dbo.OrganisationType_team4 ot ON o.OrganisationTypeId = ot.Id
      JOIN dbo.GameFormat_team4 gf    ON tt.GameFormatId    = gf.Id
      LEFT JOIN dbo.Sex_team4 s       ON t.SexId            = s.Id
    `;

    // ── Dynamic WHERE clauses (parameterised) ─────────────────────────
    const conditions: string[] = [];

    if (sexId) {
      conditions.push("t.SexId = @sexId");
      req.input("sexId", sql.Int, parseInt(sexId, 10));
    }

    if (gameFormatId) {
      conditions.push("tt.GameFormatId = @gameFormatId");
      req.input("gameFormatId", sql.Int, parseInt(gameFormatId, 10));
    }

    if (organisationTypeId) {
      conditions.push("o.OrganisationTypeId = @organisationTypeId");
      req.input(
        "organisationTypeId",
        sql.Int,
        parseInt(organisationTypeId, 10)
      );
    }

    if (minAge) {
      conditions.push("tt.MinAge >= @minAge");
      req.input("minAge", sql.Int, parseInt(minAge, 10));
    }

    if (maxAge) {
      conditions.push("tt.MaxAge <= @maxAge");
      req.input("maxAge", sql.Int, parseInt(maxAge, 10));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY o.Name, tt.Name";

    const result = await req.query(query);
    return NextResponse.json({ data: result.recordset });
  } catch (err: unknown) {
    console.error("Organisation query error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load organisations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
