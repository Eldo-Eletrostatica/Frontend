// Vendas e comissões: venda de um orçamento do site e venda direta (US21),
// regra de comissão (US22) e comissões do funcionário (US23). As vendas
// criam OS, que ficam concluídas no fim.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  ADMIN_CREDENTIALS,
  EMPLOYEE_CREDENTIALS,
  MANAGER_CREDENTIALS,
  buildDriver,
  click,
  clickByText,
  login,
  openFromMenu,
  readText,
  runFlow,
  selectOption,
  setDateInput,
  typeInto,
  waitForElement,
  waitForPath,
  waitForText,
} = require("./support/browser");
const {
  callApi,
  completeServiceOrders,
  ensureCatalog,
  ensureSuiteAccounts,
  findEmployeeId,
  generateCnpj,
  isoDateFromToday,
  launchDirectSale,
  requestPdfQuote,
  runLabel,
  setCommissionRule,
} = require("./support/api");

const SELLER_NAME = "Funcionário E2E";
const SALE_SUCCESS = "Venda registrada. Protocolo do cliente:";

// Field of the sale drawer, whose label is a sibling of the input.
function drawerField(labelText, tag = "input") {
  return By.xpath(`//aside//label[contains(normalize-space(.), '${labelText}')]/following-sibling::${tag}`);
}

describe("Vendas e comissões", () => {
  let driver;
  let adminToken;
  let sellerEmployeeId;
  const label = runLabel();

  // The order of every sale of this file, read from the success message.
  async function rememberSaleFromMessage() {
    const message = await readText(driver, "p[role='status']");
    const trackingCode = message.split(":").pop().trim();
    const { data } = await callApi(adminToken, "GET", "/service-orders");
    const serviceOrder = (data ?? []).find((candidate) => candidate.trackingCode === trackingCode);
    return { trackingCode, orderId: serviceOrder?.orderId };
  }

  const createdOrderIds = [];

  before(async () => {
    adminToken = await ensureSuiteAccounts();
    // The direct sale form lists the catalog, which an empty database lacks.
    await ensureCatalog(adminToken);
    sellerEmployeeId = await findEmployeeId(adminToken, EMPLOYEE_CREDENTIALS.email);
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
    await completeServiceOrders(adminToken, createdOrderIds.filter(Boolean));
  });

  test("o gestor envia o valor do orçamento do site, registra a aprovação e lança a venda (US21)", () => runFlow(driver, "vendas-orcamento", async () => {
    const customerName = `${label} Construtora Aprovação`;
    await requestPdfQuote(customerName, generateCnpj());
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Orçamentos");

    const card = `//li[@data-order-id][.//p[normalize-space(.)='${customerName}']]`;
    await waitForElement(driver, By.xpath(card), null, "o orçamento recebido");
    await typeInto(driver, By.xpath(`${card}//input[@type='number']`), "3200", "o valor final");
    await click(driver, By.xpath(`${card}//button[contains(., 'Enviar valor')]`), "\"Enviar valor\"");
    await click(driver, By.xpath(`${card}//button[contains(., 'Cliente aprovou')]`), "\"Cliente aprovou\"");
    await click(driver, By.xpath(`${card}//a[contains(., 'Lançar venda')]`), "\"Lançar venda\"");

    await waitForPath(driver, "/area-interna/vendas");
    await waitForElement(driver, By.css("aside"), null, "o lançamento da venda");
    const quoteSelect = await waitForElement(driver, drawerField("ORÇAMENTO APROVADO", "select"), null, "o orçamento aprovado");
    assert.ok((await quoteSelect.getText()).includes(customerName), "O orçamento aprovado deveria vir escolhido");
    await selectOption(driver, drawerField("VENDEDOR", "select"), SELLER_NAME, "o vendedor");
    await typeInto(driver, drawerField("ESCOPO TÉCNICO", "textarea"), "Pintura das estruturas do projeto em PDF", "o escopo");
    await setDateInput(driver, await driver.findElement(drawerField("PRAZO DE ENTREGA")), isoDateFromToday(25));
    await clickByText(driver, "aside//button", "Registrar venda e criar OS");
    await waitForText(driver, SALE_SUCCESS);
    createdOrderIds.push((await rememberSaleFromMessage()).orderId);
  }));

  test("o funcionário lança uma venda direta para uma empresa nova (US21)", () => runFlow(driver, "vendas-direta", async () => {
    await login(driver, EMPLOYEE_CREDENTIALS);
    await openFromMenu(driver, "Vendas");
    await clickByText(driver, "button", "Nova venda");
    await waitForElement(driver, By.css("aside"), null, "o lançamento da venda");
    // The form re-renders when the catalog arrives, losing what was typed.
    await driver.wait(
      async () => (await driver.findElements(By.xpath("//aside//*[normalize-space(.)='TIPO DE PINTURA']/following-sibling::select/option"))).length > 0,
      60000,
      "O catálogo não carregou",
    );

    await clickByText(driver, "aside//button", "CLIENTE NOVO");
    await clickByText(driver, "aside//button", "PESSOA JURÍDICA");
    await typeInto(driver, drawerField("NOME / RAZÃO SOCIAL"), `${label} Serralheria Direta`, "a razão social");
    await typeInto(driver, drawerField("CNPJ"), generateCnpj(), "o CNPJ");
    await typeInto(driver, drawerField("E-MAIL"), "direta.e2e@empresa.test", "o e-mail");
    await typeInto(driver, drawerField("TELEFONE"), "61992702881", "o telefone");
    await typeInto(driver, drawerField("ESCOPO TÉCNICO", "textarea"), "Pintura de 6 grades de proteção", "o escopo");
    await setDateInput(driver, await driver.findElement(drawerField("PRAZO DE ENTREGA")), isoDateFromToday(15));
    await typeInto(driver, drawerField("ÁREA (m²)"), "3", "a área");
    await typeInto(driver, drawerField("QUANTIDADE"), "6", "a quantidade");
    await typeInto(driver, drawerField("VALOR FINAL (R$)"), "1800", "o valor final");
    await clickByText(driver, "aside//button", "Registrar venda e criar OS");
    await waitForText(driver, SALE_SUCCESS);
    createdOrderIds.push((await rememberSaleFromMessage()).orderId);
  }));

  test("o administrador configura a regra de comissão do funcionário (US22)", () => runFlow(driver, "comissoes-regra", async () => {
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Comissões");
    await clickByText(driver, "button", "Regras de comissão");

    const row = `//tr[td[normalize-space(.)='${EMPLOYEE_CREDENTIALS.email}']]`;
    await click(driver, By.xpath(`${row}//button[contains(., 'EDITAR')]`), "editar a regra do funcionário");
    await clickByText(driver, "aside//button", "PERCENTUAL");
    await typeInto(driver, drawerField("PERCENTUAL (%)"), "10", "o percentual");
    await clickByText(driver, "aside//button", "Salvar regra");
    await waitForText(driver, "Regra de comissão atualizada.");
    assert.ok((await (await waitForElement(driver, By.xpath(row), null, "a linha do funcionário")).getText()).includes("10%"));
  }));

  test("o funcionário vê a comissão acumulada no período (US23)", () => runFlow(driver, "comissoes-funcionario", async () => {
    await setCommissionRule(adminToken, sellerEmployeeId, "percentage", 10);
    const sale = await launchDirectSale(adminToken, {
      sellerEmployeeId,
      customer: {
        type: "business",
        name: `${label} Comércio Comissão`,
        document: generateCnpj(),
        email: "comissao.e2e@empresa.test",
        phone: "61992702881",
      },
      finalPrice: 1000,
      dueDate: isoDateFromToday(10),
      scope: "Pintura de prateleiras",
    });
    createdOrderIds.push(sale.orderId);

    await login(driver, EMPLOYEE_CREDENTIALS);
    await openFromMenu(driver, "Comissões");
    await waitForText(driver, "COMISSÃO ACUMULADA");
    const row = await waitForElement(driver, By.xpath(`//tr[td[normalize-space(.)='${sale.trackingCode}']]`), null, "a venda na tabela");
    const rowText = await row.getText();
    assert.ok(rowText.includes("R$ 1.000,00") && rowText.includes("R$ 100,00"), rowText);
  }));
});
