// Serviços: a OS que nasce da venda (US17), a atualização de status (US18) e
// o painel de atrasos (US20). As vendas são criadas pela API; no fim, as OS
// criadas ficam concluídas, para não sobrar serviço aberto ou atrasado.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  EMPLOYEE_CREDENTIALS,
  MANAGER_CREDENTIALS,
  buildDriver,
  click,
  clickByText,
  login,
  openFromMenu,
  runFlow,
  step,
  waitForElement,
  waitForText,
} = require("./support/browser");
const {
  callApi,
  ensureSuiteAccounts,
  findEmployeeId,
  generateCnpj,
  isoDateFromToday,
  launchDirectSale,
  runLabel,
} = require("./support/api");

describe("Serviços", () => {
  let driver;
  let adminToken;
  let sellerEmployeeId;
  const label = runLabel();
  const createdOrderIds = [];

  async function createServiceOrder(customerName, scope, dueInDays) {
    const sale = await launchDirectSale(adminToken, {
      sellerEmployeeId,
      customer: {
        type: "business",
        name: `${label} ${customerName}`,
        document: generateCnpj(),
        email: "servicos.e2e@empresa.test",
        phone: "61992702881",
      },
      finalPrice: 2400,
      dueDate: isoDateFromToday(dueInDays),
      scope,
    });
    createdOrderIds.push(sale.orderId);
    return sale;
  }

  before(async () => {
    adminToken = await ensureSuiteAccounts();
    sellerEmployeeId = await findEmployeeId(adminToken, EMPLOYEE_CREDENTIALS.email);
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
    for (const orderId of createdOrderIds) {
      await callApi(adminToken, "PATCH", `/service-orders/${orderId}/status`, { status: "completed" });
    }
  });

  test("a OS nasce da venda e aparece no kanban e na lista (US17)", () => runFlow(driver, "servicos-cadastro", async () => {
    const sale = await createServiceOrder("Serralheria Kanban", "Pintura de 12 portões basculantes", 15);
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Serviços");

    const card = await waitForElement(driver, By.xpath(`//button[.//span[normalize-space(.)='${sale.trackingCode}']]`), null, "o cartão da OS");
    assert.ok((await card.getText()).includes("Pintura de 12 portões basculantes"));
    await clickByText(driver, "button", "LISTA");
    const row = await waitForElement(driver, By.xpath(`//tr[td[normalize-space(.)='${sale.trackingCode}']]`), null, "a linha da OS");
    const rowText = await row.getText();
    assert.ok(rowText.includes("Serralheria Kanban") && rowText.includes("EM FILA"), rowText);
  }));

  test("o funcionário atualiza o status da OS até concluir (US18)", () => runFlow(driver, "servicos-status", async () => {
    const sale = await createServiceOrder("Metalúrgica Status", "Pintura de estrutura de galpão", 10);
    await login(driver, EMPLOYEE_CREDENTIALS);
    await openFromMenu(driver, "Serviços");
    await click(driver, By.xpath(`//button[.//span[normalize-space(.)='${sale.trackingCode}']]`), `a OS ${sale.trackingCode}`);
    await waitForElement(driver, By.xpath(`//aside//h2[normalize-space(.)='${sale.trackingCode}']`), null, "o detalhe da OS");

    for (const status of ["EM PRODUÇÃO", "FINALIZAÇÃO", "CONCLUÍDO"]) {
      const statusButton = By.xpath(`//aside//button[normalize-space(.)='${status}']`);
      await click(driver, statusButton, `o status ${status}`);
      // The current status is the disabled button.
      await driver.wait(async () => !(await (await driver.findElement(statusButton)).isEnabled()), 60000, `O status não foi para ${status}`);
    }
    await waitForText(driver, "CONCLUÍDO EM");
    await step(driver, "a OS fica concluída, com a data");
  }));

  test("o gestor vê o serviço atrasado no painel de atrasos (US20)", () => runFlow(driver, "servicos-atrasos", async () => {
    const sale = await createServiceOrder("Indústria Atrasada", "Pintura de tanques", -3);
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Serviços");
    await clickByText(driver, "button", "abrir painel de atrasos");
    await waitForText(driver, "priorize estas entregas");
    await waitForText(driver, sale.trackingCode);
    await waitForText(driver, "ATRASADO");
  }));
});
