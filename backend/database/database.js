"use strict";
const fs = require("fs");
const path = require("path");
const pool = require("./postgres");
const LEGACY_DATABASE_PATH = path.resolve(__dirname, "../../dados_usuarios.json");

const MODULE_ALIASES = {
    geral: "geral", alfabetizacao: "alfabetizacao", organizacao: "organizacao",
    rotina: "organizacao", atividades: "atividades", debate: "debate",
    enem: "enem", faculdade: "enem", reforco: "reforco"
};

function normalizeModule(module = "geral") {
    const normalized = String(module).trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return MODULE_ALIASES[normalized] || "geral";
}

async function initializeDatabase() {
    await pool.query("SELECT 1");
    await pool.query(
        "CREATE TABLE IF NOT EXISTS neuro_users (" +
        "id TEXT PRIMARY KEY, usuario TEXT NOT NULL, nome TEXT NOT NULL, " +
        "idade INTEGER, serie TEXT, senha_hash TEXT NOT NULL, " +
        "criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW())"
    );
    await pool.query(
        "CREATE UNIQUE INDEX IF NOT EXISTS neuro_users_usuario_lower_idx " +
        "ON neuro_users (LOWER(usuario))"
    );
    await pool.query(
        "CREATE TABLE IF NOT EXISTS neuro_messages (" +
        "id TEXT PRIMARY KEY, usuario_id TEXT NOT NULL REFERENCES neuro_users(id) ON DELETE CASCADE, " +
        "papel TEXT NOT NULL CHECK (papel IN ('user', 'assistant')), " +
        "conteudo TEXT NOT NULL, modulo TEXT NOT NULL DEFAULT 'geral', " +
        "criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW())"
    );
    await pool.query(
        "CREATE INDEX IF NOT EXISTS neuro_messages_user_date_idx " +
        "ON neuro_messages (usuario_id, criado_em)"
    );
    await migrateLegacyJson();
    console.log("[DATABASE] PostgreSQL conectado e tabelas verificadas.");
}

async function migrateLegacyJson() {
    if (!fs.existsSync(LEGACY_DATABASE_PATH)) return;
    let data;
    try {
        data = JSON.parse(fs.readFileSync(LEGACY_DATABASE_PATH, "utf8"));
    } catch (error) {
        console.error("[DATABASE] JSON antigo não pôde ser lido:", error.message);
        return;
    }
    if (!Array.isArray(data.usuarios) || !Array.isArray(data.conversas)) {
        console.warn("[DATABASE] JSON antigo possui formato inesperado; migração ignorada.");
        return;
    }
    let migratedUsers = 0;
    let migratedMessages = 0;
    for (const user of data.usuarios) {
        if (!user || !user.id || !user.usuario || !user.senhaHash) continue;
        const result = await pool.query(
            "INSERT INTO neuro_users (id, usuario, nome, idade, serie, senha_hash, criado_em) " +
            "VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, NOW())) " +
            "ON CONFLICT (id) DO NOTHING",
            [String(user.id), String(user.usuario), String(user.nome || ""),
             Number.isInteger(Number(user.idade)) ? Number(user.idade) : null,
             String(user.serie || ""), String(user.senhaHash), user.criadoEm || null]
        );
        migratedUsers += result.rowCount;
    }
    for (const message of data.conversas) {
        if (!message || !message.id || !message.usuarioId || !message.conteudo) continue;
        if (!["user", "assistant"].includes(message.papel)) continue;
        const result = await pool.query(
            "INSERT INTO neuro_messages (id, usuario_id, papel, conteudo, modulo, criado_em) " +
            "VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW())) " +
            "ON CONFLICT (id) DO NOTHING",
            [String(message.id), String(message.usuarioId), message.papel,
             String(message.conteudo), normalizeModule(message.modulo), message.criadoEm || null]
        );
        migratedMessages += result.rowCount;
    }
    if (migratedUsers || migratedMessages) {
        console.log("[DATABASE] Migração JSON concluída:", {
            usuarios: migratedUsers, mensagens: migratedMessages
        });
    }
}

async function getUserByUsername(username) {
    const normalized = String(username || "").trim().toLowerCase();
    const result = await pool.query(
        'SELECT id, usuario, nome, idade, serie, senha_hash AS "senhaHash", criado_em AS "criadoEm" ' +
        "FROM neuro_users WHERE LOWER(usuario) = $1 LIMIT 1",
        [normalized]
    );
    return result.rows[0] || null;
}

async function getUserById(id) {
    const result = await pool.query(
        'SELECT id, usuario, nome, idade, serie, senha_hash AS "senhaHash", criado_em AS "criadoEm" ' +
        "FROM neuro_users WHERE id = $1 LIMIT 1",
        [id]
    );
    return result.rows[0] || null;
}

async function createUser(userData) {
    const result = await pool.query(
        'INSERT INTO neuro_users (id, usuario, nome, idade, serie, senha_hash) ' +
        'VALUES ($1, $2, $3, $4, $5, $6) ' +
        'RETURNING id, usuario, nome, idade, serie, senha_hash AS "senhaHash", criado_em AS "criadoEm"',
        [userData.id, String(userData.usuario || "").trim(),
         String(userData.nome || "").trim(), Number(userData.idade),
         String(userData.serie || "").trim(), userData.senhaHash]
    );
    return result.rows[0];
}

async function saveMessage(usuarioId, papel, conteudo, modulo = "geral") {
    const crypto = require("crypto");
    const result = await pool.query(
        'INSERT INTO neuro_messages (id, usuario_id, papel, conteudo, modulo) ' +
        'VALUES ($1, $2, $3, $4, $5) ' +
        'RETURNING id, usuario_id AS "usuarioId", papel, conteudo, modulo, criado_em AS "criadoEm"',
        [crypto.randomUUID(), usuarioId, papel, String(conteudo), normalizeModule(modulo)]
    );
    return result.rows[0];
}

async function getUserMessages(usuarioId, limit = 30, modulo = null) {
    const values = [usuarioId, Math.max(1, Number(limit) || 30)];
    let moduleFilter = "";
    if (modulo) {
        values.push(normalizeModule(modulo));
        moduleFilter = " AND modulo = $3";
    }
    const result = await pool.query(
        'SELECT id, usuario_id AS "usuarioId", papel, conteudo, modulo, criado_em AS "criadoEm" ' +
        "FROM (SELECT id, usuario_id, papel, conteudo, modulo, criado_em " +
        "FROM neuro_messages WHERE usuario_id = $1" + moduleFilter +
        " ORDER BY criado_em DESC LIMIT $2) recent ORDER BY criado_em ASC",
        values
    );
    return result.rows;
}

async function clearUserMessages(usuarioId, modulo = null) {
    if (modulo) {
        await pool.query("DELETE FROM neuro_messages WHERE usuario_id = $1 AND modulo = $2",
            [usuarioId, normalizeModule(modulo)]);
    } else {
        await pool.query("DELETE FROM neuro_messages WHERE usuario_id = $1", [usuarioId]);
    }
}

module.exports = {
    initializeDatabase, normalizeModule, getUserByUsername, getUserById,
    createUser, saveMessage, getUserMessages, clearUserMessages
};
