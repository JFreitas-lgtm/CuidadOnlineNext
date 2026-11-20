# Planejamento da fase PostgreSQL

## Entregas implementadas

- API Express no mesmo domínio do frontend.
- PostgreSQL com migração versionada e executor idempotente.
- Cadastro, login, logout, sessão, CSRF, rate limit e senha com `scrypt`.
- Persistência por usuário de leituras, favoritos, quizzes, simulações e tema.
- Remoção do `localStorage` e do backup JSON local.
- Modo visitante sem persistência.
- Área administrativa com métricas, busca, filtros, paginação, detalhe, status e auditoria.
- Administrador inicial criado por variáveis de ambiente.
- Testes unitários e integração opcional com banco exclusivo.

## Validação necessária no ambiente da equipe

- Criar os bancos `cuidadonline` e `cuidadonline_test`.
- Preencher `.env` sem enviar credenciais ao Git.
- Executar migração e criação do administrador.
- Rodar `npm run test:integration` com o PostgreSQL local.
- Validar visualmente login, cadastro, progresso e administração.
- Configurar `Secure` e HTTPS antes de publicar em produção.

## Fora desta versão

- Recuperação de senha por e-mail.
- Edição administrativa de aulas, perguntas ou simulações.
- Promoção de administradores pela interface.
- Migração de progresso antigo do navegador.
- Exclusão física de contas pela administração.
