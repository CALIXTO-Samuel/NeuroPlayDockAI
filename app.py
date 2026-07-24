import os
import json
import streamlit as st
from groq import Groq

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(
    page_title="NeuroPlay Dock 2026",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CARREGAMENTO SEGURO DA API KEY DA GROQ ---
def obter_chave_groq():
    # 1. Tenta obter do Secrets do Streamlit (.streamlit/secrets.toml local ou Web Dashboard)
    if "GROQ_API_KEY" in st.secrets:
        return st.secrets["GROQ_API_KEY"]
    # 2. Tenta obter das variáveis de ambiente do sistema
    return os.getenv("GROQ_API_KEY", "")

CHAVE_GSK = obter_chave_groq()

if not CHAVE_GSK:
    st.error("⚠️ Chave de API da Groq não encontrada! Configure o ficheiro secrets.toml ou as Secrets no Streamlit Cloud.")
    st.stop()

client = Groq(api_key=CHAVE_GSK)
ARQUIVO_DADOS = "dados_usuarios.json"

# --- BANCO DE DADOS EM FICHEIRO LOCAL (JSON) ---
def carregar_dados():
    if os.path.exists(ARQUIVO_DADOS):
        try:
            with open(ARQUIVO_DADOS, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def salvar_dados(dados):
    with open(ARQUIVO_DADOS, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)

# --- ESTILIZAÇÃO CSS CUSTOMIZADA (Tema Neon) ---
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(135deg, #0f0f1b 0%, #1a1a2e 100%);
        color: #FFFFFF;
        font-family: 'Segoe UI', Roboto, sans-serif;
    }

    header, footer {visibility: hidden;}

    .stChatMessage {
        background: rgba(26, 26, 46, 0.8) !important;
        border-radius: 18px !important;
        border: 1px solid rgba(162, 155, 254, 0.3) !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        padding: 15px !important;
        margin-bottom: 12px !important;
    }

    [data-testid="stForm"] {
        background: #1a1a2e !important;
        border: 2px solid #00d2d3 !important;
        border-radius: 20px !important;
        box-shadow: 0 0 20px rgba(0, 210, 211, 0.3) !important;
        padding: 25px !important;
    }

    .neon-title {
        color: #00D2D3;
        font-weight: 800;
        text-shadow: 0 0 10px rgba(0, 210, 211, 0.6);
        margin-bottom: 5px;
    }

    .neon-subtitle {
        color: #A29BFE;
        font-size: 1.1rem;
        margin-bottom: 25px;
    }

    div.stButton > button {
        width: 100%;
        background: linear-gradient(90deg, #1A1A2E 0%, #252542 100%);
        color: #00D2D3;
        border: 1px solid #00D2D3;
        border-radius: 12px;
        height: 48px;
        font-weight: 700;
        transition: all 0.3s ease-in-out;
    }

    div.stButton > button:hover {
        background: #00D2D3;
        color: #0F0F1B;
        box-shadow: 0 0 15px rgba(0, 210, 211, 0.6);
    }

    .stTextInput > div > div > input {
        background-color: #0F0F1B !important;
        color: #FFFFFF !important;
        border-radius: 10px !important;
        border: 1px solid #A29BFE !important;
    }
</style>
""", unsafe_allow_html=True)

# --- GERENCIAMENTO DE ESTADO ---
if "usuario_logado" not in st.session_state:
    st.session_state.usuario_logado = None

if "secao_atual" not in st.session_state:
    st.session_state.secao_atual = "inicio"

# --- TELA DE AUTENTICAÇÃO (ENTRAR E CADASTRAR) ---
def tela_autenticacao():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("<h1 style='text-align: center;' class='neon-title'>🧠 NEUROPLAY DOCK</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center;' class='neon-subtitle'>Plataforma Inteligente de Ensino</p>", unsafe_allow_html=True)

        tab_entrar, tab_cadastrar = st.tabs(["🔑 ENTRAR", "📝 CADASTRAR"])
        banco_dados = carregar_dados()

        # --- ABA ENTRAR ---
        with tab_entrar:
            with st.form("form_login"):
                usuario = st.text_input("Usuário", placeholder="Digite seu usuário...").strip().lower()
                senha = st.text_input("Senha", type="password", placeholder="Digite sua senha...")
                btn_entrar = st.form_submit_button("ENTRAR ⚡")

                if btn_entrar:
                    if usuario in banco_dados and banco_dados[usuario]["senha"] == senha:
                        st.session_state.usuario_logado = usuario
                        st.success("Login realizado com sucesso!")
                        st.rerun()
                    else:
                        st.error("Usuário ou senha incorretos.")

        # --- ABA CADASTRAR ---
        with tab_cadastrar:
            with st.form("form_cadastro"):
                novo_usuario = st.text_input("Usuário (Login)", placeholder="Ex: joao123").strip().lower()
                nova_senha = st.text_input("Senha", type="password", placeholder="Crie uma senha...")
                nome = st.text_input("Seu Nome Completo", placeholder="Ex: João Da Silva Costa")
                idade = st.text_input("Sua Idade", placeholder="Ex: 13 anos")
                serie = st.text_input("Série ou Fase de Estudo", placeholder="Ex: 8º ano do Ensino Fundamental")
                
                btn_cadastrar = st.form_submit_button("CADASTRAR CONTA 🚀")

                if btn_cadastrar:
                    if not novo_usuario or not nova_senha or not nome or not idade or not serie:
                        st.warning("Por favor, preencha todos os campos!")
                    elif novo_usuario in banco_dados:
                        st.error("Este nome de usuário já existe. Escolha outro.")
                    else:
                        banco_dados[novo_usuario] = {
                            "senha": nova_senha,
                            "perfil": {
                                "nome": nome,
                                "idade": idade,
                                "serie": serie
                            },
                            "mensagens": [
                                {
                                    "role": "assistant",
                                    "content": f"🤖 Olá, **{nome}**! Seja bem-vindo ao **NeuroPlay Dock**.\n\nSeus dados estão gravados. Selecione um módulo no menu para começarmos!"
                                }
                            ]
                        }
                        salvar_dados(banco_dados)
                        st.success("Conta criada com sucesso! Faça login na aba 'ENTRAR'.")

# --- INTERFACE PRINCIPAL ---
def interface_principal():
    banco_dados = carregar_dados()
    usuario_id = st.session_state.usuario_logado
    dados_user = banco_dados.get(usuario_id, {})
    perfil = dados_user.get("perfil", {})

    # --- SIDEBAR (BARRA LATERAL) ---
    with st.sidebar:
        # Suporte para o nome do logótipo com cópia ou nome padrão
        if os.path.exists("logo_neuroplay - cópia.png"):
            st.image("logo_neuroplay - cópia.png", width=180)
        elif os.path.exists("logo_neuroplay.png"):
            st.image("logo_neuroplay.png", width=180)
        else:
            st.markdown("<h1 style='text-align: center;'>🧠</h1>", unsafe_allow_html=True)

        st.markdown("<h2 style='text-align: center; color: #00D2D3;'>NEUROPLAY DOCK</h2>", unsafe_allow_html=True)
        st.markdown(f"👤 **Aluno:** {perfil.get('nome', usuario_id)}")
        st.markdown(f"🎂 **Idade:** {perfil.get('idade', '-')}")
        st.markdown(f"📚 **Série:** {perfil.get('serie', '-')}")
        st.markdown("---")

        modulos = {
            "alfabetizacao": "🔤 ABC ALFABETIZAÇÃO",
            "rotina": "📅 ORGANIZAÇÃO",
            "atividades": "📝 ATIVIDADES",
            "debate": "🗣️ DEBATE",
            "faculdade": "🎓 FACULDADE & ENEM",
            "reforco": "📘 REFORÇO"
        }

        for chave, rotulo in modulos.items():
            if st.button(rotulo, key=chave):
                st.session_state.secao_atual = chave
                st.toast(f"Módulo ativado: {rotulo}", icon="⚡")

        st.markdown("---")
        if st.button("🚪 SAIR / LOGOUT"):
            st.session_state.usuario_logado = None
            st.rerun()

    # --- PAINEL PRINCIPAL ---
    titulos_modulos = {
        "inicio": "SISTEMA NEUROPLAY ONLINE",
        "alfabetizacao": "🔤 ALFABETIZAÇÃO",
        "rotina": "📅 ORGANIZAÇÃO",
        "atividades": "📝 ATIVIDADES",
        "debate": "🗣️ DEBATE E ARGUMENTAÇÃO",
        "faculdade": "🎓 FACULDADE & ENEM",
        "reforco": "📘 REFORÇO"
    }

    st.markdown(
        f"<h1 class='neon-title'>{titulos_modulos.get(st.session_state.secao_atual, 'NEUROPLAY DOCK')}</h1>",
        unsafe_allow_html=True
    )

    # Exibe o histórico de mensagens salvas
    mensagens = dados_user.get("mensagens", [])
    for msg in mensagens:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # --- ENTRADA DO CHAT ---
    prompt_usuario = st.chat_input("Digite sua dúvida ou resposta...")

    if prompt_usuario:
        mensagens.append({"role": "user", "content": prompt_usuario})
        dados_user["mensagens"] = mensagens
        banco_dados[usuario_id] = dados_user
        salvar_dados(banco_dados)

        with st.chat_message("user"):
            st.markdown(prompt_usuario)

        # PROMPT DE INSTRUÇÃO COM BLOQUEIO RIGOROSO DE RESPOSTAS PRONTAS
        instrucao_sistema = f"""
Você é o NeuroPlay Dock 2026, um tutor pedagógico estritamente socrático.

PERFIL DO ALUNO LOGADO:
- Nome: {perfil.get('nome')}
- Idade: {perfil.get('idade')}
- Série/Fase: {perfil.get('serie')}

MÓDULO SELECIONADO: {st.session_state.secao_atual}

PROIBIÇÃO ABSOLUTA (MÉTODO SOCRÁTICO):
- NUNCA DÊ A RESPOSTA FINAL OU PRONTA de deveres de casa, problemas matemáticos, equações, perguntas teóricas ou exercícios de prova.
- MESMO QUE O ALUNO PEÇA EXPLICITAMENTE COM FRASES COMO "me dê a resposta pronta de...", "qual a resposta da questão...", "me dê a resposta", VOCÊ DEVE RECUSAR DAR A RESPOSTA DIRETA.
- Em vez de dar a resposta pronta, explique apenas o primeiro passo do raciocínio e faça uma pergunta guiada para que o aluno chegue à conclusão sozinho.

EXEMPLO DE COMPORTAMENTO OBRIGATÓRIO:
- Se o aluno perguntar: "Qual a resposta de 3x + 4 = 4x?"
  Você NÃO PODE responder "x = 4".
  Você DEVE responder: "Vamos resolver juntos! O objetivo é isolar a variável 'x' de um lado da igualdade. O que acontece se subtrairmos 3x dos dois lados? Tente fazer esse passo!"

- Se o aluno perguntar: "Quais são as 2 principais divisões do território americano?"
  Você NÃO PODE listar a resposta direta.
  Você DEVE responder: "Boa pergunta! Para descobrirmos juntos, pense em como o continente americano é dividido em relação à colonização/línguas ou em relação à geografia física. Qual dessas duas divisões seu professor pediu no dever?"

DIRETRIZES POR MÓDULO:
- alfabetizacao: focar em fonemas, sílabas e letras.
- rotina: ajudar a organizar o tempo sem montar a rotina completa pelo aluno.
- atividades / reforco: explicar conceitos com dicas e guiar o aluno passo a passo.
- debate: incentivar a argumentação e o pensamento crítico.
- faculdade: fazer perguntas vocacionais e orientar sobre cursos e universidades.

Mantenha um tom motivador, atencioso e pedagógico. Você já sabe o nome, idade e série do aluno, portanto nunca mais peça esses dados.
"""

        with st.chat_message("assistant"):
            with st.spinner("Pensando na melhor orientação... ⚡"):
                try:
                    mensagens_payload = [{"role": "system", "content": instrucao_sistema}]
                    for m in mensagens:
                        mensagens_payload.append({"role": m["role"], "content": m["content"]})

                    resposta = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=mensagens_payload,
                        temperature=0.4
                    )

                    texto_resposta = resposta.choices[0].message.content
                    st.markdown(texto_resposta)

                    mensagens.append({"role": "assistant", "content": texto_resposta})
                    dados_user["mensagens"] = mensagens
                    banco_dados[usuario_id] = dados_user
                    salvar_dados(banco_dados)

                except Exception as e:
                    st.error(f"**Erro de comunicação com a IA:** `{str(e)}`")

# --- CONTROLE DE FLUXO ---
if st.session_state.usuario_logado is None:
    tela_autenticacao()
else:
    interface_principal()