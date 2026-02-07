import * as sql from "mssql";

const dbConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
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

let poolPromise: Promise<sql.ConnectionPool> | null = null;

/**
 * Returns a shared connection pool, creating one if necessary.
 * The pool is reused across requests (no open/close per request).
 */
export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch((err) => {
      poolPromise = null; // allow retry on next call
      throw err;
    });
  }
  return poolPromise;
}
