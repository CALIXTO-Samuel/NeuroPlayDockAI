
"use strict";

// =====================================================
// CONFIGURAÇÃO DOS MÓDULOS
// =====================================================

const MODULES = {
    reforco: {
        titulo: "Reforço escolar",
        descricao: "Aprenda no seu ritmo, com explicações e dicas que ajudam você a raciocinar.",
        boasVindas: "Vamos aprender juntos?",
        sugestoes: [
            "Quero entender melhor uma matéria.",
            "Pode me ajudar a estudar para uma prova?",
            "Tenho dúvidas sobre um conteúdo."
        ]
    },

    alfabetizacao: {
        titulo: "Alfabetização",
        descricao: "Desenvolva sua leitura, escrita, interpretação e compreensão.",
        boasVindas: "Vamos explorar as palavras?",
        sugestoes: [
            "Quero praticar interpretação de texto.",
            "Ajude-me a melhorar minha escrita.",
            "Quero aprender palavras novas."
        ]
    },

    organizacao: {
        titulo: "Organização",
        descricao: "Organize seus estudos, tarefas e objetivos.",
        boasVindas: "Vamos organizar sua rotina?",
        sugestoes: [
            "Ajude-me a organizar meus estudos.",
            "Quero montar um planejamento semanal.",
            "Como posso administrar meu tempo?"
        ]
    },

    atividades: {
        titulo: "Atividades",
        descricao: "Pratique seus conhecimentos com desafios e exercícios orientados.",
        boasVindas: "Preparado para um desafio?",
        sugestoes: [
            "Quero praticar matemática.",
            "Crie um desafio de ciências para mim.",
            "Quero testar meus conhecimentos."
        ]
    },

    debate: {
        titulo: "Debate",
        descricao: "Desenvolva seu pensamento crítico e aprenda a construir argumentos.",
        boasVindas: "Vamos pensar sobre novas ideias?",
        sugestoes: [
            "Quero debater um tema atual.",
            "Ajude-me a construir um argumento.",
            "Quero aprender a defender uma opinião."
        ]
    },

    enem: {
        titulo: "Faculdade & ENEM",
        descricao: "Explore possibilidades acadêmicas e desenvolva sua preparação para o futuro.",
        boasVindas: "Vamos construir seu próximo passo?",
        sugestoes: [
            "Quero conhecer melhor o ENEM.",
            "Como posso começar a me preparar?",
            "Quero explorar opções de faculdade."
        ]
    }
};

// =====================================================
// ESTADO DA APLICAÇÃO
// =====================================================

const state = {
    currentModule: "reforco",
    currentMessages: [],
    isSending: false,
    user: null
};

// =====================================================
// ELEMENTOS HTML
// =====================================================

const elements = {
    sidebar: document.getElementById("sidebar"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    mobileMenuButton: document.getElementById("mobileMenuButton"),

    logoutButton: document.getElementById("logoutButton"),

    userName: document.getElementById("userName"),
    userGrade: document.getElementById("userGrade"),
    userAvatar: document.getElementById("userAvatar"),

    welcomeTitle: document.getElementById("welcomeTitle"),
    welcomeDescription: document.getElementById("welcomeDescription"),

    moduleTitle: document.getElementById("moduleTitle"),
    moduleDescription: document.getElementById("moduleDescription"),

    clearChatButton: document.getElementById("clearChatButton"),

    chatMessages: document.getElementById("chatMessages"),
    chatError: document.getElementById("chatError"),

    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    sendButton: document.getElementById("sendButton"),
    characterCount: document.getElementById("characterCount"),

    moduleButtons: document.querySelectorAll("[data-module]"),
    suggestionButtons: document.querySelectorAll("[data-suggestion]")
};

// =====================================================
// REQUISIÇÕES À API
// =====================================================

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        throw new Error("O servidor retornou uma resposta inválida.");
    }

    if (!response.ok) {
        if (response.status === 401) {
            window.location.href = "/login.html";
            throw new Error("Sua sessão expirou. Entre novamente.");
        }

        throw new Error(
            data.erro ||
            data.mensagem ||
            "Não foi possível concluir a solicitação."
        );
    }

    return data;
}

// =====================================================
// PERFIL DO USUÁRIO
// =====================================================

async function loadProfile() {
    try {
        const data = await apiRequest("/api/auth/me");

        if (!data.usuario) {
            throw new Error("Não foi possível carregar seu perfil.");
        }

        state.user = data.usuario;

        const nome = state.user.nome || state.user.usuario || "Estudante";
        const primeiroNome = nome.trim().split(/\s+/)[0];

        if (elements.userName) {
            elements.userName.textContent = nome;
        }

        if (elements.userGrade) {
            elements.userGrade.textContent =
                state.user.serie || "Estudante";
        }

        if (elements.userAvatar) {
            elements.userAvatar.textContent =
                nome.charAt(0).toUpperCase();
        }

        if (elements.welcomeTitle) {
            elements.welcomeTitle.textContent =
                `Olá, ${primeiroNome}!`;
        }

        updateModuleInformation();

        return true;

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);

        if (error.message !== "Sua sessão expirou. Entre novamente.") {
            showChatError(error.message);
        }

        return false;
    }
}

// =====================================================
// INFORMAÇÕES DO MÓDULO
// =====================================================

function updateModuleInformation() {
    const module = MODULES[state.currentModule];

    if (!module) return;

    if (elements.moduleTitle) {
        elements.moduleTitle.textContent = module.titulo;
    }

    if (elements.moduleDescription) {
        elements.moduleDescription.textContent = module.descricao;
    }

    if (elements.welcomeDescription) {
        elements.welcomeDescription.textContent = module.descricao;
    }

    elements.moduleButtons.forEach(button => {
        const selected = button.dataset.module === state.currentModule;

        button.classList.toggle("active", selected);
        button.setAttribute("aria-current", selected ? "page" : "false");
    });
}

// =====================================================
// MENSAGENS DE ERRO
// =====================================================

function showChatError(message) {
    if (!elements.chatError) return;

    elements.chatError.textContent = message;
    elements.chatError.hidden = false;
}

function hideChatError() {
    if (!elements.chatError) return;

    elements.chatError.textContent = "";
    elements.chatError.hidden = true;
}

// =====================================================
// FORMATAÇÃO DE HORÁRIO
// =====================================================

function formatMessageTime(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function renderMarkdown(container, markdown) {
    const lines = String(markdown || "")
        .replace(/\\([#*_|`])/g, "$1")
        .replace(/\r\n/g, "\n")
        .split("\n");

    function inline(parent, value) {
        const pattern =
            /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(value)) !== null) {
            if (match.index > lastIndex) {
                parent.appendChild(
                    document.createTextNode(value.slice(lastIndex, match.index))
                );
            }

            const token = match[0];
            let element;

            if (token.startsWith("`")) {
                element = document.createElement("code");
                element.textContent = token.slice(1, -1);
            } else if (token.startsWith("**") || token.startsWith("__")) {
                element = document.createElement("strong");
                inline(element, token.slice(2, -2));
            } else {
                element = document.createElement("em");
                inline(element, token.slice(1, -1));
            }

            parent.appendChild(element);
            lastIndex = pattern.lastIndex;
        }

        if (lastIndex < value.length) {
            parent.appendChild(
                document.createTextNode(value.slice(lastIndex))
            );
        }
    }

    let paragraph = [];
    let list = null;
    let listType = null;

    function flushParagraph() {
        if (!paragraph.length) return;

        const p = document.createElement("p");
        inline(p, paragraph.join(" "));
        container.appendChild(p);
        paragraph = [];
    }

    function flushList() {
        if (list) {
            container.appendChild(list);
            list = null;
            listType = null;
        }
    }

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
        }

        const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);

        if (heading) {
            flushParagraph();
            flushList();

            const element = document.createElement(
                `h${heading[1].length}`
            );

            inline(element, heading[2]);
            container.appendChild(element);
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            flushParagraph();
            flushList();
            container.appendChild(document.createElement("hr"));
            continue;
        }

        const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
        const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);

        if (unordered || ordered) {
            flushParagraph();

            const type = unordered ? "ul" : "ol";

            if (!list || listType !== type) {
                flushList();
                list = document.createElement(type);
                listType = type;
            }

            const item = document.createElement("li");
            inline(item, (unordered || ordered)[1]);
            list.appendChild(item);
            continue;
        }

        flushList();

        if (trimmed.startsWith("> ")) {
            flushParagraph();

            const quote = document.createElement("blockquote");
            inline(quote, trimmed.slice(2));
            container.appendChild(quote);
            continue;
        }

        paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();
}


// =====================================================
// CRIAÇÃO DE MENSAGENS
// =====================================================

function createMessageElement(message) {
    const isUser =
        message.papel === "user" ||
        message.papel === "usuario";

    const container = document.createElement("div");

    container.className = isUser
        ? "message user"
        : "message assistant";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = isUser
        ? (state.user?.nome?.charAt(0).toUpperCase() || "U")
        : "N";

    const content = document.createElement("div");
    content.className = "message-content";

    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = isUser
        ? "Você"
        : "NeuroPlayDockIA";

    const text = document.createElement("div");
    text.className = "message-text";

    // textContent impede que mensagens sejam interpretadas como HTML.
     renderMarkdown(text, message.conteudo || "");

    const time = document.createElement("div");
    time.className = "message-time";
    time.textContent = formatMessageTime(message.criadoEm);

    content.appendChild(author);
    content.appendChild(text);

    if (time.textContent) {
        content.appendChild(time);
    }

    container.appendChild(avatar);
    container.appendChild(content);

    return container;
}

// =====================================================
// RENDERIZAÇÃO DO HISTÓRICO
// =====================================================

function renderMessages() {
    if (!elements.chatMessages) return;

    elements.chatMessages.replaceChildren();

    if (state.currentMessages.length === 0) {
        showWelcomeMessage();
        return;
    }

    state.currentMessages.forEach(message => {
        elements.chatMessages.appendChild(
            createMessageElement(message)
        );
    });

    scrollChatToBottom();
}

// =====================================================
// MENSAGEM INICIAL
// =====================================================

function showWelcomeMessage() {
    if (!elements.chatMessages) return;

    const module = MODULES[state.currentModule];

    const welcome = document.createElement("div");
    welcome.className = "welcome-message";

    const icon = document.createElement("div");
    icon.className = "welcome-message-icon";
    icon.textContent = "✦";

    const title = document.createElement("h3");
    title.textContent = module.boasVindas;

    const description = document.createElement("p");
    description.textContent =
        "Sou seu assistente de aprendizagem. Meu objetivo é ajudar você a compreender, pensar e descobrir as respostas por conta própria.";

    const suggestions = document.createElement("div");
    suggestions.className = "suggestion-list";

    module.sugestoes.forEach(suggestion => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "suggestion-button";
        button.textContent = suggestion;

        button.addEventListener("click", () => {
            elements.chatInput.value = suggestion;
            updateCharacterCount();
            elements.chatInput.focus();
        });

        suggestions.appendChild(button);
    });

    welcome.appendChild(icon);
    welcome.appendChild(title);
    welcome.appendChild(description);
    welcome.appendChild(suggestions);

    elements.chatMessages.appendChild(welcome);
}

// =====================================================
// ROLAGEM DO CHAT
// =====================================================

function scrollChatToBottom() {
    if (!elements.chatMessages) return;

    elements.chatMessages.scrollTop =
        elements.chatMessages.scrollHeight;
}

// =====================================================
// INDICADOR DE DIGITAÇÃO
// =====================================================

function showTypingIndicator() {
    if (!elements.chatMessages) return;

    removeTypingIndicator();

    const indicator = document.createElement("div");
    indicator.className = "message assistant";
    indicator.id = "typingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "N";

    const content = document.createElement("div");
    content.className = "message-content";

    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = "NeuroPlayDockIA";

    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.textContent = "Pensando...";

    content.appendChild(author);
    content.appendChild(typing);

    indicator.appendChild(avatar);
    indicator.appendChild(content);

    elements.chatMessages.appendChild(indicator);

    scrollChatToBottom();
}

function removeTypingIndicator() {
    document.getElementById("typingIndicator")?.remove();
}

// =====================================================
// ESTADO DO ENVIO
// =====================================================

function updateSendButton() {
    if (!elements.sendButton || !elements.chatInput) return;

    const hasText = elements.chatInput.value.trim().length > 0;

    elements.sendButton.disabled =
        !hasText || state.isSending;

    elements.sendButton.setAttribute(
        "aria-busy",
        state.isSending ? "true" : "false"
    );
}

function setSending(sending) {
    state.isSending = sending;

    if (elements.chatInput) {
        elements.chatInput.disabled = sending;
    }

    updateSendButton();
}

// =====================================================
// CONTADOR DE CARACTERES
// =====================================================

function updateCharacterCount() {
    if (!elements.chatInput) return;

    const length = elements.chatInput.value.length;

    if (elements.characterCount) {
        elements.characterCount.textContent = `${length}/5000`;
    }

    updateSendButton();
}

// =====================================================
// CARREGAR HISTÓRICO DO MÓDULO
// =====================================================

async function loadHistory() {
    hideChatError();

    try {
        const data = await apiRequest(
            `/api/tutor/history?modulo=${encodeURIComponent(state.currentModule)}`
        );

        state.currentMessages = Array.isArray(data.mensagens)
            ? data.mensagens
            : [];

        renderMessages();

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);

        state.currentMessages = [];
        renderMessages();

        showChatError(error.message);
    }
}

// =====================================================
// ENVIAR MENSAGEM
// =====================================================

async function sendMessage(messageText) {
    const mensagem = messageText.trim();

    if (!mensagem || state.isSending) return;

    if (mensagem.length > 5000) {
        showChatError("Sua mensagem ultrapassou o limite de 5000 caracteres.");
        return;
    }

    hideChatError();

    state.currentMessages.push({
        papel: "user",
        conteudo: mensagem,
        criadoEm: new Date().toISOString()
    });

    renderMessages();

    elements.chatInput.value = "";
    updateCharacterCount();

    setSending(true);
    showTypingIndicator();

    try {
        const data = await apiRequest("/api/tutor/message", {
            method: "POST",
            body: JSON.stringify({
                mensagem,
                modulo: state.currentModule
            })
        });

        removeTypingIndicator();

        const resposta =
            typeof data.resposta === "string"
                ? data.resposta
                : data.resposta?.conteudo;

        if (!resposta) {
            throw new Error("O assistente não retornou uma resposta.");
        }

        state.currentMessages.push({
            papel: "assistant",
            conteudo: resposta,
            criadoEm: new Date().toISOString()
        });

        renderMessages();

    } catch (error) {
        removeTypingIndicator();

        console.error("Erro ao enviar mensagem:", error);

        showChatError(error.message);

    } finally {
        setSending(false);
        elements.chatInput?.focus();
    }
}

// =====================================================
// TROCAR DE MÓDULO
// =====================================================

async function selectModule(moduleName) {
    if (!MODULES[moduleName]) return;

    if (state.currentModule === moduleName) {
        closeMobileMenu();
        return;
    }

    state.currentModule = moduleName;

    updateModuleInformation();
    closeMobileMenu();

    await loadHistory();
}

// =====================================================
// NOVA CONVERSA VISUAL
// =====================================================

async function clearChatDisplay() {
    if (state.isSending) return;

    try {
        const data = await apiRequest(
            `/api/tutor/history?modulo=${encodeURIComponent(state.currentModule)}`,
            {
                method: "DELETE"
            }
        );

        if (!data.sucesso) {
            throw new Error("Não foi possível iniciar uma nova conversa.");
        }

        state.currentMessages = [];

        hideChatError();
        renderMessages();

        elements.chatInput.value = "";
        updateCharacterCount();
        elements.chatInput.focus();

    } catch (error) {
        console.error("Erro ao iniciar nova conversa:", error);
        showChatError(error.message);
    }
}

// =====================================================
// MENU MOBILE
// =====================================================

function openMobileMenu() {
    elements.sidebar?.classList.add("open");
    elements.mobileOverlay?.classList.add("active");

    elements.mobileMenuButton?.setAttribute(
        "aria-expanded",
        "true"
    );
}

function closeMobileMenu() {
    elements.sidebar?.classList.remove("open");
    elements.mobileOverlay?.classList.remove("active");

    elements.mobileMenuButton?.setAttribute(
        "aria-expanded",
        "false"
    );
}

function toggleMobileMenu() {
    const isOpen = elements.sidebar?.classList.contains("open");

    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// =====================================================
// ENCERRAR SESSÃO
// =====================================================

async function logout() {
    if (elements.logoutButton) {
        elements.logoutButton.disabled = true;
    }

    try {
        await apiRequest("/api/auth/logout", {
            method: "POST"
        });

    } catch (error) {
        console.error("Erro ao sair:", error);

    } finally {
        window.location.href = "/login.html";
    }
}

// =====================================================
// EVENTOS
// =====================================================

function initializeEvents() {
    elements.chatForm?.addEventListener("submit", event => {
        event.preventDefault();

        if (!elements.chatInput) return;

        sendMessage(elements.chatInput.value);
    });

    elements.chatInput?.addEventListener("input", () => {
        updateCharacterCount();
        hideChatError();
    });

    elements.moduleButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectModule(button.dataset.module);
        });
    });

    elements.suggestionButtons.forEach(button => {
        button.addEventListener("click", () => {
            const suggestion = button.dataset.suggestion;

            if (!suggestion || !elements.chatInput) return;

            elements.chatInput.value = suggestion;
            updateCharacterCount();
            elements.chatInput.focus();
        });
    });

    elements.clearChatButton?.addEventListener(
        "click",
        clearChatDisplay
    );

    elements.mobileMenuButton?.addEventListener(
        "click",
        toggleMobileMenu
    );

    elements.mobileOverlay?.addEventListener(
        "click",
        closeMobileMenu
    );

    elements.logoutButton?.addEventListener(
        "click",
        logout
    );

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeMobileMenu();
        }
    });
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function initializeDashboard() {
    initializeEvents();

    updateCharacterCount();
    updateModuleInformation();

    const profileLoaded = await loadProfile();

    if (!profileLoaded) return;

    await loadHistory();
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
