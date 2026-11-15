
const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const {
    getUserByUsername,
    getUserById,
    createUser
} = require("../database/database");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        sucesso: false,
        erro: "Muitas tentativas. Aguarde alguns minutos."
    }
});

function publicUser(user) {
    return {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
        idade: user.idade,
        serie: user.serie,
        criadoEm: user.criadoEm
    };
}

router.post("/register", async (req, res) => {
    try {
        const { nome, usuario, idade, serie, senha } = req.body;

        if (!nome || !usuario || !idade || !serie || !senha) {
            return res.status(400).json({
                sucesso: false,
                erro: "Preencha todos os campos."
            });
        }

        const cleanName = String(nome).trim();
        const cleanUsername = String(usuario).trim();

        if (cleanName.length < 2 || cleanName.length > 70) {
            return res.status(400).json({
                sucesso: false,
                erro: "O nome deve ter entre 2 e 70 caracteres."
            });
        }

        if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(cleanUsername)) {
            return res.status(400).json({
                sucesso: false,
                erro: "O usuário deve ter de 3 a 24 caracteres, usando letras, números, ponto, hífen ou underline."
            });
        }

        const numericAge = Number(idade);

        if (!Number.isInteger(numericAge) || numericAge < 5 || numericAge > 100) {
            return res.status(400).json({
                sucesso: false,
                erro: "Informe uma idade válida."
            });
        }

        if (String(serie).trim().length > 60) {
            return res.status(400).json({
                sucesso: false,
                erro: "Informe uma série válida."
            });
        }

        if (typeof senha !== "string" || senha.length < 8 || senha.length > 72) {
            return res.status(400).json({
                sucesso: false,
                erro: "A senha deve ter entre 8 e 72 caracteres."
            });
        }

        if (getUserByUsername(cleanUsername)) {
            return res.status(409).json({
                sucesso: false,
                erro: "Este nome de usuário já está cadastrado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const user = createUser({
            id: crypto.randomUUID(),
            nome: cleanName,
            usuario: cleanUsername,
            idade: numericAge,
            serie: String(serie).trim(),
            senhaHash
        });

        req.session.userId = user.id;

        req.session.save(error => {
            if (error) {
                return res.status(500).json({
                    sucesso: false,
                    erro: "Conta criada, mas não foi possível iniciar a sessão."
                });
            }

            res.status(201).json({
                sucesso: true,
                mensagem: "Conta criada com sucesso.",
                usuario: publicUser(user)
            });
        });
    } catch (error) {
        console.error("Erro no cadastro:", error);

        res.status(500).json({
            sucesso: false,
            erro: "Não foi possível realizar o cadastro."
        });
    }
});

router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        if (!usuario || !senha) {
            return res.status(400).json({
                sucesso: false,
                erro: "Informe usuário e senha."
            });
        }

        const user = getUserByUsername(usuario);

        if (!user) {
            return res.status(401).json({
                sucesso: false,
                erro: "Usuário ou senha incorretos."
            });
        }

        const passwordMatches = await bcrypt.compare(
            senha,
            user.senhaHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                sucesso: false,
                erro: "Usuário ou senha incorretos."
            });
        }

        req.session.regenerate(error => {
            if (error) {
                return res.status(500).json({
                    sucesso: false,
                    erro: "Não foi possível iniciar sua sessão."
                });
            }

            req.session.userId = user.id;

            req.session.save(saveError => {
                if (saveError) {
                    return res.status(500).json({
                        sucesso: false,
                        erro: "Não foi possível salvar sua sessão."
                    });
                }

                res.json({
                    sucesso: true,
                    mensagem: "Login realizado com sucesso.",
                    usuario: publicUser(user)
                });
            });
        });
    } catch (error) {
        console.error("Erro no login:", error);

        res.status(500).json({
            sucesso: false,
            erro: "Não foi possível realizar o login."
        });
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                sucesso: false,
                erro: "Não foi possível encerrar a sessão."
            });
        }

        res.clearCookie("neuroplay.sid");

        res.json({
            sucesso: true,
            mensagem: "Sessão encerrada."
        });
    });
});

router.get("/me", requireAuth, (req, res) => {
    const user = getUserById(req.session.userId);

    if (!user) {
        return res.status(401).json({
            sucesso: false,
            erro: "Conta não encontrada."
        });
    }

    res.json({
        sucesso: true,
        usuario: publicUser(user)
    });
});

module.exports = router;
