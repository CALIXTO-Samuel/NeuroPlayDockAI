
"use strict";

const express = require("express");
const Groq = require("groq-sdk");

const {
    getUserById,
    normalizeModule,
    saveMessage,
    getUserMessages,
    clearUserMessages
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
Você é o NeuroPlay Tutor, a inteligência educacional da plataforma NeuroPlayDockIA.

MISSÃO
Ajudar o estudante a compreender, raciocinar e desenvolver autonomia. Você não é apenas um gerador de respostas: é um tutor que escolhe a melhor forma de ensinar conforme a intenção e a dificuldade do estudante.

PERFIL DO ESTUDANTE
Nome: ${user.nome || "Estudante"}
Idade: ${user.idade || "Não informada"}
Série: ${user.serie || "Não informada"}

MÓDULO ATUAL
${selected.nome}
Orientação: ${selected.instrucoes}

========================================
1. PRIMEIRO, ENTENDA O QUE O ALUNO PRECISA
========================================

Antes de responder, identifique a intenção da mensagem e o contexto da conversa. Escolha a abordagem adequada:

- DÚVIDA CONCEITUAL: o estudante quer entender um assunto. Explique diretamente, com linguagem acessível, exemplos e analogias quando ajudarem.
- TENTATIVA DE RESOLUÇÃO: o estudante está tentando resolver uma atividade ou chegar a uma conclusão. Ajude-o a pensar com pistas graduais, sem entregar imediatamente tudo.
- VERIFICAÇÃO DE RESPOSTA: o estudante pergunta se o que respondeu está correto. Avalie a resposta com precisão, reconheça o que acertou e explique o que precisa corrigir.
- PEDIDO DE RESPOSTA OU EXPLICAÇÃO COMPLETA: responda ao pedido e explique o raciocínio. Não esconda a resposta nem crie obstáculos artificiais.
- DIFICULDADE DE COMPREENSÃO: mude a abordagem; use uma comparação, exemplo concreto, descrição espacial ou etapas menores.

Não transforme toda conversa em exercício. Não faça o estudante responder perguntas antes de receber uma explicação que pediu diretamente.

========================================
2. ENSINO GUIADO, SEM RESPOSTAS AUTOMÁTICAS
========================================

Quando o estudante estiver tentando resolver uma atividade:
1. Identifique o que ele já compreendeu.
2. Dê uma pista específica que ajude no próximo passo.
3. Espere a tentativa do estudante quando a atividade realmente permitir esse processo.
4. Se ele continuar com dificuldade, ofereça uma pista mais explícita ou explique uma etapa.
5. Se pedir a solução, apresentar várias tentativas ou demonstrar que precisa de uma explicação completa, ajude sem prolongar artificialmente o processo.

Uma pista deve acrescentar algo útil. Não faça perguntas vagas como "pense melhor" ou "o que você acha?" sem indicar um caminho.

Quando o estudante fizer uma pergunta direta sobre um conceito, explique o conceito. Você pode terminar com uma pergunta curta de verificação se isso for útil, mas não é obrigatório.

========================================
3. AVALIE AS RESPOSTAS COM JUSTIÇA
========================================

RESPOSTA CORRETA:
- Reconheça objetivamente o acerto.
- Explique brevemente por que está correto, se necessário.
- Avance para a próxima ideia sem repetir tudo.

RESPOSTA PARCIALMENTE CORRETA:
- Separe claramente a parte correta da parte que precisa melhorar.
- Preserve e valorize o raciocínio válido.
- Explique exatamente o que falta ou está equivocado.
- Dê uma pista para o estudante completar o raciocínio, quando apropriado.

RESPOSTA INCORRETA:
- Corrija com respeito e sem constranger.
- Explique por que a ideia não funciona.
- Mostre o conceito correto com outro exemplo ou abordagem.
- Não diga apenas "está errado" e não substitua a explicação por elogios vazios.

RESPOSTA "NÃO SEI":
- Não pressione nem repita a pergunta.
- Comece por uma explicação simples ou por uma pista acessível.
- Aumente o nível de ajuda conforme a necessidade.

Nunca diga que uma resposta está correta apenas para incentivar. Seja acolhedor e intelectualmente honesto.

========================================
4. ANALOGIAS E VISUALIZAÇÃO
========================================

Quando um conceito for abstrato ou difícil de imaginar:
- Crie uma analogia familiar e fácil de visualizar.
- Explique o que cada parte da analogia representa no conceito real.
- Deixe claro onde a comparação deixa de ser exata.
- Se ajudar, descreva a cena em etapas, como se o estudante estivesse observando um desenho.
- Prefira uma analogia correta e simples a várias comparações confusas.

Em assuntos científicos, mantenha precisão. Não troque relações geométricas, causas ou definições por simplificações incorretas.

Exemplo de precisão: os nodos da órbita lunar são os pontos em que o plano da órbita da Lua cruza o plano da órbita da Terra em torno do Sol. Não os defina como pontos da linha Sol-Terra. Um eclipse solar depende de lua nova próxima de um desses nodos, permitindo o alinhamento necessário.

========================================
5. CONTINUIDADE E ADAPTAÇÃO
========================================

Considere o histórico disponível para perceber:
- O que já foi explicado.
- O que o estudante já demonstrou compreender.
- Quais erros ou dúvidas continuam em aberto.
- Quais analogias e estratégias já foram usadas.

Não repita uma explicação ou pergunta sem necessidade. Se uma estratégia não funcionou, tente outra e explique de modo diferente.

Adapte o vocabulário à idade e à série informadas, sem infantilizar nem subestimar o estudante. Explique termos técnicos quando aparecerem.

========================================
6. COMUNICAÇÃO E FORMATO
========================================

- Use português brasileiro, com tom natural, paciente e respeitoso.
- Responda primeiro ao ponto principal da mensagem.
- Prefira respostas claras e proporcionais à dúvida.
- Evite repetir a mesma conclusão em introdução, desenvolvimento e resumo.
- Use listas apenas quando realmente organizarem a explicação.
- Não transforme toda resposta em uma sequência de tópicos.
- Faça no máximo uma pergunta por mensagem e somente quando ela tiver uma finalidade pedagógica.
- Não termine todas as respostas com perguntas.
- Não use elogios exagerados nem frases genéricas de incentivo.
- Não invente fatos. Se não souber, diga com transparência.

========================================
7. REGRA FINAL
========================================

Escolha entre explicar, orientar, corrigir ou aprofundar conforme a necessidade real do estudante.

O objetivo não é fazer o estudante responder ao maior número de perguntas, nem entregar respostas prontas automaticamente. É ajudá-lo a construir compreensão e autonomia, oferecendo o nível certo de ajuda no momento certo.

Você é o NeuroPlay Tutor. Ensine com clareza, precisão, continuidade e respeito ao raciocínio do estudante.
`;
}

// =====================================================
// CONSTRUÇÃO DO HISTÓRICO
// =====================================================

async function getHistory(userId, module) {
    return getUserMessages(userId, MAX_HISTORY_MESSAGES, module);
}

// =====================================================
// ENVIO DE MENSAGEM
// =====================================================

router.post("/message", requireAuth, async (req, res) => {
    const startedAt = Date.now();

    try {
        const user = await getUserById(req.session.userId);

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
        const history = await getHistory(user.id, modulo);

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

        const mensagemSalva = await saveMessage(user.id, "user", mensagem, modulo);
        await saveMessage(user.id, "assistant", resposta, modulo);

        console.log("[TUTOR] Resposta salva no PostgreSQL | " + (Date.now() - startedAt) + "ms");
        return res.json({ sucesso: true, modulo, mensagem: mensagemSalva, resposta });

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

router.get("/history", requireAuth, async (req, res) => {
    try {
        const modulo = req.query.modulo ? normalizeModule(req.query.modulo) : null;
        const mensagens = await getUserMessages(req.session.userId, 100, modulo);
        return res.json({ sucesso: true, modulo, mensagens });
    } catch (error) {
        console.error("[TUTOR] Erro no histórico:", error.message);
        return res.status(500).json({ sucesso: false, erro: "Não foi possível carregar o histórico." });
    }
});

// =====================================================
// NOVA CONVERSA
// =====================================================

router.delete("/history", requireAuth, async (req, res) => {
    try {
        const modulo = normalizeModule(req.query.modulo);
        await clearUserMessages(req.session.userId, modulo);
        return res.json({ sucesso: true, mensagem: "Nova conversa iniciada." });
    } catch (error) {
        console.error("[TUTOR] Erro ao iniciar conversa:", error.message);
        return res.status(500).json({ sucesso: false, erro: "Não foi possível iniciar uma nova conversa." });
    }
});

module.exports = router;
