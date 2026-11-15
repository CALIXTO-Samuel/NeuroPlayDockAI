
require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/auth");
const tutorRoutes = require("./routes/tutor");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

const FRONTEND_PATH = path.resolve(__dirname, "../frontend");

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    console.error("ERRO: SESSION_SECRET ausente ou muito curta no .env.");
    process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
    console.error("ERRO: GROQ_API_KEY não configurada no .env.");
    process.exit(1);
}

// Configuração de proxy para ambientes de hospedagem.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Segurança HTTP.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            upgradeInsecureRequests:
                process.env.NODE_ENV === "production" ? [] : null
        }
    }
}));

app.disable("x-powered-by");

app.use(express.json({
    limit: "20kb"
}));

app.use(express.urlencoded({
    extended: false,
    limit: "20kb"
}));

// Sessões persistidas em dados_sessoes.json.
app.use(session({
    name: "neuroplay.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/"
    }
}));

// Sempre iniciar pela tela de login.
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// Rotas da API.
app.use("/api/auth", authRoutes);
app.use("/api/tutor", tutorRoutes);

// Arquivos públicos do frontend.
app.use(express.static(FRONTEND_PATH, {
    index: false,
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

// Página inicial.
app.get("/", (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect("/dashboard.html");
    }

    res.redirect("/login.html");
});

// Tratamento de rotas inexistentes da API.
app.use("/api", (req, res) => {
    res.status(404).json({
        sucesso: false,
        erro: "Rota da API não encontrada."
    });
});

// Tratamento geral de erros.
app.use((error, req, res, next) => {
    console.error("Erro no servidor:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(error.status || 500).json({
        sucesso: false,
        erro: error.status === 413
            ? "A requisição é muito grande."
            : "Ocorreu um erro interno no servidor."
    });
});

// Inicialização.
const server = app.listen(PORT, () => {
    console.log("");
    console.log("======================================");
    console.log("       NEUROPLAYDOCKIA ONLINE");
    console.log("======================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`Modelo IA: ${process.env.GROQ_MODEL || "openai/gpt-oss-20b"}`);
    console.log("======================================");
    console.log("");
});

// Encerramento organizado.
function shutdown() {
    console.log("\nEncerrando NeuroPlayDockIA...");

    server.close(() => {
        console.log("Servidor encerrado.");
        process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = app;
