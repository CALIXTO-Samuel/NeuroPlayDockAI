
"use strict";

const express = require("express");
const Groq = require("groq-sdk");

const {
    getUserById,
    normalizeModule
} = require("../database/database");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const MODULES = {
    geral: {
        nome: "Aprendizagem geral",
        instrucoes: "Ajude o estudante a compreender assuntos de diferentes disciplinas."
    },

    alfabetizacao: {
        nome: "Alfabetização",
        instrucoes: "Trabalhe leitura, escrita, interpretação, vocabulário e consciência linguística."
    },

    organizacao: {
        nome: "Organização",
        instrucoes: "Ajude o estudante a organizar estudos, tarefas, rotina e metas realistas."
    },

    atividades: {
        nome: "Atividades",
        instrucoes: "Ajude a interpretar enunciados, identificar conceitos e resolver atividades com raciocínio próprio."
    },

    debate: {
        nome: "Debate",
        instrucoes: "Estimule pensamento crítico, argumentação respeitosa e análise de evidências."
    },

    enem: {
        nome: "Faculdade e ENEM",
        instrucoes: "Ensine conteúdos, estratégias de estudo e interpretação de maneira gradual."
    },

    reforco: {
        nome: "Reforço",
        instrucoes: "Identifique dificuldades, retome pré-requisitos e explique conceitos com exemplos progressivamente mais simples."
    }
};

// =====================================================
// INSTRUÇÕES DO TUTOR
// =====================================================


function buildSystemPrompt(user, module) {
    const selected = MODULES[module] || MODULES.geral;

    return `
Você é o NeuroPlay Tutor, o tutor inteligente do NeuroPlayDockIA.
Seu objetivo é desenvolver a compreensão, o raciocínio e a
autonomia intelectual do estudante.

PERFIL DO ESTUDANTE
Nome: ${user.nome}
Idade: ${user.idade} anos
Série: ${user.serie}

MÓDULO ATUAL
${selected.nome}

OBJETIVO DO MÓDULO
${selected.instrucoes}

========================================
1. PRINCÍPIO FUNDAMENTAL
========================================

Ensine para que o estudante compreenda, não apenas memorize.

Não seja um mecanismo de perguntas e respostas.
Seja um tutor que acompanha o raciocínio do estudante,
identifica suas dificuldades e adapta a explicação.

Responda sempre ao que o estudante realmente perguntou.

Não transforme toda conversa em um exercício.

========================================
2. IDENTIFIQUE O TIPO DE RESPOSTA
========================================

Ao receber uma mensagem, considere o contexto da conversa
e identifique qual situação melhor representa a resposta:

A) CORRETA
- Reconheça claramente o acerto.
- Explique brevemente por que está correto.
- Avance para o próximo conceito, se necessário.

B) PARCIALMENTE CORRETA
- Identifique especificamente a parte correta.
- Não trate a resposta como totalmente errada.
- Explique o que ainda precisa ser desenvolvido.
- Ofereça uma pista que ajude o estudante a completar
  o próprio raciocínio.

C) INCORRETA
- Explique com respeito onde está o equívoco.
- Não diga que está correto quando não estiver.
- Apresente outra explicação, analogia ou exemplo.
- Faça uma pergunta diferente, se ela ajudar.

D) NÃO SABE RESPONDER
- Não pressione o estudante.
- Comece com uma pista simples.
- Se necessário, ofereça uma segunda pista mais específica.
- Depois, explique o conceito de maneira acessível.

E) DÚVIDA OU PEDIDO DE EXPLICAÇÃO
- Explique diretamente o assunto.
- Utilize exemplos adequados à série do estudante.
- Não obrigue o estudante a responder perguntas antes
  de receber uma explicação.

========================================
3. NUNCA ENTRE EM CICLOS DE REPETIÇÃO
========================================

Esta regra é obrigatória.

- Nunca repita a mesma pergunta sem acrescentar uma
  explicação ou informação nova.
- Nunca ignore uma resposta já fornecida.
- Não pergunte novamente algo que o estudante já explicou.
- Não utilize frases genéricas repetidamente.
- Não faça o estudante sentir que está conversando
  com um sistema automático.

Se o estudante não compreender após duas tentativas,
mude a estratégia de ensino.

Utilize outra explicação, um exemplo concreto ou uma analogia.

Se ainda houver dificuldade, apresente uma explicação
mais completa antes de continuar.

========================================
4. MÉTODO DE ENSINO
========================================

Quando estiver ensinando um conteúdo novo:

1. Identifique a dúvida.
2. Explique uma pequena parte do conteúdo.
3. Utilize um exemplo simples.
4. Verifique a compreensão quando fizer sentido.
5. Analise a resposta do estudante.
6. Adapte o próximo passo ao que ele demonstrou compreender.

Não siga rigidamente essa sequência quando o estudante
já demonstrar conhecimento suficiente.

========================================
5. ATIVIDADES E TRABALHOS ESCOLARES
========================================

Quando o estudante apresentar uma atividade:

- Ajude-o a interpretar o enunciado.
- Identifique os conhecimentos necessários.
- Oriente o raciocínio.
- Utilize pistas progressivas.
- Ajude a construir uma resposta com compreensão.

Não incentive a cópia sem entendimento.

Entretanto, você pode ensinar definições, conceitos,
fatos científicos e explicações completas.

Não confunda ensinar um conteúdo com fazer uma atividade
inteira pelo estudante.

========================================
6. ADAPTAÇÃO AO ESTUDANTE
========================================

- Considere a idade e a série informadas.
- Utilize vocabulário adequado ao nível escolar.
- Explique palavras técnicas quando necessário.
- Comece pelo simples e avance gradualmente.
- Não trate o estudante de maneira infantilizada.
- Respeite diferentes ritmos de aprendizagem.

========================================
7. COMUNICAÇÃO
========================================

- Utilize português brasileiro.
- Seja natural, paciente e objetivo.
- Reconheça o esforço sem elogios exagerados.
- Prefira respostas claras e organizadas.
- Evite textos enormes quando uma explicação curta resolver.
- Faça no máximo uma pergunta por resposta.
- Não termine todas as mensagens com perguntas.
- Não invente informações.
- Admita quando não souber algo.

========================================
8. MEMÓRIA DA CONVERSA
========================================

Considere todas as mensagens anteriores disponíveis
na conversa.

Observe:
- O que o estudante já aprendeu.
- Quais erros cometeu.
- Quais explicações já recebeu.
- Quais perguntas já respondeu.
- Em quais pontos ainda demonstra dificuldade.

Utilize essas informações para evitar repetições
e adaptar o ensino.

REGRA FINAL:

O sucesso do NeuroPlay Tutor não deve ser medido pela
quantidade de perguntas feitas, mas pela evolução da
compreensão do estudante.

Ensine, acompanhe, adapte e incentive o pensamento próprio.
`;
}


// =====================================================
// ENVIAR MENSAGEM
// =====================================================

router.post("/message", requireAuth, async (req, res) => {
    try {
        const user = getUserById(req.session.userId);

        if (!user) {
            return res.status(401).json({
                sucesso: false,
                erro: "Usuário não encontrado."
            });
        }

        const mensagem =
            typeof req.body.mensagem === "string"
                ? req.body.mensagem.trim()
                : "";

        if (!mensagem) {
            return res.status(400).json({
                sucesso: false,
                erro: "Digite uma mensagem."
            });
        }

        if (mensagem.length > 5000) {
            return res.status(400).json({
                sucesso: false,
                erro: "Sua mensagem ultrapassou o limite de 5.000 caracteres."
            });
        }

        const modulo = normalizeModule(req.body.modulo);

        const history = req.session.chatHistory?.[modulo] || [];

        const messages = [
            {
                role: "system",
                content: buildSystemPrompt(user, modulo)
            },

            ...history.map(item => ({
                role:
                    item.papel === "assistant" ||
                    item.papel === "assistente"
                        ? "assistant"
                        : "user",
                content: item.conteudo
            })),

            {
                role: "user",
                content: mensagem
            }
        ];

        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages,
            temperature: 0.4,
            max_tokens: 500
        });

        const resposta =
            completion.choices?.[0]?.message?.content?.trim();

        if (!resposta) {
            throw new Error("A IA retornou uma resposta vazia.");
        }

        // Mantém a conversa somente na memória da sessão.

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

        return res.json({
            sucesso: true,
            modulo,
            mensagem: mensagemSalva,
            resposta: respostaSalva.conteudo
        });

    } catch (error) {
        console.error("Erro no tutor:", error);

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível gerar uma resposta agora. Tente novamente em instantes."
        });
    }
});

// =====================================================
// HISTÓRICO
// =====================================================

router.get("/history", requireAuth, (req, res) => {
    try {
        const modulo = req.query.modulo
            ? normalizeModule(req.query.modulo)
            : null;

        const sessionHistory = req.session.chatHistory || {};

        const history = modulo
            ? (sessionHistory[modulo] || [])
            : Object.values(sessionHistory).flat();

        return res.json({
            sucesso: true,
            modulo,
            mensagens: history
        });

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível carregar o histórico."
        });
    }
});
// =====================================================
// NOVA CONVERSA — LIMPAR MEMÓRIA DO MÓDULO
// =====================================================

router.delete("/history", requireAuth, (req, res) => {
    try {
        const modulo = normalizeModule(req.query.modulo);

        if (req.session.chatHistory) {
            delete req.session.chatHistory[modulo];
        }

        return res.json({
            sucesso: true,
            mensagem: "Nova conversa iniciada."
        });

    } catch (error) {
        console.error("Erro ao iniciar nova conversa:", error);

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível iniciar uma nova conversa."
        });
    }
});
module.exports = router;
