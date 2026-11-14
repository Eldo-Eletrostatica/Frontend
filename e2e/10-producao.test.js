// Produção: checagem só de leitura depois de uma promoção. Nada aqui grava no
// banco nem envia formulário: o fluxo producao roda no site que os clientes
// usam, com a conta de gestor de teste (E2E_MANAGER_EMAIL), criada à mão pelo
// administrador.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  IS_PRODUCTION,
  MANAGER_CREDENTIALS,
  buildDriver,
  buildMobileDriver,
  clickByText,
  hasHorizontalScroll,
  login,
  open,
  openFromMenu,
  pageContains,
  runFlow,
  step,
  typeInto,
  waitForElement,
  waitForText,
} = require("./support/browser");
const { ensureSuiteAccounts } = require("./support/api");

// Valid protocol characters (no 0, O, 1 or I) that no sale will ever get.
const UNKNOWN_TRACKING_CODE = "ZZZZZZZZ";
const ESTIMATOR_TOGGLE = "Prefere preencher item a item?";
const INTERNAL_SCREENS = ["Dashboard", "Serviços", "Estoque", "Orçamentos", "Vendas", "Comissões", "Relatórios"];
const PUBLIC_PAGES = [
  ["/", "a página inicial"],
  ["/eventos", "os eventos"],
  ["/solicitar-orcamento", "o orçamento"],
  ["/acompanhar-servico", "o acompanhamento de serviço"],
];

describe("Produção", () => {
  let driver;

  before(async () => {
    // To rehearse the flow on localhost or staging, where the suite owns the
    // accounts. In production the administrator creates the manager by hand.
    if (!IS_PRODUCTION) await ensureSuiteAccounts();
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  test("a página de orçamento carrega o envio de PDF e o simulador, sem enviar", () => runFlow(driver, "producao-orcamento", async () => {
    await open(driver, "/solicitar-orcamento", "a página de orçamento");
    await waitForText(driver, "Orçamento para");
    await waitForElement(driver, By.xpath("//form[.//button[contains(., 'Enviar projeto')]]"), null, "o envio de PDF");
    if (!(await pageContains(driver, ESTIMATOR_TOGGLE))) {
      await step(driver, "o simulador está desativado: só o envio de PDF aparece");
      return;
    }
    await clickByText(driver, "button", ESTIMATOR_TOGGLE);
    const piecesForm = await waitForElement(driver, By.xpath("//form[.//*[contains(., 'PEÇAS DO PROJETO')]]"), null, "o simulador");
    const paintOptions = await piecesForm.findElements(By.xpath("(.//select)[1]/option"));
    assert.ok(paintOptions.length > 1, "O simulador deveria listar ao menos um tipo de pintura");
  }));

  test("um protocolo inexistente mostra o aviso (US19)", () => runFlow(driver, "producao-consulta", async () => {
    await open(driver, "/acompanhar-servico", "o acompanhamento de serviço");
    await clickByText(driver, "button", "PROTOCOLO");
    await typeInto(driver, By.css("form input[type='text']"), UNKNOWN_TRACKING_CODE, "um protocolo que não existe");
    await clickByText(driver, "button", "Buscar ordens de serviço");
    await waitForText(driver, "Nenhuma ordem de serviço encontrada para este protocolo.");
  }));

  test("o gestor entra e abre as telas da área interna, sem salvar nada (US09)", () => runFlow(driver, "producao-area-interna", async () => {
    await login(driver, MANAGER_CREDENTIALS);
    for (const screen of INTERNAL_SCREENS) {
      await openFromMenu(driver, screen);
    }
  }));
});

describe("Produção no celular", () => {
  let driver;

  before(async () => {
    driver = await buildMobileDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  test("o site público cabe na tela do celular", () => runFlow(driver, "producao-celular", async () => {
    for (const [routePath, description] of PUBLIC_PAGES) {
      await open(driver, routePath, description);
      // On a phone some pages hide the side panel with the h1 and keep an h2.
      await waitForElement(driver, By.css("h1, h2"), null, `o título de ${description}`);
      await step(driver, `confere ${description} sem rolagem lateral`);
      assert.equal(await hasHorizontalScroll(driver), false, `${description} tem rolagem lateral`);
    }
  }));
});
