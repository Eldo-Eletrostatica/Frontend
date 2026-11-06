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

Enquanto a integração da US09 não entra, o login é o do protótipo: qualquer e-mail entra, e o nível de acesso sai do texto digitado (com `admin`, administrador; com `gestor`, gestor; os demais, funcionário).

## Chamadas à API

O navegador nunca chama o Backend direto. Uma requisição para `/api/<rota>` no site é repassada pelo Next para `<API_URL>/<rota>` (rewrites no `next.config.ts`), então o cookie da sessão é do próprio site (ADR 0007). Para o container do Frontend alcançar o Backend do host, o `docker-compose.yml` mapeia `host.docker.internal`.

Por exemplo, com o Backend no ar, http://localhost:3000/api/reviews devolve as avaliações pelo site.

## Imagem de produção

O estágio `prod` do `Dockerfile` gera uma imagem enxuta com o build `standalone` do Next:

```bash
docker build --target prod \
  --build-arg API_URL=https://<url-do-backend> \
  --build-arg STORAGE_PUBLIC_URL=https://<url-publica-do-r2> \
  -t eldo-frontend .
docker run -p 3000:3000 eldo-frontend
```

> [!IMPORTANT]
> A `API_URL` e a `STORAGE_PUBLIC_URL` valem no **build**: o `next build` grava o repasse do `/api` e o host liberado das imagens no resultado. Mudar as variáveis só no `docker run` não tem efeito.

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
