
"use strict";

const express = require("express");
const Groq = require("groq-sdk");

const {
    getUserById,
    normalizeModule
} = require("../database/database");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const MAX_MESSAGE_LENGTH = 5000;
const MAX_HISTORY_MESSAGES = 30;
const REQUEST_TIMEOUT = 45000;

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não configurada.");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: REQUEST_TIMEOUT,
    maxRetries: 1
});

// =====================================================
// MÓDULOS
// =====================================================

const MODULES = {
    geral: {
        nome: "Aprendizagem geral",
        instrucoes: "Ensine conteúdos de diferentes disciplinas."
    },

    alfabetizacao: {
        nome: "Alfabetização",
        instrucoes: "Trabalhe leitura, escrita, interpretação e vocabulário."
    },

    organizacao: {
        nome: "Organização",
        instrucoes: "Ajude a organizar estudos, tarefas e metas realistas."
    },

    atividades: {
        nome: "Atividades",
        instrucoes: "Ajude a interpretar enunciados e desenvolver o raciocínio."
    },

    debate: {
        nome: "Debate",
        instrucoes: "Estimule pensamento crítico e argumentação respeitosa."
    },

    enem: {
        nome: "Faculdade e ENEM",
        instrucoes: "Ensine conteúdos e estratégias de aprendizagem gradualmente."
    },

    reforco: {
        nome: "Reforço escolar",
        instrucoes: "Identifique dificuldades e explique conceitos de maneira progressiva."
    }
};

// =====================================================
// PROMPT PRINCIPAL
// =====================================================

function buildSystemPrompt(user, module) {
    const selected = MODULES[module] || MODULES.geral;

    return `
Você é o NeuroPlay Tutor, a inteligência educacional
da plataforma NeuroPlayDockIA.

Sua missão é ajudar o estudante a aprender de verdade,
desenvolvendo compreensão, autonomia e pensamento crítico.

PERFIL DO ESTUDANTE
Nome: ${user.nome || "Estudante"}
Idade: ${user.idade || "Não informada"}
Série: ${user.serie || "Não informada"}

MÓDULO ATUAL
${selected.nome}

ORIENTAÇÃO DO MÓDULO
${selected.instrucoes}

========================================
1. IDENTIDADE E COMPORTAMENTO
========================================

- Seja um tutor educacional, não um robô de respostas.
- Responda ao que o estudante realmente perguntou.
- Não transforme toda conversa em exercício.
- Não faça perguntas desnecessárias.
- Não seja infantilizado.
- Respeite o ritmo de aprendizagem.
- Seja paciente, natural e objetivo.

========================================
2. COMO ENSINAR
========================================

Quando o estudante apresentar uma dúvida:

1. Identifique o que ele deseja compreender.
2. Explique diretamente o conceito.
3. Use exemplos adequados à sua série.
4. Divida assuntos complexos em partes menores.
5. Verifique a compreensão somente quando fizer sentido.

Não obrigue o estudante a responder perguntas
antes de receber uma explicação.

Se ele pedir uma explicação, explique.

========================================
3. ANÁLISE DAS RESPOSTAS
========================================

CORRETA:
- Reconheça o acerto.
- Explique brevemente por que está correto.
- Avance sem repetir o conteúdo desnecessariamente.

PARCIALMENTE CORRETA:
- Identifique exatamente o que está certo.
- Explique o que ainda falta.
- Dê uma pista útil.
- Não trate a resposta como totalmente errada.

INCORRETA:
- Mostre o equívoco com respeito.
- Explique o conceito de outra maneira.
- Use outro exemplo ou analogia.
- Não repita a mesma pergunta.

NÃO SABE:
- Não pressione.
- Comece com uma explicação simples.
- Ofereça uma pista.
- Se necessário, apresente a solução conceitual.

========================================
4. PREVENÇÃO DE REPETIÇÕES
========================================

Considere todas as mensagens anteriores disponíveis.

Nunca:
- Ignore uma resposta que o estudante já forneceu.
- Faça novamente uma pergunta já respondida.
- Repita uma pista sem acrescentar informação.
- Insista na mesma estratégia quando ela não funcionou.

Se houver dificuldade após duas tentativas:
- Mude a abordagem.
- Apresente uma analogia diferente.
- Utilize um exemplo concreto.
- Explique o conceito de forma mais completa.

Não fique preso em ciclos de perguntas.

========================================
5. ATIVIDADES ESCOLARES
========================================

Quando o estudante apresentar uma atividade:

- Ajude a interpretar o enunciado.
- Explique os conceitos necessários.
- Oriente o raciocínio.
- Utilize pistas progressivas quando apropriado.
- Ajude o estudante a construir sua própria resposta.

Não confunda ensinar um conteúdo com simplesmente
entregar uma resposta sem explicação.

Você pode fornecer explicações completas,
definições e conhecimentos científicos.

========================================
6. ADAPTAÇÃO ESCOLAR
========================================

- Considere a idade e a série.
- Utilize português brasileiro.
- Explique termos técnicos.
- Comece pelo nível adequado ao estudante.
- Aumente a complexidade gradualmente.
- Não subestime a capacidade do estudante.

========================================
7. FORMATO DAS RESPOSTAS
========================================

- Use linguagem natural.
- Prefira explicações claras.
- Utilize listas quando ajudarem.
- Evite textos enormes sem necessidade.
- Não use elogios exagerados.
- Faça no máximo uma pergunta por mensagem.
- Não termine todas as respostas com perguntas.
- Não invente informações.
- Admita quando não souber.

========================================
8. CONTINUIDADE DA CONVERSA
========================================

Observe o histórico recebido.

Identifique:
- O que já foi explicado.
- O que o estudante compreendeu.
- Quais respostas estavam parcialmente corretas.
- Quais dúvidas continuam abertas.
- Quais estratégias já foram utilizadas.

Use essas informações para adaptar sua próxima resposta.

========================================
REGRA FINAL
========================================

O objetivo não é fazer o estudante responder
à maior quantidade possível de perguntas.

O objetivo é ajudá-lo a compreender,
raciocinar e aprender com autonomia.

Você é o NeuroPlay Tutor.
Ensine com clareza, acompanhe o raciocínio
e adapte sua explicação ao estudante.
`;
}

// =====================================================
// CONSTRUÇÃO DO HISTÓRICO
// =====================================================

function getHistory(req, module) {
    const history = req.session.chatHistory?.[module];

    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(item =>
            item &&
            typeof item.conteudo === "string" &&
            ["user", "assistant", "assistente"].includes(item.papel)
        )
        .slice(-MAX_HISTORY_MESSAGES);
}

// =====================================================
// ENVIO DE MENSAGEM
// =====================================================

router.post("/message", requireAuth, async (req, res) => {
    const startedAt = Date.now();

    try {
        const user = getUserById(req.session.userId);

        if (!user) {
            return res.status(401).json({
                sucesso: false,
                erro: "Usuário não encontrado. Entre novamente."
            });
        }

        const mensagem =
            typeof req.body?.mensagem === "string"
                ? req.body.mensagem.trim()
                : "";

        if (!mensagem) {
            return res.status(400).json({
                sucesso: false,
                erro: "Digite uma mensagem."
            });
        }

        if (mensagem.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({
                sucesso: false,
                erro: "A mensagem ultrapassou 5.000 caracteres."
            });
        }

        const modulo = normalizeModule(req.body.modulo);
        const history = getHistory(req, modulo);

        const messages = [
            {
                role: "system",
                content: buildSystemPrompt(user, modulo)
            },

            ...history.map(item => ({
                role: item.papel === "user" ? "user" : "assistant",
                content: item.conteudo
            })),

            {
                role: "user",
                content: mensagem
            }
        ];

        console.log(`[TUTOR] Solicitação recebida | módulo: ${modulo}`);

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages,
            temperature: 0.4,
            max_tokens: 700
        });

        const resposta =
            completion.choices?.[0]?.message?.content?.trim();

        if (!resposta) {
            throw new Error("A Groq retornou uma resposta vazia.");
        }

        const agora = new Date().toISOString();

        const mensagemSalva = {
            papel: "user",
            conteudo: mensagem,
            modulo,
            criadoEm: agora
        };

        const respostaSalva = {
            papel: "assistant",
            conteudo: resposta,
            modulo,
            criadoEm: new Date().toISOString()
        };

        req.session.chatHistory ||= {};

        req.session.chatHistory[modulo] = [
            ...history,
            mensagemSalva,
            respostaSalva
        ].slice(-100);

        // Salva a sessão antes de responder ao frontend.
        req.session.save(error => {
            if (error) {
                console.error("[TUTOR] Erro ao salvar sessão:", error.message);

                return res.status(500).json({
                    sucesso: false,
                    erro: "A resposta foi gerada, mas não foi possível salvar a conversa."
                });
            }

            console.log(
                `[TUTOR] Resposta enviada | ${Date.now() - startedAt}ms`
            );

            return res.json({
                sucesso: true,
                modulo,
                mensagem: mensagemSalva,
                resposta
            });
        });

    } catch (error) {
        console.error("[TUTOR] Falha na geração:", {
            message: error.message,
            status: error.status,
            code: error.code,
            elapsed: Date.now() - startedAt
        });

        if (res.headersSent) {
            return;
        }

        if (error.status === 401 || error.status === 403) {
            return res.status(502).json({
                sucesso: false,
                erro: "A autenticação com o serviço de IA falhou. Verifique a configuração da Groq."
            });
        }

        if (error.status === 429) {
            return res.status(503).json({
                sucesso: false,
                erro: "O serviço de IA está temporariamente ocupado. Tente novamente em instantes."
            });
        }

        if (
            error.name === "APIConnectionTimeoutError" ||
            error.name === "APIConnectionError"
        ) {
            return res.status(504).json({
                sucesso: false,
                erro: "A conexão com a IA demorou demais. Tente novamente."
            });
        }

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível gerar uma resposta agora. Tente novamente."
        });
    }
});

// =====================================================
// CONSULTAR HISTÓRICO
// =====================================================

router.get("/history", requireAuth, (req, res) => {
    try {
        const modulo = req.query.modulo
            ? normalizeModule(req.query.modulo)
            : null;

        const sessionHistory = req.session.chatHistory || {};

        const mensagens = modulo
            ? (sessionHistory[modulo] || [])
            : Object.values(sessionHistory).flat();

        return res.json({
            sucesso: true,
            modulo,
            mensagens
        });

    } catch (error) {
        console.error("[TUTOR] Erro no histórico:", error.message);

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível carregar o histórico."
        });
    }
});

// =====================================================
// NOVA CONVERSA
// =====================================================

router.delete("/history", requireAuth, (req, res) => {
    try {
        const modulo = normalizeModule(req.query.modulo);

        if (req.session.chatHistory) {
            delete req.session.chatHistory[modulo];
        }

        req.session.save(error => {
            if (error) {
                console.error("[TUTOR] Erro ao limpar sessão:", error.message);

                return res.status(500).json({
                    sucesso: false,
                    erro: "Não foi possível iniciar uma nova conversa."
                });
            }

            return res.json({
                sucesso: true,
                mensagem: "Nova conversa iniciada."
            });
        });

    } catch (error) {
        console.error("[TUTOR] Erro ao iniciar conversa:", error.message);

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível iniciar uma nova conversa."
        });
    }
});

module.exports = router;
