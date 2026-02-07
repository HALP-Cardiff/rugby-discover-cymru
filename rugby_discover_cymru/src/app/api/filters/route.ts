import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * GET /api/filters
 *
 * Returns every available filter option so the frontend can populate dropdowns.
 * Response shape:
 * {
 *   sexes:              [{ Id, Value }],
 *   gameFormats:        [{ Id, Value }],
 *   organisationTypes:  [{ Id, Name, Description }],
 * }
 */
export async function GET() {
  try {
    const pool = await getPool();

    const [sexes, gameFormats, organisationTypes] = await Promise.all([
      pool
        .request()
        .query("SELECT Id, Value FROM dbo.Sex_team4 ORDER BY Value"),
      pool
        .request()
        .query("SELECT Id, Value FROM dbo.GameFormat_team4 ORDER BY Value"),
      pool
        .request()
        .query(
          "SELECT Id, Name, Description FROM dbo.OrganisationType_team4 ORDER BY Name"
        ),
    ]);

    return NextResponse.json({
      sexes: sexes.recordset,
      gameFormats: gameFormats.recordset,
      organisationTypes: organisationTypes.recordset,
    });
  } catch (err: unknown) {
    console.error("Filter fetch error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load filters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
