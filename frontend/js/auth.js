"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("senha");

    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    const loginButton = document.getElementById("loginButton");
    const registerButton = document.getElementById("registerButton");

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    function showMessage(element, message, type = "error") {
        if (!element) return;

        element.textContent = message;
        element.classList.add("visible");
        element.classList.toggle("success", type === "success");
    }

    function clearMessage(element) {
        if (!element) return;

        element.textContent = "";
        element.classList.remove("visible", "success");
    }

    function setLoading(button, loading, originalText) {
        if (!button) return;

        button.disabled = loading;

        const span = button.querySelector("span");

        if (span) {
            span.textContent = loading ? "Aguarde..." : originalText;
        }
    }

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("O servidor retornou uma resposta inválida.");
        }

        if (!response.ok) {
            throw new Error(
                data.mensagem ||
                data.erro ||
                "Não foi possível concluir a operação."
            );
        }

        return data;
    }

    // ==========================================
    // MOSTRAR / OCULTAR SENHA
    // ==========================================

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const showing = passwordInput.type === "text";

            passwordInput.type = showing ? "password" : "text";

            togglePassword.setAttribute(
                "aria-label",
                showing ? "Mostrar senha" : "Ocultar senha"
            );

            togglePassword.setAttribute(
                "aria-pressed",
                String(!showing)
            );
        });
    }

    // ==========================================
    // LOGIN
    // ==========================================

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            clearMessage(loginError);

            const usuario = document
                .getElementById("usuario")
                .value.trim();

            const senha = passwordInput.value;

            if (!usuario || !senha) {
                showMessage(
                    loginError,
                    "Preencha seu nome de usuário e sua senha."
                );
                return;
            }

            setLoading(
                loginButton,
                true,
                "Entrar na plataforma"
            );

            try {
                await apiRequest("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        usuario,
                        senha
                    })
                });

                window.location.replace("/dashboard.html");

            } catch (error) {
                showMessage(
                    loginError,
                    error.message || "Não foi possível entrar."
                );

            } finally {
                setLoading(
                    loginButton,
                    false,
                    "Entrar na plataforma"
                );
            }
        });
    }

    // ==========================================
    // CADASTRO
    // ==========================================

    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            clearMessage(registerError);

            const nome = document
                .getElementById("nome")
                .value.trim();

            const usuario = document
                .getElementById("usuario")
                .value.trim();

            const idade = Number(
                document.getElementById("idade").value
            );

            const serie = document
                .getElementById("serie")
                .value;

            const senha = passwordInput.value;

            if (!nome || !usuario || !idade || !serie || !senha) {
                showMessage(
                    registerError,
                    "Preencha todos os campos para continuar."
                );
                return;
            }

            if (nome.length < 2 || nome.length > 80) {
                showMessage(
                    registerError,
                    "Informe um nome com pelo menos 2 caracteres."
                );
                return;
            }

            if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(usuario)) {
                showMessage(
                    registerError,
                    "O usuário deve ter de 3 a 30 caracteres e pode conter letras, números, ponto, hífen ou sublinhado."
                );
                return;
            }

            if (!Number.isInteger(idade) || idade < 5 || idade > 100) {
                showMessage(
                    registerError,
                    "Informe uma idade válida."
                );
                return;
            }

            if (senha.length < 8) {
                showMessage(
                    registerError,
                    "Sua senha precisa ter pelo menos 8 caracteres."
                );
                return;
            }

            setLoading(
                registerButton,
                true,
                "Criar minha conta"
            );

            try {
                await apiRequest("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        nome,
                        usuario,
                        idade,
                        serie,
                        senha
                    })
                });

                window.location.replace("/dashboard.html");

            } catch (error) {
                showMessage(
                    registerError,
                    error.message || "Não foi possível criar sua conta."
                );

            } finally {
                setLoading(
                    registerButton,
                    false,
                    "Criar minha conta"
                );
            }
        });
    }

    // ==========================================
    // VERIFICAR SESSÃO EXISTENTE
    // ==========================================

    const isAuthPage = loginForm || registerForm;

    if (isAuthPage) {
        apiRequest("/api/auth/me")
            .then((data) => {
                if (data.sucesso && data.usuario) {
                    window.location.replace("/dashboard.html");
                }
            })
            .catch(() => {
                // Usuário não autenticado: permanece na página.
            });
    }
});