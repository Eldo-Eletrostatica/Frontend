// Gestor: dashboard de estatísticas (US11), exportação do período (US12) e
// relatórios de comissão e ranking de vendas (US24). Os arquivos exportados
// vão para e2e/downloads.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  EMPLOYEE_CREDENTIALS,
  MANAGER_CREDENTIALS,
  buildDriver,
  clearDownloads,
  click,
  clickByText,
  login,
  openFromMenu,
  runFlow,
  step,
  waitForDownload,
  waitForElement,
  waitForText,
} = require("./support/browser");
const {
  completeServiceOrders,
  ensureSuiteAccounts,
  findEmployeeId,
  generateCnpj,
  isoDateFromToday,
  launchDirectSale,
  runLabel,
} = require("./support/api");

describe("Gestor", () => {
  let driver;
  let adminToken;
  let orderId;

  // The dashboard and the period export need one order with a paint type in
  // the current month, which a freshly restored database may lack.
  before(async () => {
    adminToken = await ensureSuiteAccounts();
    const sale = await launchDirectSale(adminToken, {
      sellerEmployeeId: await findEmployeeId(adminToken, EMPLOYEE_CREDENTIALS.email),
      customer: {
        type: "business",
        name: `${runLabel()} Metalúrgica Gestor`,
        document: generateCnpj(),
        email: "gestor.e2e@empresa.test",
        phone: "61992702881",
      },
      finalPrice: 1800,
      dueDate: isoDateFromToday(20),
      scope: "Pintura de 4 portões em cinza grafite",
    });
    orderId = sale.orderId;
    driver = await buildDriver();
  });

  // The OS stays completed, so it never shows up as late.
  after(async () => {
    if (driver) await driver.quit();
    if (orderId) await completeServiceOrders(adminToken, [orderId]);
  });

  test("o gestor vê o dashboard e troca o período (US11)", () => runFlow(driver, "gestor-dashboard", async () => {
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Dashboard");
    for (const indicator of ["ORÇAMENTOS NO PERÍODO", "VIRARAM VENDA", "TAXA DE CONVERSÃO"]) {
      await waitForText(driver, indicator);
    }

    const lastSixMonths = By.xpath("//button[@aria-pressed][contains(., 'ÚLTIMOS 6 MESES')]");
    await click(driver, lastSixMonths, "o período dos últimos 6 meses");
    await driver.wait(
      async () => (await (await driver.findElement(lastSixMonths)).getAttribute("aria-pressed")) === "true",
      60000,
      "O período não foi selecionado",
    );
    await waitForText(driver, "TAXA DE CONVERSÃO");
  }));

  test("o gestor exporta o período em PDF e em planilha (US12)", () => runFlow(driver, "gestor-exportacao", async () => {
    clearDownloads();
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Dashboard");
    await waitForText(driver, "EXPORTAR O PERÍODO");

    await clickByText(driver, "button", "PDF");
    assert.ok(await waitForDownload(driver, ".pdf"));
    await step(driver, "o PDF foi baixado");
    await clickByText(driver, "button", "PLANILHA");
    assert.ok(await waitForDownload(driver, ".xlsx"));
    await step(driver, "a planilha foi baixada");
  }));

  test("o gestor vê o relatório de comissões e o ranking e exporta (US24)", () => runFlow(driver, "gestor-relatorios", async () => {
    clearDownloads();
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Relatórios");
    await waitForText(driver, "RELATÓRIO DE COMISSÕES");
    await waitForText(driver, "COMISSÃO TOTAL");
    await waitForText(driver, "RANKING DE VENDAS");

    await clickByText(driver, "button", "VOLUME");
    await waitForElement(driver, By.xpath("//button[contains(., 'EXPORTAR PLANILHA')]"), null, "a exportação");
    await clickByText(driver, "button", "EXPORTAR PLANILHA");
    const fileName = await waitForDownload(driver, ".csv");
    await step(driver, `o relatório foi baixado: ${fileName}`);
  }));
});
