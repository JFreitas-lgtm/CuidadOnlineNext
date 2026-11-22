# CuidadOnline Next

Aplicação fullstack de educação contra golpes digitais. Esta versão preserva o conteúdo e as atividades do CuidadOnline original, migrando a arquitetura para Next.js, TypeScript, MongoDB Atlas e Auth.js.

## Tecnologias e critérios da avaliação

- Next.js 16 com App Router, layouts, rotas dinâmicas, Server Components, `loading.tsx` e `error.tsx`.
- TypeScript estrito e separação entre componentes, bibliotecas, modelos, store e tipos.
- MongoDB Atlas/Mongoose com conexão Singleton segura para hot reload e serverless.
- Auth.js/NextAuth com Credentials Provider, sessão JWT e autorização por papel.
- Bcrypt com custo 12 para senhas.
- TanStack Query para dados remotos, mutations e invalidação de cache.
- Zustand apenas para estado visual local, como a busca da biblioteca.
- Tailwind CSS e componentes no padrão copy-paste do Shadcn/UI.
- `next/link` para navegação e `next/image` para mídia otimizada.

## Funcionalidades

- Acesso público a aulas, quiz, simulações, glossário e ajuda.
- Cadastro, login, logout, favoritos e progresso sincronizado.
- Relatório com leituras, tentativas, melhor quiz e simulações.
- Perfil editável e exclusão definitiva da conta confirmada por senha.
- Painel administrativo com métricas, usuários e CRUD completo de aulas.
- Exclusão em cascata de conteúdo e referências associadas.
- Seed idempotente com 6 aulas, 12 perguntas, 3 simulações, glossário, ajuda e administrador.

## Configuração local

Requer Node.js 22 ou superior e um banco MongoDB (Atlas recomendado).

```powershell
npm install
Copy-Item .env.example .env.local
```

O arquivo `.env.local` já fica ignorado pelo Git. Para iniciar sem administrador,
basta colar a URI obtida em **Atlas > Connect > Drivers**:

```env
MONGODB_URI=mongodb+srv://USUARIO:SENHA@HOST/cuidadonline?retryWrites=true&w=majority
```

Se o resolvedor local recusar a consulta SRV do Atlas, defina opcionalmente
`MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1`. Essa configuração não é necessária na Vercel.

Substitua `<db_password>` na URI copiada pelo Atlas. Se quiser criar o administrador
no mesmo seed, preencha também `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
`AUTH_SECRET` é obrigatório no deploy, mas o desenvolvimento local possui um fallback
que nunca é usado em produção.

Prepare os dados e inicie:

```powershell
npm run seed
npm run dev
```

Acesse `http://localhost:3000`. O seed pode ser executado novamente: conteúdos são atualizados sem duplicação.

## Verificações

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

## Proteção de acesso

O `proxy.ts` bloqueia páginas privadas. Cada Route Handler repete a verificação de sessão e papel. Rotas públicas nunca expõem o hash da senha. Contas desativadas não conseguem iniciar novas sessões.

## Roteiro de demonstração

1. Abra uma aula e uma simulação como visitante.
2. Crie uma conta, entre, favorite e conclua uma aula.
3. Complete o quiz e confira o relatório em **Progresso**.
4. Entre com o administrador criado no seed.
5. Crie, edite e exclua uma aula no painel; confirme a atualização imediata do catálogo.
6. Mostre o Singleton, JWT, Bcrypt, invalidação TanStack Query e estados `loading.tsx`/`error.tsx`.

## Deploy futuro na Vercel

Conecte o repositório à Vercel e cadastre `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` como variáveis protegidas. No Atlas, permita acesso da aplicação e mantenha credenciais fora do Git. Execute o seed uma vez contra o banco de produção.
