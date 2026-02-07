import { NextResponse } from "next/server";
import * as sql from "mssql";

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT ? process.env.DB_ENCRYPT === "true" : true,
    trustServerCertificate: process.env.DB_TRUST_CERT
      ? process.env.DB_TRUST_CERT === "true"
      : true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const QUERY = `SELECT 
  o.Id, 
  o.Name AS OrganisationName, 
  tt.Name AS TeamTemplateName, 
  tt.MinAge, 
  tt.MaxAge 
FROM dbo.Team_team1 t
JOIN dbo.TeamTemplate_team1 tt ON t.TeamTemplateId = tt.Id
JOIN dbo.Organisation_team1 o ON t.OrganisationId = o.Id;`;

export async function GET() {
  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await sql.connect(dbConfig as any);
    const result = await pool.request().query(QUERY);
    return NextResponse.json({ data: result.recordset });
  } catch (err: any) {
    console.error("Database error:", err);
    return NextResponse.json(
      { error: err?.message || "Database error" },
      { status: 500 },
    );
  } finally {
    try {
      if (pool) await pool.close();
    } catch (e) {
      // ignore
    }
  }
}
