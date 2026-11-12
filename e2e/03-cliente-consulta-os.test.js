// Cliente: consulta da OS pelo protocolo e pelo CNPJ (US19). Antes dos testes,
// uma venda direta pela API cria a OS que o cliente consulta.

const { after, before, describe, test } = require("node:test");
const { By } = require("selenium-webdriver");

const {
  EMPLOYEE_CREDENTIALS,
  buildDriver,
  click,
  clickByText,
  open,
  runFlow,
  typeInto,
  waitForPath,
  waitForText,
} = require("./support/browser");
const {
  ensureSuiteAccounts,
  findEmployeeId,
  generateCnpj,
  isoDateFromToday,
  launchDirectSale,
  runLabel,
} = require("./support/api");

const SEARCH_INPUT = By.css("form input[type='text']");
// Valid protocol characters (no 0, O, 1 or I) that no sale will ever get.
const UNKNOWN_TRACKING_CODE = "ZZZZZZZZ";

describe("Cliente: consulta da OS", () => {
  let driver;
  const cnpj = generateCnpj();
  let trackingCode;

  before(async () => {
    const adminToken = await ensureSuiteAccounts();
    const sale = await launchDirectSale(adminToken, {
      sellerEmployeeId: await findEmployeeId(adminToken, EMPLOYEE_CREDENTIALS.email),
      customer: {
        type: "business",
        name: `${runLabel()} Metalúrgica Cliente`,
        document: cnpj,
        email: "cliente.e2e@empresa.test",
        phone: "61992702881",
      },
      finalPrice: 1500,
      dueDate: isoDateFromToday(20),
      scope: "Pintura de 4 grades em preto fosco",
    });
    trackingCode = sale.trackingCode;
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  test("o cliente consulta a OS pelo protocolo (US19)", () => runFlow(driver, "consulta-protocolo", async () => {
    await open(driver, "/", "a página inicial");
    await clickByText(driver, "header//a", "Acompanhar serviço");
    await waitForPath(driver, "/acompanhar-servico");
    await clickByText(driver, "button", "PROTOCOLO");
    await typeInto(driver, SEARCH_INPUT, trackingCode, "o protocolo");
    await clickByText(driver, "button", "Buscar ordens de serviço");
    await waitForText(driver, "Acompanhamento do serviço");
    await waitForText(driver, `Consulta pelo protocolo ${trackingCode}.`);
    await waitForText(driver, "Em fila");
  }));

  test("o cliente consulta as OS em andamento pelo CNPJ (US19)", () => runFlow(driver, "consulta-cnpj", async () => {
    await open(driver, "/acompanhar-servico", "o acompanhamento de serviço");
    await clickByText(driver, "button", "CNPJ DA EMPRESA");
    await typeInto(driver, SEARCH_INPUT, cnpj, "o CNPJ");
    await clickByText(driver, "button", "Buscar ordens de serviço");
    await waitForText(driver, "1 ordem de serviço em andamento para o CNPJ");
    // The CNPJ search does not show the protocol, only the status of each OS.
    await waitForText(driver, "Em fila");
    await click(driver, By.xpath("//button[contains(., 'NOVA CONSULTA')]"), "\"Nova consulta\"");
    await waitForText(driver, "Consultar OS");
  }));

  test("um protocolo inexistente mostra o aviso (US19)", () => runFlow(driver, "consulta-inexistente", async () => {
    await open(driver, "/acompanhar-servico", "o acompanhamento de serviço");
    await clickByText(driver, "button", "PROTOCOLO");
    await typeInto(driver, SEARCH_INPUT, UNKNOWN_TRACKING_CODE, "um protocolo que não existe");
    await clickByText(driver, "button", "Buscar ordens de serviço");
    await waitForText(driver, "Nenhuma ordem de serviço encontrada para este protocolo.");
  }));
});
