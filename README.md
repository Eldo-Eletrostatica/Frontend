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

Para testar o build sem gerar a imagem, rode dentro do container de desenvolvimento com `NODE_ENV=production`, porque o estágio `dev` define `NODE_ENV=development` e o `next build` falha com ele:

```bash
docker compose run --rm -e NODE_ENV=production frontend npm run build
```

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

A suíte em `e2e/` usa Selenium. Ela roda na máquina de quem testa: abre o Chrome dessa máquina e visita o site no endereço de `E2E_BASE_URL`, que pode ser o localhost ou o site em produção. Nada roda no servidor. O Selenium Manager, que vem com o `selenium-webdriver`, baixa o ChromeDriver compatível com o Chrome instalado.

Cada arquivo cobre uma visão, com um teste por fluxo. Um fluxo que falha não para os outros e salva um print em `e2e/screenshots/`:

| Arquivo | Fluxos |
| --- | --- |
| `01-visitante-vitrine` | Portfólio e filtro (US01), detalhe do projeto (US02), eventos (US03), avaliações do Google (US05) |
| `02-visitante-contato` | Contato de pessoa física (US06), orçamento pelo simulador e por PDF (US07) |
| `03-cliente-consulta-os` | Consulta da OS pelo protocolo e pelo CNPJ, protocolo inexistente (US19) |
| `04-administrador` | Login (US09), funcionários e permissões (US10), tabela de orçamento (US08), identidade visual (US25, US26), portfólio (US27) |
| `05-estoque` | Categorias e itens (US13), entradas e saídas (US14), alerta de mínimo (US15), histórico (US16) |
| `06-servicos` | OS criada pela venda (US17), status da OS (US18), painel de atrasos (US20) |
| `07-vendas-comissoes` | Orçamento até a venda e venda direta (US21), regra de comissão (US22), comissões do funcionário (US23) |
| `08-gestor` | Dashboard (US11), exportação (US12), relatórios e ranking (US24) |
| `09-celular` | Site e área interna numa tela de 390 px, sem rolagem lateral |

Os testes preparam pela API o que cada fluxo precisa (a conta do gestor e a do funcionário da suíte, o catálogo, vendas e itens). Tudo o que criam leva o prefixo `E2E`. Itens, categorias, projetos e o funcionário cadastrado no teste são removidos no fim, e as OS criadas ficam concluídas. As contas do gestor e do funcionário da suíte ficam, para as próximas execuções. Vendas e pedidos não têm exclusão e continuam no histórico. A identidade visual só vai até o rascunho, que é descartado, e os arquivos exportados vão para `e2e/downloads/`.

Para rodar contra o ambiente local, com o Backend e o Frontend de pé:

```bash
npm run dev -- -p 3001
npm run e2e:check-driver
npm run test:e2e                              # tudo, em sequência
node --test --test-reporter=spec e2e/05-estoque.test.js    # só um arquivo
```

Para rodar contra produção, troque o endereço e informe as credenciais e o token do CAPTCHA de produção:

```bash
E2E_BASE_URL=https://<site> E2E_ADMIN_PASSWORD=<senha> E2E_CAPTCHA_TOKEN=<token> npm run test:e2e
```

**CAPTCHA:** a Cloudflare não deixa navegador automatizado passar no desafio do Turnstile de produção. A suíte grava no navegador o `E2E_CAPTCHA_TOKEN` do Backend, e os formulários públicos mandam esse token no lugar do widget. Um visitante de verdade não tem esse valor e vê o CAPTCHA normal; um token errado é recusado pela API.

| Variável | Padrão |
| --- | --- |
| `E2E_BASE_URL` | `http://localhost:3001` |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@eldo.com.br` / `Admin@123` |
| `E2E_MANAGER_EMAIL` / `E2E_MANAGER_PASSWORD` | `e2e.gestor@eldo.test` / `E2eGestor@2026`, criado pela suíte se não existir |
| `E2E_EMPLOYEE_EMAIL` / `E2E_EMPLOYEE_PASSWORD` | `e2e.funcionario@eldo.test` / `E2eFuncionario@2026`, criado pela suíte se não existir |
| `E2E_CAPTCHA_TOKEN` | O valor de desenvolvimento do Backend; em produção, o mesmo `E2E_CAPTCHA_TOKEN` configurado no Backend |
| `E2E_STEP_DELAY_MS` | `1000`, a pausa entre os passos para quem assiste; `0` roda direto |
| `E2E_HEADLESS` | `false`, com o navegador aberto na tela; `true` roda sem tela |
