# Checklist de publicação

Use esta lista antes de cada deploy de produção. Marcar um item exige teste real; não basta presumir que funciona.

## Repositório e segredos
- [ ] Repositório privado no GitHub.
- [ ] Nenhum arquivo `.env`, token, senha ou credencial no histórico Git.
- [ ] Segredos de produção configurados somente no provedor.
- [ ] Acesso de colaboradores limitado ao necessário.
- [ ] Dependências e alertas de segurança revisados.

## Aplicação
- [ ] Cadastro com dados válidos e inválidos.
- [ ] Login, logout e regeneração de sessão.
- [ ] Páginas protegidas não exibem dados sem autenticação.
- [ ] Sessão continua válida após atualização e expira conforme a política definida.
- [ ] Histórico pertence somente à conta autenticada.
- [ ] Nova conversa limpa apenas o histórico pretendido.
- [ ] Erros do provedor de IA são tratados sem expor detalhes internos.
- [ ] Limites de tamanho e frequência estão ativos.
- [ ] Interface funciona em celular, tablet e desktop.
- [ ] Teclado, foco, rótulos e mensagens de erro são acessíveis.

## Tutor pedagógico
- [ ] Pergunta conceitual recebe explicação direta.
- [ ] Exercício escolar recebe orientação e pistas, não gabarito automático.
- [ ] Tentativa do estudante é corrigida com justificativa.
- [ ] Redação ou trabalho não é produzido integralmente para copiar.
- [ ] Pedido de explicação passo a passo é atendido sem perguntas artificiais.
- [ ] Tabelas Markdown são renderizadas em linhas e colunas.
- [ ] Conteúdo factual é revisado para detectar invenções e erros.
- [ ] Testes são repetidos em diferentes módulos e assuntos.

## Privacidade e conformidade
- [ ] Política de privacidade corresponde ao funcionamento real.
- [ ] Termos de uso foram revisados.
- [ ] Finalidades e bases legais do tratamento de dados foram avaliadas.
- [ ] Fluxo de consentimento e proteção de crianças e adolescentes foi avaliado.
- [ ] Exclusão de conta e dados foi implementada e testada.
- [ ] Prazos de retenção e rotina de backup foram definidos.
- [ ] Operadores e provedores que recebem dados estão documentados.

## Liberação
- [ ] Deploy concluído no provedor.
- [ ] Logs sem erros críticos.
- [ ] Endpoints e fluxo completo testados em produção.
- [ ] Backup recente e restauração verificada.
- [ ] Versão e alterações registradas.

**Não marque a publicação como aprovada enquanto itens críticos estiverem pendentes.**
