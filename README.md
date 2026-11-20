# NeuroPlayDockIA

**Plataforma proprietária de aprendizagem assistida por inteligência artificial.**

> Código-fonte e materiais protegidos. Todos os direitos reservados. Este repositório não é open source e não concede licença pública de uso, cópia, modificação ou distribuição.

## Visão geral

O NeuroPlayDockIA é uma plataforma educacional com tutor de IA. Seu objetivo é apoiar a compreensão dos conteúdos, desenvolver o raciocínio e incentivar a autonomia do estudante — não funcionar como um gerador automático de trabalhos escolares.

### Princípios do tutor

- Explicar dúvidas conceituais de forma clara e completa.
- Orientar atividades escolares com pistas graduais, em vez de entregar respostas prontas para copiar.
- Corrigir tentativas com justificativas precisas.
- Adaptar a explicação ao contexto e ao nível informado pelo estudante.
- Admitir incertezas e não inventar fatos, fontes ou dados.
- Usar exemplos independentes para ensinar métodos sem substituir o trabalho do estudante.

Essas regras são instruções de comportamento do modelo. Como qualquer sistema generativo, o tutor ainda pode cometer erros; por isso, o comportamento precisa ser testado continuamente e não deve ser anunciado como infalível.

## Funcionalidades implementadas

- Cadastro e autenticação de usuários.
- Senhas armazenadas com hash bcrypt.
- Sessões persistidas no PostgreSQL.
- Histórico de conversas persistido por usuário.
- Módulos de reforço, alfabetização, organização, atividades, debate e ENEM.
- Integração com a API Groq.
- Interface web responsiva com renderização de mensagens em Markdown.

A disponibilidade real de cada recurso depende da configuração do ambiente e dos serviços externos.

## Arquitetura

- **Frontend:** HTML, CSS e JavaScript em `frontend/`.
- **Backend:** Node.js e Express em `backend/`.
- **Banco de dados:** PostgreSQL.
- **Sessões:** express-session com armazenamento PostgreSQL.
- **IA:** Groq SDK; o modelo é definido por `GROQ_MODEL`.

## Execução local

Requisitos: Node.js compatível com as dependências do projeto, npm e uma instância PostgreSQL.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz usando `.env.example` como referência.

3. Configure as variáveis:

   - `DATABASE_URL`: conexão PostgreSQL.
   - `SESSION_SECRET`: segredo aleatório forte, com pelo menos 32 caracteres.
   - `GROQ_API_KEY`: chave privada da API Groq.
   - `GROQ_MODEL`: identificador do modelo habilitado na conta.
   - `NODE_ENV=development` e, opcionalmente, `PORT=3000`.

4. Inicie:

   ```bash
   npm run dev
   ```

   Em produção:

   ```bash
   npm start
   ```

Nunca publique o arquivo `.env`, chaves de API, URLs de banco com credenciais, cookies, tokens ou dados de usuários.

## Estrutura principal

```text
backend/
  database/
  middleware/
  routes/
frontend/
  assets/
  css/
  js/
docs/
```

## Configuração de produção

O serviço precisa de variáveis secretas configuradas no provedor de hospedagem. Use a conexão privada/interna do PostgreSQL quando a infraestrutura oferecer essa opção. Não coloque credenciais no código ou em arquivos versionados.

Antes de cada publicação, valide autenticação, sessão, histórico, limites de requisição, tratamento de erros, responsividade e comportamento pedagógico. Consulte também `docs/RELEASE-CHECKLIST.md`.

## Privacidade e uso por estudantes

A plataforma pode processar dados de cadastro e mensagens enviadas ao tutor. As mensagens necessárias à geração da resposta são encaminhadas ao provedor de IA configurado. Antes de abrir o serviço ao público, publique uma política de privacidade verdadeira e revisada, defina prazos de retenção, implemente exclusão de conta e dados e avalie as exigências da LGPD, especialmente quando houver crianças e adolescentes.

Não insira dados pessoais, informações escolares sensíveis ou segredos em mensagens de teste.

## Segurança

Consulte [SECURITY.md](SECURITY.md) para comunicação responsável de vulnerabilidades. O arquivo `.gitignore` exclui arquivos locais sensíveis, mas isso não remove segredos que já tenham sido enviados ao histórico do Git. Se uma credencial for exposta, revogue-a e gere outra.

## Propriedade intelectual

O NeuroPlayDockIA, seu código-fonte, identidade visual, textos, organização, documentação e demais materiais originais são proprietários, salvo componentes de terceiros sujeitos às respectivas licenças. Consulte [LICENSE](LICENSE) e [NOTICE.md](NOTICE.md).

A publicação de uma página ou demonstração na internet não concede autorização para copiar, redistribuir, modificar, comercializar ou criar versões derivadas do projeto.

## Estado do projeto

Este README descreve a arquitetura e os recursos identificados no código. Não constitui certificação de segurança, auditoria independente, garantia de disponibilidade ou confirmação de que todos os cenários de produção foram testados.
