# Frontend

Frontend do site whitelabel da Eldo Eletrostática (empresa de pintura eletrostática).

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- Docker / Docker Compose

## Estrutura

- `src/app` — páginas e rotas do Next.js
- `public/` — assets estáticos servidos pelo Next.js
- `legacy/` — site estático anterior (HTML/CSS/JS), preservado como referência; conteúdo ainda não migrado para o Next.js

## Requisitos

- Node.js 20+
- npm
- Docker e Docker Compose (opcional, para rodar containerizado)

## Configuração

Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

Variáveis disponíveis (`.env.example`):

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API do backend (NestJS) |

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Rodando com Docker

```bash
docker compose up --build
```

Acesse [http://localhost:3000](http://localhost:3000). O serviço sobe no estágio `dev` do `Dockerfile`, com hot-reload via volume montado.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento com hot-reload |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o build de produção |
| `npm run lint` | Executa o linter |
