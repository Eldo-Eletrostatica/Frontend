// End-to-end suite of the internal area, run with Selenium against a real
// Backend and a real Frontend:
//
//   npm run test:e2e
//
// The screens covered here are the ones that talk to the API: comissões,
// relatórios, tabela de orçamento, editor do site e vitrine.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By, until } = require("selenium-webdriver");

const {
  ADMIN_CREDENTIALS,
  MANAGER_CREDENTIALS,
  buildDriver,
  clickByText,
  login,
  openScreen,
  selectOptions,
  waitForText,
} = require("./support/browser");

describe("área interna", () => {
  let driver;

  before(async () => {
    driver = await buildDriver();
    // Opens the login page once, so the first test does not pay for the
    // compilation of the screen.
    await driver.get(`${process.env.E2E_BASE_URL ?? "http://localhost:3001"}/area-interna/login`);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  test("o administrador entra e vê o dashboard", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await waitForText(driver, "Dashboard");
    await waitForText(driver, "EXPORTAR O PERÍODO");
  });

  test("a tela de comissões mostra o total do período (US23)", async () => {
    await login(driver, MANAGER_CREDENTIALS);
    await openScreen(driver, "/area-interna/comissoes");
    await waitForText(driver, "COMISSÃO ACUMULADA");
    await waitForText(driver, "VENDAS NO PERÍODO");
  });

  test("o administrador configura a regra de comissão (US22)", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await openScreen(driver, "/area-interna/comissoes");
    await clickByText(driver, "button", "Regras de comissão");
    await waitForText(driver, "REGRA ATUAL");
  });

  test("os relatórios mostram o relatório de comissões e o ranking (US24)", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await openScreen(driver, "/area-interna/relatorios");
    await waitForText(driver, "RELATÓRIO DE COMISSÕES");
    await waitForText(driver, "RANKING DE VENDAS");
  });

  test("a tabela de orçamento mostra o catálogo e o simulador (US08)", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await openScreen(driver, "/area-interna/tabela-de-orcamento");
    await waitForText(driver, "TIPOS DE PINTURA — PREÇO POR M²");
    await waitForText(driver, "MATERIAIS DA PEÇA — FATOR");
    await waitForText(driver, "MARGEM DE NEGOCIAÇÃO (%)");
  });

  test("o editor do site salva o rascunho e o descarta (US25, US26)", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await openScreen(driver, "/area-interna/editor-do-site");
    await waitForText(driver, "Editor do Site");

    await clickByText(driver, "button", "Logotipo");
    const logoField = await driver.wait(
      until.elementLocated(By.xpath("//label[contains(., 'TEXTO DO LOGOTIPO')]/input")),
      30000,
      "O campo do logotipo não apareceu",
    );
    await logoField.clear();
    await logoField.sendKeys("ELDO E2E");
    await clickByText(driver, "button", "Salvar rascunho");
    await waitForText(driver, "Rascunho salvo");

    await clickByText(driver, "button", "Descartar rascunho");
    await waitForText(driver, "Rascunho descartado");
  });

  test("o catálogo do seletor de comissões vem do Backend", async () => {
    await login(driver, MANAGER_CREDENTIALS);
    await openScreen(driver, "/area-interna/comissoes");
    await waitForText(driver, "COMISSÃO ACUMULADA");

    const sellerSelect = await driver.findElement(
      By.xpath("//label[contains(., 'FUNCIONÁRIO')]//select"),
    );
    const sellers = await selectOptions(driver, sellerSelect);
    assert.ok(sellers.length > 1, "A lista de vendedores deveria vir do Backend");
  });
});
