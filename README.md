# Frontend

Frontend do site institucional da Eldo Eletrostática (empresa de pintura eletrostática).

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- Docker / Docker Compose

## Estrutura

- `src/app` — páginas e rotas do Next.js
- `public/` — assets estáticos servidos pelo Next.js
- `legacy/` — site estático anterior (HTML/CSS/JS), preservado como referência; conteúdo ainda não migrado para o Next.js

## Requisitos

- Docker e Docker Compose

Rodar via Docker é a forma padrão de desenvolvimento deste projeto, garantindo o mesmo ambiente (versão do Node, dependências) entre todos os desenvolvedores.

Node.js 20+ e npm só são necessários se você optar por rodar localmente sem Docker (ver seção abaixo).

## Configuração

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

Variáveis disponíveis (`.env.example`):

| Variável | Descrição |
| --- | --- |
| `API_URL` | URL do Backend, usada só no servidor do Next. O navegador chama a API pelo proxy `/api` do próprio site (ADR 0007). Com o Docker Compose, `http://host.docker.internal:3001`; sem Docker, `http://localhost:3001` |
| `STORAGE_PUBLIC_URL` | URL pública do bucket de imagens, liberada para o `next/image` (`http://localhost:8333/eldo` no desenvolvimento; em produção, a URL pública do Cloudflare R2) |

## Rodando com Docker (padrão)

```bash
docker compose up --build
```

Acesse [http://localhost:3000](http://localhost:3000). O serviço sobe no estágio `dev` do `Dockerfile`, com hot-reload via volume montado.

Depois de puxar uma mudança no `package.json`, recrie o container com `docker compose up -d --build -V`. O `node_modules` fica num volume anônimo, e sem o `-V` o container continua com as dependências antigas (erro como `Cannot find module '@tailwindcss/postcss'`).

O `npm run build` precisa de `NODE_ENV=production`. Dentro do container de desenvolvimento, que define `NODE_ENV=development`, rode `docker compose run --rm -e NODE_ENV=production frontend npm run build`.

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Página inicial: portfólio, avaliações e contato PF |
| `/eventos` | Ações e eventos |
| `/solicitar-orcamento` | Orçamento PJ |
| `/acompanhar-servico` | Consulta da OS pelo CNPJ ou pelo protocolo |
| `/area-interna/login` | Login dos funcionários |
| `/area-interna/...` | Área interna: dashboard, relatórios, serviços, estoque, vendas, funcionários e editor do site |

O site público não tem link para a área interna: os funcionários entram pelo endereço. A `/area-interna` fica fora dos buscadores (`noindex` e `robots.txt`). A proteção de verdade está no login e nos guards do Backend.

Enquanto a integração da US09 não entra, o login ainda é o do protótipo: qualquer e-mail entra, e o nível de acesso sai do texto digitado (com `admin`, administrador; com `gestor`, gestor; os demais, funcionário).

## Chamadas à API

O navegador nunca chama o Backend direto. Uma requisição para `/api/<rota>` no site é repassada pelo Next para `<API_URL>/<rota>` (rewrites no `next.config.ts`), então o cookie da sessão é do próprio site (ADR 0007). Para o container do Frontend alcançar o Backend do host, o `docker-compose.yml` mapeia `host.docker.internal`.

## Rodando localmente sem Docker (alternativa)

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o build de produção |
| `npm run lint` | Executa o linter |
