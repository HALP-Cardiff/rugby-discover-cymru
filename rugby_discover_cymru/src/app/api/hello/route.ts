import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

const QUERY = `SELECT 
  o.Id, 
  o.Name AS OrganisationName, 
  tt.Name AS TeamTemplateName, 
  tt.MinAge, 
  tt.MaxAge 
FROM dbo.Team_team4 t
JOIN dbo.TeamTemplate_team4 tt ON t.TeamTemplateId = tt.Id
JOIN dbo.Organisation_team4 o ON t.OrganisationId = o.Id;`;

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(QUERY);
    return NextResponse.json({ data: result.recordset });
  } catch (err: unknown) {
    console.error("Database error:", err);
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
