# Frontend

Frontend do site institucional da Eldo Eletrostática (empresa de pintura eletrostática), com o site público e a área interna dos funcionários.

> [!NOTE]
> As telas vieram do protótipo e ainda usam dados fixos, guardados em memória. A integração com o Backend segue a spec [#37](https://github.com/Eldo-Eletrostatica/Frontend/issues/37), uma User Story por PR, e cada tela troca os dados de exemplo pela API no PR da sua US.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) com React 19 e TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) (ícones) e [Recharts](https://recharts.org/) (gráficos do dashboard)
- Docker e Docker Compose

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `src/app` | Rotas do App Router. O nome da pasta vira a URL, em português e kebab-case. `(site)` agrupa as páginas públicas, que compartilham menu e rodapé |
| `src/components` | Componentes das telas. Os do site público ficam em `src/components/public` |
| `src/lib` | `routes.ts` (todos os caminhos, em `ROUTES`), os contexts com os dados do protótipo e a sessão provisória da área interna |
| `src/imports` | Logotipo e material importado do protótipo |
| `public/` | Arquivos estáticos servidos pelo Next.js |
| `legacy/` | Site estático anterior (HTML, CSS e JS), guardado como referência de conteúdo e imagens |

## Requisitos

- Docker e Docker Compose. Rodar pelo Docker é o padrão do projeto: todos usam a mesma versão do Node e das dependências.
- O [Backend](https://github.com/Eldo-Eletrostatica/Backend) rodando pelo `docker compose` dele, na porta 3001, para as telas que já chamam a API.

Node.js 20+ e npm só são necessários para rodar sem Docker.

## Configuração

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

| Variável | Descrição |
| --- | --- |
| `API_URL` | URL do Backend, lida só no servidor do Next. O navegador chama a API pelo proxy `/api` do próprio site (ADR 0007). Com o Docker Compose, `http://host.docker.internal:3001`; sem Docker, `http://localhost:3001` |
| `STORAGE_PUBLIC_URL` | URL pública do bucket de imagens, liberada para o `next/image`: `http://localhost:8333/eldo` no desenvolvimento e, em produção, a URL pública do Cloudflare R2 (ADR 0006) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Chave do site do Cloudflare Turnstile, o CAPTCHA do contato da página inicial e dos dois envios de `/solicitar-orcamento`. É pública (vai no HTML da página). No desenvolvimento, `1x00000000000000000000AA`, a chave de teste da Cloudflare que sempre passa; em produção, a chave do site cadastrado no painel da Cloudflare, par da chave secreta configurada no Backend |

Se o seu `.env` ainda tem a `NEXT_PUBLIC_API_URL`, copie o `.env.example` de novo: essa variável não é mais usada.

## Rodando com Docker (padrão)

Suba primeiro o Backend (no repositório dele, `docker compose up -d`) e depois o Frontend:

```bash
docker compose up --build
```

Acesse [http://localhost:3000](http://localhost:3000). O serviço sobe no estágio `dev` do `Dockerfile`, com hot-reload pelo volume montado.

Depois de puxar uma mudança no `package.json`, recrie o container com `docker compose up -d --build -V`. O `node_modules` fica num volume anônimo, e sem o `-V` o container continua com as dependências antigas (erro como `Cannot find module '@tailwindcss/postcss'`).

## Rodando sem Docker (alternativa)

Fora do container, `host.docker.internal` não existe. No `.env`, troque a `API_URL` por `http://localhost:3001` e rode:

```bash
npm install
npm run dev
```

O Frontend usa a porta 3000. Se o Backend também rodar sem Docker, suba ele na 3001 (`PORT=3001` no `.env` do Backend), porque o padrão dele também é a 3000.

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Página inicial: portfólio, avaliações e contato PF |
| `/eventos` | Ações e eventos |
| `/solicitar-orcamento` | Orçamento PJ |
| `/acompanhar-servico` | Consulta da OS pelo CNPJ ou pelo protocolo |
| `/area-interna/login` | Login dos funcionários |
| `/area-interna` | Dashboard |
| `/area-interna/relatorios`, `/servicos`, `/estoque`, `/vendas`, `/funcionarios`, `/editor-do-site` | Demais telas da área interna |

O site público não tem link para a área interna: os funcionários entram pelo endereço. A `/area-interna` fica fora dos buscadores (`noindex` e `robots.txt`). Cada tela aparece só para os níveis de acesso que podem usá-la, e quem não está logado vai para o login. A proteção de verdade está no login e nos guards do Backend.

O login é autenticado pelo Backend, com a sessão em cookies `HttpOnly` (ADR 0007). Contas para testar no desenvolvimento:

| Login | Senha | Nível de acesso | De onde vem |
| --- | --- | --- | --- |
| `admin@eldo.com.br` | `Admin@123` | administrador | Criado pelo Backend no primeiro login, quando ainda não há administrador (variáveis `INITIAL_ADMIN_*`) |
| `gestor.demo@eldo.com.br` | `Gestor@2026` | gestor | Dados de demonstração: no repositório do Backend, `docker compose exec backend npm run seed:demo` |

O gestor demo vem com pedidos de exemplo dos últimos seis meses, para o Dashboard ter o que mostrar. Os demais funcionários (`admin`, `manager` e `employee`) são gerenciados pelo administrador na tela `/area-interna/funcionarios`.

## Chamadas à API

O navegador nunca chama o Backend direto. Uma requisição para `/api/<rota>` no site é repassada pelo Next para `<API_URL>/<rota>` (rewrites no `next.config.ts`), então o cookie da sessão é do próprio site (ADR 0007). Para o container do Frontend alcançar o Backend do host, o `docker-compose.yml` mapeia `host.docker.internal`.

Por exemplo, com o Backend no ar, http://localhost:3000/api/reviews devolve as avaliações pelo site.

## Imagem de produção

O estágio `prod` do `Dockerfile` gera uma imagem enxuta com o build `standalone` do Next:

```bash
docker build --target prod \
  --build-arg API_URL=https://<url-do-backend> \
  --build-arg STORAGE_PUBLIC_URL=https://<url-publica-do-r2> \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=<chave-do-site-turnstile> \
  -t eldo-frontend .
docker run -p 3000:3000 eldo-frontend
```

> [!IMPORTANT]
> A `API_URL`, a `STORAGE_PUBLIC_URL` e a `NEXT_PUBLIC_TURNSTILE_SITE_KEY` valem no **build**: o `next build` grava o repasse do `/api`, o host liberado das imagens e as variáveis `NEXT_PUBLIC_` no resultado. Para trocar qualquer uma delas, gere a imagem de novo.
>
> A `API_URL` também é usada quando o site roda: as páginas montadas no servidor (portfólio, eventos e opções do simulador) buscam os dados direto no Backend. O estágio `prod` guarda na imagem o valor passado no build, então não é preciso repetir a variável no `docker run`.
>
> No Render, o Blueprint do Backend não preenche a `API_URL`, e sim a `API_HOSTPORT`: o `host:porta` da API na rede privada, que só existe depois de a API ser criada. Sem `API_URL`, o site usa `http://<API_HOSTPORT>`.

Para testar o build sem gerar a imagem, rode dentro do container de desenvolvimento com `NODE_ENV=production`, porque o estágio `dev` define `NODE_ENV=development` e o `next build` falha com ele:

```bash
docker compose run --rm -e NODE_ENV=production frontend npm run build
```

## Integração contínua

Todo PR para a `main` ou para a `producao` e todo push nelas rodam o workflow `.github/workflows/ci.yml`: `npm ci`, `lint`, `typecheck` e `build`. O Render só publica um commit depois que esse check (**Lint, tipos e build**) passa: a `main` vai para a homologação e a `producao` para a produção. O caminho completo de uma mudança está no README do Backend, em "Deploy no Render".

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera o build de produção (com `NODE_ENV=production`) |
| `npm run start` | Inicia o build de produção |
| `npm run lint` | Executa o linter. Rode antes de dar uma tarefa por pronta |
| `npm run typecheck` | Gera os tipos das rotas (`next typegen`) e checa os tipos com o `tsc`. Funciona num checkout limpo, sem precisar de um build antes |
| `npm run test:e2e` | Roda a suíte de ponta a ponta com Selenium, com o Chrome aberto e uma pausa entre os passos |
| `npm run e2e:check-driver` | Confere se o Selenium abre o Chrome e mostra as versões do navegador e do ChromeDriver |

## Testes de ponta a ponta

A suíte em `e2e/` usa Selenium. Ela abre o Chrome da máquina que roda e visita o site no endereço de `E2E_BASE_URL`: o localhost ou a **homologação**, nunca a produção, porque a suíte cria contatos, orçamentos, vendas e funcionários de teste (ADR 0009). O Selenium Manager, que vem com o `selenium-webdriver`, baixa o ChromeDriver compatível com o Chrome instalado. Precisa do Node 22 e do Docker, que roda o cliente do PostgreSQL.

### Fluxos

A suíte roda por fluxo de interação, uma jornada que pode passar por várias pessoas (visitante, funcionário, gestor, cliente):

| Fluxo | O que cobre | Arquivos e USs |
| --- | --- | --- |
| `vitrine` | Visitante navega pelo portfólio, pelos eventos e pelas avaliações | `01` (US01, US02, US03, US05) |
| `contato` | Visitante envia um contato e pede orçamento pelo simulador e por PDF | `02` (US06, US07) |
| `venda` | Orçamento até a venda, OS, status, atraso e consulta pelo cliente | `07`, `06` e `03` (US21, US17, US18, US20, US19) |
| `comissoes` | Regra de comissão, comissão do funcionário e relatório do gestor | `07` e `08` (US22, US23, US24) |
| `estoque` | Categoria, item, entrada e saída, alerta de mínimo e histórico | `05` (US13 a US16) |
| `gestao` | Dashboard e exportação do período | `08` (US11, US12) |
| `administracao` | Login, funcionários, permissões, tabela de orçamento, identidade visual, portfólio e eventos | `04` (US08, US09, US10, US25, US26, US27) |
| `celular` | Site e área interna numa tela de 390 px, sem rolagem lateral | `09` |
| `fumaca` | Um teste de cada fluxo, para conferir um deploy em poucos minutos | |

```bash
npm run test:e2e                     # todos os fluxos, na ordem da tabela
npm run test:e2e -- venda estoque    # só esses
npm run test:e2e -- fumaca           # checagem rápida
```

Antes de abrir o Chrome, o `e2e/run.js` confere as variáveis e acorda o site e a API, que na homologação dormem depois de 15 minutos sem acesso. Um teste que falha não para os outros e salva um print em `e2e/screenshots/`; os arquivos exportados vão para `e2e/downloads/`.

### O banco volta ao estado de antes

Com `E2E_DATABASE_URL`, o script tira uma cópia do banco antes dos fluxos (`pg_dump`, pelo Docker) e a carrega de volta no fim (`pg_restore`, numa transação só). Isso vale também quando um teste falha ou quando alguém aperta Ctrl+C: o teste em andamento para, os fluxos seguintes não rodam, e o banco é restaurado antes de o script sair. Se a restauração falhar, o script mostra onde ficou a cópia, para carregar à mão.

Enquanto roda, a suíte marca o banco como em uso, no comentário do banco. Uma segunda execução contra o mesmo banco recusa começar, para uma não restaurar o banco no meio da outra. Uma marca com mais de 1 hora é de uma execução que morreu e é ignorada.

Sem a variável, o que a suíte cria fica no banco, com o prefixo `E2E`.

### Rodando na sua máquina

Contra o ambiente local, com o Backend de pé pelo `docker compose` dele (porta 3001) e o Frontend na porta 3000:

```bash
npm run e2e:check-driver
E2E_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres npm run test:e2e
```

Contra a homologação, com os valores do painel do Render (`eldo-api-homolog`) e do Neon (projeto `eldo-homolog`, conexão direta):

```bash
E2E_BASE_URL=https://eldo-site-homolog.onrender.com \
E2E_ADMIN_EMAIL=<admin da homologação> E2E_ADMIN_PASSWORD=<senha> \
E2E_CAPTCHA_TOKEN=<E2E_CAPTCHA_TOKEN da eldo-api-homolog> \
E2E_DATABASE_URL='postgresql://<usuário>:<senha>@<host>/<banco>?sslmode=require' \
npm run test:e2e -- venda
```

**CAPTCHA:** a Cloudflare não deixa navegador automatizado passar no desafio do Turnstile. A suíte grava no navegador o `E2E_CAPTCHA_TOKEN` do Backend, e os formulários públicos mandam esse token no lugar do widget. Um visitante de verdade não tem esse valor e vê o CAPTCHA normal; um token errado é recusado pela API, o que os testes do Backend cobrem.

| Variável | Padrão |
| --- | --- |
| `E2E_BASE_URL` | `http://localhost:3000`, o Frontend local |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@eldo.com.br` / `Admin@123`; fora do localhost a senha é obrigatória |
| `E2E_MANAGER_EMAIL` / `E2E_MANAGER_PASSWORD` | `e2e.gestor@eldo.test` / `E2eGestor@2026`, criado pela suíte se não existir |
| `E2E_EMPLOYEE_EMAIL` / `E2E_EMPLOYEE_PASSWORD` | `e2e.funcionario@eldo.test` / `E2eFuncionario@2026`, criado pela suíte se não existir |
| `E2E_CAPTCHA_TOKEN` | O valor de desenvolvimento do Backend; na homologação, o gerado pelo Render na `eldo-api-homolog`, obrigatório. A produção não tem esse token |
| `E2E_DATABASE_URL` | Sem valor, o banco não é restaurado. Na homologação, a conexão direta do Neon, com `?sslmode=require` |
| `E2E_STEP_DELAY_MS` | `1000`, a pausa entre os passos para quem assiste; `0` roda direto |
| `E2E_HEADLESS` | `false`, com o navegador aberto na tela; `true` roda sem tela |

### No GitHub Actions

O workflow `.github/workflows/e2e-homologacao.yml` roda o fluxo `fumaca` sem tela depois de cada commit na `main`. Ele espera o CI passar e o Render publicar o commit na homologação (a rota `/versao` do site devolve o commit no ar) e só então abre o Chrome. Se falhar, os prints ficam como artefato da execução, e a mudança não deve ser promovida para a `producao`.

Para rodar outros fluxos, ou depois de uma mudança no Backend, use **Actions → Selenium na homologação → Run workflow** e informe os fluxos.

O workflow usa estes segredos do repositório (Settings → Secrets and variables → Actions): `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_CAPTCHA_TOKEN` e `E2E_DATABASE_URL`, com os mesmos valores da homologação acima.
