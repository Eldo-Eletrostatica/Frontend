<!--
Bloco comum: idêntico nos repos Frontend, Backend e Documentacao, assim como
GLOSSARY.md e docs/agents/. A cópia de referência é a da Documentacao: altere
lá e replique nos outros dois repos. A seção específica de cada repo fica no
fim deste arquivo.
-->

# Eldo Eletrostática

Site institucional com área de gestão interna para a Eldo Eletrostática, empresa de pintura eletrostática. É o projeto da disciplina TPPE: módulos como estoque, comissões e dashboards existem por exigência da disciplina, mesmo indo além da operação real do cliente. Trate toda User Story aberta como escopo válido.

## Repositórios

Três repositórios separados na organização `Eldo-Eletrostatica`, que se comunicam só por API REST:

- `Frontend`: Next.js (App Router) e TypeScript.
- `Backend`: NestJS no padrão MVC (Controller, Service, Entity), TypeORM e PostgreSQL.
- `Documentacao`: MkDocs Material, publicado no GitHub Pages.

## Requisitos

As regras de produto vêm das User Stories. Cada US é uma issue no repo `Documentacao` (`gh issue view <n> --repo Eldo-Eletrostatica/Documentacao`), com sub-issues técnicas no `Frontend` e no `Backend`. Leia a US antes de implementar uma funcionalidade. A US04 (avaliação feita no próprio site) foi descontinuada: as avaliações vêm só do Google (US05).

Quando o texto de uma US contradiz uma ADR, vale a ADR. Aponte a diferença para o grupo ajustar a US, em vez de implementar o texto antigo.

## Decisões de arquitetura

As decisões que valem para os três repos são ADRs no repo `Documentacao`, em `docs/adr/`, publicadas em https://eldo-eletrostatica.github.io/Documentacao/. Antes de mexer em banco, módulos ou integrações, leia a ADR da área (`gh api repos/Eldo-Eletrostatica/Documentacao/contents/docs/adr/<arquivo> --jq .content | base64 -d`). Código que contradiz uma ADR só entra com uma ADR nova que a revise, aprovada pelo grupo.

O que cada uma obriga:

- **0001 (chaves UUID e protocolo aleatório):** toda PK é UUID. O protocolo da OS é aleatório, com 8 caracteres e sem 0, O, 1 e I, nunca sequencial.
- **0002 (exclusão lógica seletiva):** só `employees`, `customers`, `catalog_items` e `inventory_items` têm `deleted_at`; as demais tabelas apagam de verdade.
- **0003 (preços e comissões congelados):** o item do pedido copia o preço por m² e o fator do catálogo, e a venda guarda a comissão calculada no lançamento. Mostre sempre o valor guardado, nunca recalcule.
- **0004:** substituída pela 0005.
- **0005 (modelo de 9 tabelas):** não crie tabela sem uma ADR que revise esta. Contato, orçamento, venda e OS são etapas de `orders`; tipos de pintura e materiais ficam em `catalog_items`; portfólio e eventos em `showcase_items`; categoria e fornecedor são texto no próprio registro; a comissão é uma regra por funcionário, em `employees`.
- **0006 (armazenamento):** imagens e PDFs ficam num armazenamento compatível com S3 (SeaweedFS no desenvolvimento, Cloudflare R2 do cliente em produção), e o banco guarda só a URL.

Ao criar ou alterar uma ADR, atualize esta lista nos três repos.

## Idioma

- Código em inglês: arquivos, variáveis, funções, classes, tabelas, colunas e comentários.
- Português do Brasil no resto: documentação, issues, PRs, mensagens de commit e textos exibidos ao usuário.

## Nomes

Ao nomear um conceito do domínio (orçamento, OS, categoria...), use o termo definido em `GLOSSARY.md`. Ele mapeia cada termo do negócio para um único nome em inglês, para que agentes diferentes cheguem ao mesmo nome.

| Onde | Padrão | Exemplo |
| --- | --- | --- |
| Variáveis, funções, métodos | camelCase | `estimatedPriceRange`, `findOverdueServiceOrders()` |
| Classes, tipos, componentes React | PascalCase | `QuoteItem`, `PortfolioGallery` |
| Constantes | UPPER_SNAKE_CASE | `MAX_PROJECTS_PER_CATEGORY` |
| Tabelas e colunas do PostgreSQL | snake_case | `service_orders.created_at` |

O nome diz o que o valor é ou o que a função faz, por extenso (`quantity`, `customerEmail`). Booleanos começam com `is`, `has` ou `can`; funções começam com um verbo.

## Código humanizado

É o recorte de SOLID adotado para a disciplina: código que outra pessoa do grupo entende lendo uma vez. Cada função faz uma coisa, cada classe tem uma responsabilidade e valores com significado de negócio viram constantes nomeadas.

Comentários registram o porquê técnico: uma restrição, um contorno, uma regra de negócio não óbvia. O histórico de como o código chegou ali vai na mensagem de commit.

## Escrita

Ao escrever texto em português (documentação, README, issue, PR, commit), siga `docs/agents/writing.md`.

## Git

- Commits no padrão Conventional Commits, com o tipo em inglês e a descrição em português: `feat: adiciona upload de PDF no orçamento`.
- Uma branch por tarefa, criada a partir da `main` (`feat/`, `fix/`, `docs/`, `test/`, `chore/`) e integrada por PR.
- Commit e push acontecem quando a pessoa pede.
- Commits e PRs levam só a autoria humana, sem linhas de atribuição a agentes.

## Agent skills

### Issue tracker

GitHub: USs no repo `Documentacao`, sub-issues técnicas nos repos de código, tudo no mesmo Project. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` na raiz de cada repo; as ADRs ficam só no repo `Documentacao`, em `docs/adr/`, com o resumo em "Decisões de arquitetura" acima. See `docs/agents/domain.md`.

## Este repo: Frontend

- Rotas do App Router em `src/app`. O nome da pasta vira a URL que o visitante vê, então segue o texto exibido: português, em kebab-case (`src/app/solicitar-orcamento`).
- Componentes React em arquivos PascalCase com o mesmo nome do componente (`PortfolioGallery.tsx`).
- A API do Backend fica em `NEXT_PUBLIC_API_URL` (`.env`), que aponta para `localhost:3001` em desenvolvimento.
- A pasta `legacy/` guarda o site estático antigo, como referência de conteúdo e imagens. O código novo vive em `src/`.
- Antes de dar uma tarefa por pronta, rode `npm run lint`.
