# CuidadOnline

Aplicação de educação contra golpes digitais feita com HTML, CSS e JavaScript puro no frontend, API Node.js/Express e PostgreSQL. Leituras e exercícios podem ser explorados sem conta; cadastro e login permitem sincronizar progresso, favoritos, quizzes e simulações.

## Requisitos

- Node.js 22.13 ou superior.
- PostgreSQL 18 ou compatível.
- Um banco principal; um segundo banco é opcional e usado apenas nos testes de integração.

## Configurar em outra máquina

Clone o projeto e instale as dependências:

```powershell
git clone https://github.com/joaofreitas77/CuidadOnline.git
cd CuidadOnline
npm install
```

### 1. Preparar o PostgreSQL no Windows

Se `psql` não estiver no `PATH`, abra-o pelo caminho instalado:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -U postgres -d postgres
```

Para desenvolvimento local, é possível usar o usuário `postgres` já criado pela instalação e criar somente o banco:

```sql
CREATE DATABASE cuidadonline;
```

Para ambientes compartilhados ou publicados, prefira um usuário exclusivo com acesso apenas ao banco da aplicação:

```sql
CREATE ROLE cuidadonline LOGIN PASSWORD 'troque-esta-senha';
CREATE DATABASE cuidadonline OWNER cuidadonline;
```

O banco de teste é opcional. Se quiser executar os testes de integração, crie um banco separado que possa ser limpo pelos testes:

```sql
CREATE DATABASE cuidadonline_test;
```

### 2. Criar o arquivo local de configuração

No PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

No Prompt de Comando (`cmd`):

```cmd
copy .env.example .env
notepad .env
```

Preencha o `.env` com os dados da máquina. Exemplo usando o usuário local `postgres`:

```env
DATABASE_URL=postgresql://postgres:SENHA_DO_POSTGRES@127.0.0.1:5432/cuidadonline
DATABASE_URL_TEST=
SESSION_SECRET=COLOQUE_UMA_SEQUENCIA_ALEATORIA_COM_MAIS_DE_32_CARACTERES
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=COLOQUE_UMA_SENHA_FORTE_COM_12_OU_MAIS_CARACTERES
PORT=3000
NODE_ENV=development
```

- `DATABASE_URL` conecta a API ao PostgreSQL.
- `DATABASE_URL_TEST` pode ficar vazia; só é necessária para `test:integration`.
- `SESSION_SECRET` não deve ter aspas e precisa ser uma sequência secreta com pelo menos 32 caracteres.
- `ADMIN_EMAIL` e `ADMIN_PASSWORD` serão usados pelo administrador inicial.
- `PORT` é a porta do site/API; `5432`, dentro da URL, é a porta padrão do PostgreSQL.
- Use `NODE_ENV=development` localmente. `production` exige HTTPS para o cookie de sessão.

Se a senha do PostgreSQL tiver caracteres como `@`, `:`, `/`, `#` ou `%`, codifique esses caracteres para uso em URL ou escolha uma senha local composta por letras e números.

O arquivo `.env` está no `.gitignore`; confirme antes de qualquer commit com `git status --ignored`.

### 3. Criar as tabelas e iniciar

```powershell
npm run db:migrate
npm run db:seed-admin
npm start
```

Abra http://localhost:3000. Use o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` definidos no `.env` para acessar a administração. Não use Live Server: o frontend e a API precisam ser entregues juntos pelo servidor Node.

As migrações são idempotentes: executar `npm run db:migrate` novamente não reaplica versões concluídas.

## Comandos

| Comando | Função |
| --- | --- |
| `npm start` | Inicia frontend e API. |
| `npm run dev` | Inicia com reinício automático do Node. |
| `npm run db:migrate` | Aplica migrações SQL pendentes. |
| `npm run db:seed-admin` | Cria ou atualiza o administrador definido no `.env`. |
| `npm test` | Executa testes unitários e ignora integração sem banco configurado. |
| `npm run test:integration` | Executa testes usando `DATABASE_URL_TEST`. |
| `npm run build` | Copia os arquivos públicos para `dist/`. |
| `npm run preview` | Serve a versão de `dist/` com a mesma API. |

## Contas e segurança

- Senhas usam `scrypt`, salt aleatório e comparação resistente a timing attacks.
- Sessões ficam no PostgreSQL e usam cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Ações de escrita exigem token CSRF.
- Login e cadastro possuem limite de tentativas.
- Queries usam parâmetros; não há concatenação de entrada do usuário em SQL.
- Contas desativadas perdem suas sessões imediatamente.
- O primeiro administrador é criado somente pelo script `db:seed-admin`.
- Não há recuperação de senha por e-mail nesta versão.

Nunca publique `.env`, URLs com senha, `SESSION_SECRET` ou credenciais administrativas. Somente `.env.example`, com valores fictícios, pertence ao repositório.

## Dados persistidos

O PostgreSQL armazena:

- nome, e-mail normalizado, hash da senha, papel, status e tema;
- visitas, conclusões e favoritos por leitura;
- tentativas e respostas de quizzes;
- simulações concluídas e seus resultados;
- sessões e auditoria de ações administrativas.

O site não usa `localStorage`. Visitantes podem explorar o conteúdo, mas atividades só são persistidas após login. Dados antigos que estavam no navegador não são importados.

## Área administrativa

Administradores recebem a opção `Administração` na navegação. A área contém:

- totais de usuários ativos, desativados e novos;
- leituras, quizzes, média de acertos e simulações;
- busca, filtro e paginação de usuários;
- detalhe individual de atividades;
- desativação e reativação de contas;
- histórico de auditoria.

Usuários comuns são bloqueados também pela API, independentemente do que aparece no frontend. A área não permite promover administradores nem editar conteúdo educativo.

## API

Principais grupos:

- `/api/auth`: cadastro, login, logout e sessão atual;
- `/api/account`: perfil, senha e tema;
- `/api/progress`: leituras, favoritos, quiz, simulações e exclusão do progresso;
- `/api/admin`: resumo, usuários, status e auditoria.

Erros usam o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Confira os campos informados.",
    "fields": {}
  }
}
```

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `server/` | Aplicação Express, segurança, sessões e conexão PostgreSQL. |
| `migrations/` | Esquema SQL versionado. |
| `scripts/migrate.mjs` | Executor idempotente de migrações. |
| `scripts/seed-admin.mjs` | Preparação segura do administrador inicial. |
| `src/api.js` | Cliente HTTP e tratamento padronizado de erros. |
| `src/app.js` | Integração da interface, sessão, rotas e eventos. |
| `src/progress.js` | Estado em memória da tela sincronizado com a API. |
| `src/admin.js` | Interface administrativa. |
| `tests/integration/` | Fluxo real contra o banco de testes. |

## Testes

Para executar a integração, configure `DATABASE_URL_TEST` para um banco exclusivo. O teste limpa as tabelas desse banco e nunca deve apontar para produção.

```powershell
npm test
npm run test:integration
npm run build
```

Checklist manual:

- cadastrar duas contas e confirmar isolamento do progresso;
- entrar, sair e abrir novamente a sessão;
- concluir leitura, quiz e simulação em aparelhos ou navegadores diferentes;
- favoritar e apagar o progresso sem apagar a conta;
- testar sessão expirada e indisponibilidade do servidor;
- confirmar que usuário comum não acessa endpoints administrativos;
- desativar uma conta e verificar encerramento imediato da sessão;
- testar teclado, foco, zoom, tema e telas estreitas.

## Conteúdo e referências

- [CERT.br — Fascículos educativos](https://cartilha.cert.br/fasciculos/)
- [Banco Central — Segurança no Pix](https://www.bcb.gov.br/estabilidadefinanceira/pix-seguranca)
- [NIC.br — Orientações após um golpe](https://www.nic.br/noticia/releases/caiu-em-um-golpe-novo-fasciculo-do-cert-br-da-orientacoes-sobre-como-agir/)
- [W3C — Acessibilidade para pessoas mais velhas](https://www.w3.org/WAI/older-users/developing/)
