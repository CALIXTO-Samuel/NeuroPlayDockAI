
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATABASE_PATH = path.resolve(__dirname, "../../dados_usuarios.json");

const MODULE_ALIASES = {
    geral: "geral",
    alfabetizacao: "alfabetizacao",
    organizacao: "organizacao",
    rotina: "organizacao",
    atividades: "atividades",
    debate: "debate",
    enem: "enem",
    faculdade: "enem",
    reforco: "reforco"
};

function normalizeModule(module = "geral") {
    const normalized = String(module)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return MODULE_ALIASES[normalized] || "geral";
}

function readDatabase() {
    const content = fs.readFileSync(DATABASE_PATH, "utf8");
    const data = JSON.parse(content);

    if (!Array.isArray(data.usuarios) || !Array.isArray(data.conversas)) {
        throw new Error("Estrutura do banco de dados inválida.");
    }

    return data;
}

function writeDatabase(data) {
    const temporaryPath = DATABASE_PATH + ".tmp";

    try {
        fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), "utf8");
        fs.renameSync(temporaryPath, DATABASE_PATH);
    } catch (error) {
        if (fs.existsSync(temporaryPath)) {
            fs.unlinkSync(temporaryPath);
        }

        throw error;
    }
}

function getUserByUsername(username) {
    const db = readDatabase();
    const normalized = String(username || "").trim().toLowerCase();

    return db.usuarios.find(
        user => String(user.usuario).trim().toLowerCase() === normalized
    ) || null;
}

function getUserById(id) {
    const db = readDatabase();
    return db.usuarios.find(user => user.id === id) || null;
}

function createUser(userData) {
    const db = readDatabase();

    const username = String(userData.usuario || "").trim();

    if (db.usuarios.some(
        user => String(user.usuario).toLowerCase() === username.toLowerCase()
    )) {
        throw new Error("Nome de usuário já cadastrado.");
    }

    const user = {
        id: crypto.randomUUID(),
        usuario: username,
        nome: String(userData.nome || "").trim(),
        idade: Number(userData.idade),
        serie: String(userData.serie || "").trim(),
        senhaHash: userData.senhaHash,
        criadoEm: new Date().toISOString()
    };

    db.usuarios.push(user);
    writeDatabase(db);

    return user;
}

function saveMessage(usuarioId, papel, conteudo, modulo = "geral") {
    const db = readDatabase();

    if (!db.usuarios.some(user => user.id === usuarioId)) {
        throw new Error("Usuário não encontrado.");
    }

    const message = {
        id: crypto.randomUUID(),
        usuarioId,
        papel,
        conteudo: String(conteudo),
        modulo: normalizeModule(modulo),
        criadoEm: new Date().toISOString()
    };

    db.conversas.push(message);
    writeDatabase(db);

    return message;
}

function getUserMessages(usuarioId, limit = 30, modulo = null) {
    const db = readDatabase();

    let messages = db.conversas.filter(
        message => message.usuarioId === usuarioId
    );

    if (modulo) {
        const selectedModule = normalizeModule(modulo);

        messages = messages.filter(
            message => normalizeModule(message.modulo) === selectedModule
        );
    }

    return messages
        .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))
        .slice(-Math.max(1, Number(limit) || 30));
}

function clearUserMessages(usuarioId, modulo = null) {
    const db = readDatabase();

    if (modulo) {
        const selectedModule = normalizeModule(modulo);

        db.conversas = db.conversas.filter(message => {
            if (message.usuarioId !== usuarioId) return true;
            return normalizeModule(message.modulo) !== selectedModule;
        });
    } else {
        db.conversas = db.conversas.filter(
            message => message.usuarioId !== usuarioId
        );
    }

    writeDatabase(db);
}

module.exports = {
    readDatabase,
    writeDatabase,
    normalizeModule,
    getUserByUsername,
    getUserById,
    createUser,
    saveMessage,
    getUserMessages,
    clearUserMessages
};
