# Revisão de privacidade e LGPD — pendente de validação

Este documento é um roteiro interno de implementação. **Não é uma política de privacidade publicada nem substitui revisão jurídica.** Não apresente declarações abaixo como garantias até confirmar o funcionamento real dos serviços e contratos.

## Dados identificados na arquitetura atual

O cadastro da plataforma contempla nome, nome de usuário, idade, série escolar e credencial armazenada como hash. O sistema também mantém mensagens do tutor e dados de sessão no PostgreSQL.

As mensagens enviadas ao tutor são processadas pelo backend e encaminhadas ao provedor de IA configurado para gerar respostas. A infraestrutura de hospedagem e banco de dados também processa dados técnicos necessários à operação.

## Pendências antes de abrir o serviço ao público

1. Identificar formalmente o controlador e os operadores de dados.
2. Confirmar quais dados são enviados ao provedor de IA, em quais condições e por quanto tempo são retidos.
3. Definir finalidade e base legal para cada categoria de dado.
4. Avaliar o tratamento de dados de crianças e adolescentes, incluindo melhor interesse, transparência e participação de responsáveis quando aplicável.
5. Definir prazos de retenção para contas, conversas, sessões, logs e backups.
6. Implementar fluxo seguro de exclusão de conta e dados associados.
7. Disponibilizar canal para solicitações dos titulares.
8. Documentar incidentes, controles de acesso e rotina de backup.
9. Publicar aviso de privacidade em linguagem acessível e coerente com a operação real.
10. Obter revisão especializada antes de tratar dados de usuários reais em escala.

## Princípios de implementação

- Coletar somente os dados necessários.
- Não usar mensagens dos estudantes para finalidades incompatíveis com a finalidade educacional.
- Não registrar senhas, tokens ou conteúdo privado em logs.
- Restringir o acesso administrativo ao banco.
- Não prometer exclusão, anonimização ou retenção que ainda não estejam implementadas e verificadas.
