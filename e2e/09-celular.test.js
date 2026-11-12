// Celular: o site e a área interna numa tela de 390 px, sem rolagem lateral e
// com o menu de celular (requisito "web e mobile" da entrega).

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  MANAGER_CREDENTIALS,
  buildMobileDriver,
  click,
  clickByText,
  hasHorizontalScroll,
  login,
  open,
  openFromMenu,
  runFlow,
  step,
  waitForElement,
  waitForPath,
} = require("./support/browser");
const { ensureSuiteAccounts } = require("./support/api");

const PUBLIC_PAGES = [
  ["/", "a página inicial"],
  ["/eventos", "os eventos"],
  ["/solicitar-orcamento", "o orçamento"],
  ["/acompanhar-servico", "o acompanhamento de serviço"],
];
const INTERNAL_SCREENS = ["Serviços", "Estoque", "Orçamentos", "Vendas", "Comissões", "Relatórios"];

describe("Celular", () => {
  let driver;

  before(async () => {
    await ensureSuiteAccounts();
    driver = await buildMobileDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  async function assertNoHorizontalScroll(description) {
    await step(driver, `confere ${description} sem rolagem lateral`);
    assert.equal(await hasHorizontalScroll(driver), false, `${description} tem rolagem lateral`);
  }

  test("o site público cabe na tela do celular e o menu navega", () => runFlow(driver, "celular-site", async () => {
    for (const [routePath, description] of PUBLIC_PAGES) {
      await open(driver, routePath, description);
      // On a phone some pages hide the side panel with the h1 and keep an h2.
      await waitForElement(driver, By.css("h1, h2"), null, `o título de ${description}`);
      await assertNoHorizontalScroll(description);
    }

    await open(driver, "/", "a página inicial");
    await click(driver, By.css('header button[aria-label="Abrir menu"]'), "o menu");
    await clickByText(driver, "a", "Eventos");
    await waitForPath(driver, "/eventos");
  }));

  test("a área interna cabe na tela do celular e o menu navega", () => runFlow(driver, "celular-area-interna", async () => {
    await login(driver, MANAGER_CREDENTIALS);
    for (const screen of INTERNAL_SCREENS) {
      await click(driver, By.css('button[aria-label="Abrir menu"]'), "o menu");
      await openFromMenu(driver, screen);
      await assertNoHorizontalScroll(`a tela ${screen}`);
    }
  }));
});
