# Política de segurança

A segurança do NeuroPlayDockIA é tratada como um processo contínuo. Não existe garantia de que o sistema esteja livre de vulnerabilidades.

## Como comunicar um problema

Não publique detalhes de uma vulnerabilidade explorável em issues, comentários ou discussões públicas. Envie uma comunicação privada ao responsável pelo repositório por um canal privado do GitHub, incluindo:

- descrição objetiva do problema;
- componente e versão afetados;
- impacto observado;
- passos mínimos para reproduzir, sem acessar dados de terceiros;
- evidências sem senhas, tokens, cookies ou dados pessoais.

Aguarde uma resposta antes de divulgar publicamente os detalhes.

## Escopo de testes autorizados

Não realize testes contra contas, dados, infraestrutura ou serviços de terceiros sem autorização expressa. Não tente acessar, alterar ou apagar dados de outros usuários.

## Boas práticas para manutenção

- Armazene segredos somente nas variáveis de ambiente do provedor.
- Use credenciais distintas para desenvolvimento e produção.
- Revogue imediatamente chaves expostas e gere novas.
- Mantenha dependências atualizadas e avalie alertas de segurança.
- Preserve cookies de sessão com `HttpOnly`, `Secure` em produção e `SameSite`.
- Limite tamanho de requisições e tentativas de autenticação.
- Não registre senhas, tokens, conteúdo privado ou URLs com credenciais nos logs.
- Faça backups protegidos e teste a restauração.
- Revise permissões do repositório e dos serviços conectados.

## Resposta a incidentes

Ao confirmar um incidente: contenha o acesso, revogue credenciais comprometidas, preserve evidências necessárias, avalie o impacto sobre dados pessoais, corrija a causa e siga as obrigações legais de comunicação aplicáveis.
