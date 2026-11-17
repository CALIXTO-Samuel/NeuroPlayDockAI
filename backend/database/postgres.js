"use strict";
const { Pool } = require("pg");
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada. Configure a URL interna do PostgreSQL no Render.");
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});
pool.on("error", error => {
    console.error("[DATABASE] Erro inesperado no pool PostgreSQL:", error.message);
});
module.exports = pool;
