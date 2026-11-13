// Administrador: login (US09), funcionários e permissões (US10), tabela de
// orçamento (US08), identidade visual (US25, US26) e vitrine (US27). O que os
// testes criam é removido no próprio fluxo, e o que eles mudam no site
// publicado (o texto do logotipo, o título de um evento) volta ao original.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { By } = require("selenium-webdriver");

const {
  ADMIN_CREDENTIALS,
  EMPLOYEE_CREDENTIALS,
  acceptConfirmation,
  buildDriver,
  click,
  clickByText,
  login,
  open,
  openFromMenu,
  pageContains,
  runFlow,
  scrollIntoView,
  selectOption,
  setDateInput,
  step,
  typeInto,
  waitForElement,
  waitForText,
  waitForTextToDisappear,
} = require("./support/browser");
const { callApi, ensureSuiteAccounts, runLabel } = require("./support/api");

// A photo of the legacy site, already in the repository.
const PROJECT_IMAGE = path.resolve(__dirname, "..", "legacy", "img", "hero.jpg");
// Showcase limits of the Backend (showcase-items.constants.ts).
const MIN_PORTFOLIO_CATEGORIES = 4;
const MAX_PORTFOLIO_CATEGORIES = 6;
const MAX_PROJECTS_PER_CATEGORY = 3;
const MIN_COMPANY_EVENTS = 3;
const MAX_COMPANY_EVENTS = 10;
const DRAWER = By.css("aside.fixed");
const EVENT_IMAGE_INPUT = By.xpath("//aside//div[p[contains(., 'IMAGEM DO EVENTO')]]//input[@type='file']");

// The button of a showcase card (project or event) found by its title.
function cardButton(title, buttonText) {
  return By.xpath(`//div[p[normalize-space(.)='${title}']]//button[contains(., '${buttonText}')]`);
}

// Field of a drawer form whose label is a sibling of the input.
function drawerField(labelText, tag = "input") {
  return By.xpath(`//aside//label[contains(normalize-space(.), '${labelText}')]/following-sibling::${tag}`);
}

// Field of the site editor, whose label wraps the input.
function editorField(labelText, tag = "input") {
  return By.xpath(`//label[.//p[normalize-space(.)='${labelText}']]//${tag}`);
}

// A category with room for one more project, so removing the project keeps
// the showcase within its limits. Null when the showcase has no such room.
async function chooseProjectCategory() {
  const { data } = await callApi(null, "GET", "/showcase-items/portfolio-projects?limit=50");
  const projectsPerCategory = new Map();
  for (const project of data.items) {
    projectsPerCategory.set(project.category, (projectsPerCategory.get(project.category) ?? 0) + 1);
  }
  for (const [category, total] of projectsPerCategory) {
    if (total < MAX_PROJECTS_PER_CATEGORY) return category;
  }
  const categories = projectsPerCategory.size;
  if (categories >= MIN_PORTFOLIO_CATEGORIES && categories < MAX_PORTFOLIO_CATEGORIES) return "Testes E2E";
  return null;
}

describe("Administrador", () => {
  let driver;
  const label = runLabel();

  before(async () => {
    await ensureSuiteAccounts();
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  test("o administrador erra a senha, vê o aviso e entra (US09)", () => runFlow(driver, "admin-login", async () => {
    await open(driver, "/area-interna/login", "a tela de login");
    await driver.manage().deleteAllCookies();
    await typeInto(driver, By.css('input[type="email"]'), ADMIN_CREDENTIALS.email, "o e-mail");
    await typeInto(driver, By.css('input[type="password"]'), "senha-errada", "uma senha errada");
    await clickByText(driver, "button", "Entrar");
    await waitForText(driver, "E-mail ou senha inválidos.");

    await login(driver, ADMIN_CREDENTIALS);
    await waitForText(driver, "Funcionários");
  }));

  test("o administrador cadastra, edita e exclui um funcionário (US10)", () => runFlow(driver, "admin-funcionarios", async () => {
    const name = `${label} Ana Souza`;
    const email = `e2e.ana.${Date.now()}@eldo.test`;
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Funcionários");

    await clickByText(driver, "button", "Novo funcionário");
    await typeInto(driver, By.css("#employee-name"), name, "o nome");
    await typeInto(driver, By.css("#employee-email"), email, "o e-mail");
    await typeInto(driver, By.css("#employee-password"), "Senha@2026", "a senha inicial");
    await selectOption(driver, By.css("#employee-role"), "Gestor", "a permissão");
    await clickByText(driver, "button", "Criar conta");
    await waitForTextToDisappear(driver, "Criar conta");

    await typeInto(driver, By.css('input[placeholder="Buscar por nome ou e-mail"]'), email, "a busca");
    await waitForText(driver, name);

    await click(driver, By.css(`button[aria-label="Editar ${name}"]`), "editar o funcionário");
    await selectOption(driver, By.css("#employee-role"), "Funcionário", "a permissão");
    await clickByText(driver, "button", "Salvar alterações");
    await waitForTextToDisappear(driver, "Salvar alterações");

    await click(driver, By.css(`button[aria-label="Excluir ${name}"]`), "excluir o funcionário");
    await click(driver, By.xpath("//button[normalize-space(.)='Excluir']"), "confirmar a exclusão");
    await waitForTextToDisappear(driver, name);
  }));

  test("o funcionário comum não vê as telas de gestão nem de administração (US10)", () => runFlow(driver, "admin-permissoes", async () => {
    await login(driver, EMPLOYEE_CREDENTIALS);
    await waitForText(driver, "Estoque");
    const menu = await (await waitForElement(driver, By.css("nav"), null, "o menu")).getText();
    for (const restricted of ["Dashboard", "Relatórios", "Funcionários", "Tabela de orçamento", "Editor do site"]) {
      assert.ok(!menu.includes(restricted), `O funcionário não deveria ver "${restricted}"`);
    }
    await step(driver, "o menu mostra só as telas do funcionário");
  }));

  test("o administrador cadastra e remove um tipo de pintura na tabela de orçamento (US08)", () => runFlow(driver, "admin-tabela-orcamento", async () => {
    const paintName = `${label} Tinta poliéster`;
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Tabela de orçamento");
    await waitForText(driver, "Simulador automático no site");
    await waitForText(driver, "MARGEM DE NEGOCIAÇÃO (%)");

    await clickByText(driver, "button", "Adicionar");
    await waitForElement(driver, DRAWER, null, "o painel do item");
    await selectOption(driver, drawerField("TIPO", "select"), "Tipo de pintura (preço por m²)", "o tipo");
    await typeInto(driver, drawerField("NOME"), paintName, "o nome");
    await typeInto(driver, By.css('aside input[type="number"]'), "95", "o preço por m²");
    await clickByText(driver, "button", "Salvar item");
    await waitForText(driver, paintName);

    const row = By.xpath(`//tr[td[normalize-space(.)='${paintName}']]`);
    assert.ok((await (await waitForElement(driver, row, null, "a linha do item")).getText()).includes("ATIVO"));
    await click(driver, By.xpath(`//tr[td[normalize-space(.)='${paintName}']]//button[@title='Remover']`), "remover o item");
    await acceptConfirmation(driver);
    await waitForTextToDisappear(driver, paintName);
  }));

  test("o administrador muda o logotipo no rascunho, pré-visualiza e descarta (US25, US26)", () => runFlow(driver, "admin-identidade-visual", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Editor do site");
    await waitForText(driver, "Editor do Site");

    await clickByText(driver, "button", "Logotipo");
    await typeInto(driver, editorField("TEXTO DO LOGOTIPO"), "ELDO E2E", "o texto do logotipo");
    await clickByText(driver, "button", "Pré-visualizar");
    await waitForText(driver, "ELDO E2E");
    await clickByText(driver, "button", "Fechar prévia");

    await clickByText(driver, "button", "Salvar rascunho");
    await waitForText(driver, "Rascunho salvo.");
    await clickByText(driver, "button", "Descartar rascunho");
    await waitForText(driver, "Rascunho descartado.");
  }));

  test("o administrador publica um projeto no portfólio e o remove (US27)", () => runFlow(driver, "admin-vitrine", async () => {
    const category = await chooseProjectCategory();
    if (category === null) {
      console.log("  - o portfólio está no limite de projetos: o teste não cria outro");
      return;
    }
    const title = `${label} Portão industrial`;
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Editor do site");
    await clickByText(driver, "button", "Portfólio");

    await clickByText(driver, "button", "Novo projeto");
    await waitForElement(driver, DRAWER, null, "o painel do projeto");
    await typeInto(driver, editorField("TÍTULO"), title, "o título");
    await typeInto(driver, editorField("DESCRIÇÃO", "textarea"), "Portão de correr pintado com tinta a pó.", "a descrição");
    await typeInto(driver, editorField("CATEGORIA"), category, "a categoria");
    await typeInto(driver, editorField("TIPO DE SERVIÇO"), "Pintura eletrostática a pó", "o tipo de serviço");
    await typeInto(driver, editorField("MATERIAIS"), "Aço galvanizado", "os materiais");
    const coverInput = await driver.findElement(By.xpath("//aside//div[p[contains(., 'IMAGEM DE CAPA')]]//input[@type='file']"));
    await scrollIntoView(driver, coverInput);
    await step(driver, "envia a imagem de capa");
    await coverInput.sendKeys(PROJECT_IMAGE);
    await waitForElement(driver, By.xpath("//aside//div[p[contains(., 'IMAGEM DE CAPA')]]//img"), null, "a prévia da capa");
    await clickByText(driver, "button", "Salvar projeto");
    await waitForText(driver, "Projeto salvo.");

    await open(driver, "/", "o site para conferir o projeto publicado");
    const portfolio = await waitForElement(driver, By.css("#portfolio"), null, "o portfólio");
    await scrollIntoView(driver, portfolio);
    await waitForText(driver, title);
    await step(driver, "o projeto aparece no site");

    await open(driver, "/area-interna/editor-do-site", "o editor do site");
    await clickByText(driver, "button", "Portfólio");
    await click(driver, By.xpath(`//div[p[normalize-space(.)='${title}']]//button[contains(., 'REMOVER')]`), "remover o projeto");
    await acceptConfirmation(driver);
    await waitForText(driver, "Projeto removido.");
    assert.ok(!(await pageContains(driver, title)), "O projeto deveria sair do editor");
  }));

  test("o administrador publica a identidade visual, confere no site e volta a anterior (US25)", () => runFlow(driver, "admin-publicar-identidade", async () => {
    const publishedText = `${label} ELDO`;
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Editor do site");
    await clickByText(driver, "button", "Logotipo");
    const logoTextField = await waitForElement(driver, editorField("TEXTO DO LOGOTIPO"), null, "o texto do logotipo");
    const originalText = await logoTextField.getAttribute("value");

    await typeInto(driver, editorField("TEXTO DO LOGOTIPO"), publishedText, "o texto do logotipo");
    await clickByText(driver, "button", "Publicar alterações");
    await waitForText(driver, "Alterações publicadas.");

    await open(driver, "/", "o site para conferir a publicação");
    await waitForText(driver, publishedText);
    await step(driver, "o site mostra o logotipo publicado");

    await open(driver, "/area-interna/editor-do-site", "o editor do site");
    await clickByText(driver, "button", "Logotipo");
    await typeInto(driver, editorField("TEXTO DO LOGOTIPO"), originalText, "o texto original do logotipo");
    await clickByText(driver, "button", "Publicar alterações");
    await waitForText(driver, "Alterações publicadas.");
    await open(driver, "/", "o site para conferir que voltou");
    await waitForText(driver, originalText);
    assert.ok(!(await pageContains(driver, publishedText)), "O site deveria voltar ao logotipo anterior");
  }));

  test("o administrador publica um evento e o confere na página de eventos (US27)", () => runFlow(driver, "admin-eventos", async () => {
    const { data: events } = await callApi(null, "GET", "/showcase-items/company-events");
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Editor do site");
    await clickByText(driver, "button", "Eventos");

    if (events.length === 0) {
      console.log("  - a vitrine não tem eventos: o teste não cria um que não poderia remover");
      return;
    }
    // Creating and then removing an event needs room above the minimum and
    // below the maximum; otherwise the test edits an existing event and puts
    // its title back.
    const canCreateAndRemove = events.length >= MIN_COMPANY_EVENTS && events.length < MAX_COMPANY_EVENTS;
    if (!canCreateAndRemove) {
      const originalTitle = events[0].title;
      const editedTitle = `${originalTitle} ${label}`;
      await click(driver, cardButton(originalTitle, "EDITAR"), "editar o evento");
      await typeInto(driver, editorField("TÍTULO"), editedTitle, "o título");
      await clickByText(driver, "button", "Salvar evento");
      await waitForText(driver, "Evento salvo.");
      await open(driver, "/eventos", "a página de eventos");
      await waitForText(driver, editedTitle);
      await step(driver, "o evento editado aparece no site");

      await open(driver, "/area-interna/editor-do-site", "o editor do site");
      await clickByText(driver, "button", "Eventos");
      await click(driver, cardButton(editedTitle, "EDITAR"), "editar o evento de novo");
      await typeInto(driver, editorField("TÍTULO"), originalTitle, "o título original");
      await clickByText(driver, "button", "Salvar evento");
      await waitForText(driver, "Evento salvo.");
      return;
    }

    const title = `${label} Feira de Metalurgia`;
    await clickByText(driver, "button", "Novo evento");
    await waitForElement(driver, DRAWER, null, "o painel do evento");
    await typeInto(driver, editorField("TÍTULO"), title, "o título");
    await typeInto(driver, editorField("DESCRIÇÃO", "textarea"), "Estande com peças pintadas a pó.", "a descrição");
    await setDateInput(driver, await driver.findElement(By.css('aside input[type="date"]')), "2026-09-12");
    const imageInput = await driver.findElement(EVENT_IMAGE_INPUT);
    await scrollIntoView(driver, imageInput);
    await step(driver, "envia a imagem do evento");
    await imageInput.sendKeys(PROJECT_IMAGE);
    await waitForElement(driver, By.xpath("//aside//div[p[contains(., 'IMAGEM DO EVENTO')]]//img"), null, "a prévia da imagem");
    await clickByText(driver, "button", "Salvar evento");
    await waitForText(driver, "Evento salvo.");

    await open(driver, "/eventos", "a página de eventos");
    await waitForText(driver, title);
    await step(driver, "o evento aparece no site");

    await open(driver, "/area-interna/editor-do-site", "o editor do site");
    await clickByText(driver, "button", "Eventos");
    await click(driver, cardButton(title, "REMOVER"), "remover o evento");
    await acceptConfirmation(driver);
    await waitForText(driver, "Evento removido.");
  }));
});
