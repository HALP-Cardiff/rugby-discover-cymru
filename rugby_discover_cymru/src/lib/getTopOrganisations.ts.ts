import { getPool } from "./db";

export async function getTopOrganisations() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT TOP 10 Name
    FROM dbo.Organisation_team4
  `);

  return result.recordset.map((r) => r.Name as string);
}
