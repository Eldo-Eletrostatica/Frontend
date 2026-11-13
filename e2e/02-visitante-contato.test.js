// Visitante: contato de pessoa física (US06) e orçamento de pessoa jurídica
// (US07). Os envios são de verdade e aparecem na área interna com o prefixo
// "E2E". O CAPTCHA é substituído pelo token da suíte (E2E_CAPTCHA_TOKEN).

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { By } = require("selenium-webdriver");

const {
  buildDriver,
  click,
  clickByText,
  enableCaptchaToken,
  fieldXPath,
  open,
  pageContains,
  runFlow,
  scrollIntoView,
  setDateInput,
  step,
  typeInto,
  typeIntoField,
  waitForElement,
  waitForText,
} = require("./support/browser");
const { ensureCatalog, ensureSuiteAccounts, generateCnpj, isoDateFromToday, runLabel } = require("./support/api");

const ESTIMATOR_TOGGLE = "Prefere preencher item a item?";
const DUE_DATE_DAYS = 30;

// The smallest file the Backend accepts as a PDF: it checks the signature.
function writeSamplePdf() {
  const filePath = path.join(os.tmpdir(), "projeto-e2e.pdf");
  writeFileSync(filePath, "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");
  return filePath;
}

// The PJ page has two forms (PDF and simulator) with the same company fields,
// so each one is filled inside its own form.
async function fillCompany(driver, form, label) {
  await typeIntoField(driver, "EMPRESA", `${label} Indústria Ltda`, form);
  await typeIntoField(driver, "CNPJ", generateCnpj(), form);
  await typeIntoField(driver, "RESPONSÁVEL PELO CONTATO", "Maria Teste", form);
  await typeIntoField(driver, "TELEFONE (WHATSAPP)", "61992702881", form);
  await typeIntoField(driver, "E-MAIL COMERCIAL", "compras.e2e@empresa.test", form);
}

// The catalog options change with what the Eldo offers, so the test takes the
// first one available.
async function chooseFirstOption(driver, form, labelText) {
  const select = await waitForElement(driver, By.xpath(`.${fieldXPath(labelText, "select")}`), form, labelText);
  await driver.wait(async () => (await select.findElements(By.css("option"))).length > 1, 60000, `${labelText} sem opções`);
  const option = (await select.findElements(By.css("option")))[1];
  await scrollIntoView(driver, select);
  await step(driver, `escolhe "${await option.getText()}" em ${labelText}`);
  await option.click();
}

describe("Visitante: contato e orçamento", () => {
  let driver;
  const label = runLabel();

  before(async () => {
    // The simulator lists the catalog, which an empty database lacks.
    await ensureCatalog(await ensureSuiteAccounts());
    driver = await buildDriver();
    await enableCaptchaToken(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  test("o visitante pessoa física envia o formulário de contato (US06)", () => runFlow(driver, "contato-pf", async () => {
    await open(driver, "/", "a página inicial");
    const contact = await waitForElement(driver, By.css("#contato"), null, "a seção de contato");
    await scrollIntoView(driver, contact);
    await step(driver, "rola até o contato");

    await clickByText(driver, "button", "Enviar mensagem");
    await waitForText(driver, "Informe seu nome.");

    // The name accepts only letters, so the suite marks it with a word.
    await typeInto(driver, By.css("#contact-name"), "João Visitante Teste", "o nome");
    await typeInto(driver, By.css("#contact-phone"), "61992702881", "o telefone");
    await typeInto(driver, By.css("#contact-email"), "joao.e2e@email.test", "o e-mail");
    await typeInto(driver, By.css("#contact-message"), `${label}: quero pintar um portão de 3 m em preto fosco.`, "a mensagem");
    await click(driver, By.css('#contato input[type="checkbox"]'), "a autorização de contato");
    await clickByText(driver, "button", "Enviar mensagem");
    await waitForText(driver, "Mensagem enviada.");
  }));

  test("o visitante pessoa jurídica pede o orçamento pelo simulador (US07)", () => runFlow(driver, "orcamento-simulador", async () => {
    await open(driver, "/solicitar-orcamento", "a página de orçamento");
    await waitForText(driver, "Orçamento para");
    if (!(await pageContains(driver, ESTIMATOR_TOGGLE))) {
      console.log("  - o simulador está desativado: só o envio de PDF está disponível");
      return;
    }

    await clickByText(driver, "button", ESTIMATOR_TOGGLE);
    const piecesForm = await waitForElement(driver, By.xpath("//form[.//*[contains(., 'PEÇAS DO PROJETO')]]"), null, "o simulador");
    await chooseFirstOption(driver, piecesForm, "TIPO DE PINTURA");
    await chooseFirstOption(driver, piecesForm, "MATERIAL DA PEÇA");
    await typeIntoField(driver, "DESCRIÇÃO DA PEÇA", "Grade de proteção", piecesForm);
    await typeIntoField(driver, "ÁREA (m²/peça)", "4,5", piecesForm);
    await typeIntoField(driver, "QUANTIDADE", "10", piecesForm);
    await clickByText(driver, "button", "Calcular estimativa", piecesForm);

    const priceRange = await waitForElement(driver, By.css('[data-testid="price-range"]'), null, "a faixa estimada");
    assert.match(await priceRange.getText(), /^Entre R\$/);

    const quoteForm = await waitForElement(driver, By.xpath("//form[.//button[contains(., 'Solicitar orçamento formal')]]"), null, "o pedido formal");
    await setDateInput(driver, await quoteForm.findElement(By.css('input[type="date"]')), isoDateFromToday(DUE_DATE_DAYS));
    await typeIntoField(driver, "COR DESEJADA", "RAL 9005 preto fosco", quoteForm);
    await fillCompany(driver, quoteForm, label);
    await clickByText(driver, "button", "Solicitar orçamento formal", quoteForm);
    await waitForText(driver, "Recebemos seu pedido de orçamento");
  }));

  test("o visitante pessoa jurídica envia o projeto em PDF (US07)", () => runFlow(driver, "orcamento-pdf", async () => {
    await open(driver, "/solicitar-orcamento", "a página de orçamento");
    const pdfForm = await waitForElement(driver, By.xpath("//form[.//button[contains(., 'Enviar projeto')]]"), null, "o envio de PDF");

    await click(driver, By.xpath(".//button[contains(., 'Enviar projeto')]"), "enviar sem arquivo", pdfForm);
    await waitForText(driver, "Selecione o arquivo PDF do projeto.");

    const fileInput = await pdfForm.findElement(By.css('input[type="file"]'));
    await step(driver, "anexa o PDF do projeto");
    await fileInput.sendKeys(writeSamplePdf());
    await waitForText(driver, "projeto-e2e.pdf");
    await setDateInput(driver, await pdfForm.findElement(By.css('input[type="date"]')), isoDateFromToday(DUE_DATE_DAYS));
    await typeIntoField(driver, "OBSERVAÇÕES", "Lote de 20 peças, ver medidas no PDF.", pdfForm);
    await fillCompany(driver, pdfForm, label);
    await click(driver, By.xpath(".//button[contains(., 'Enviar projeto')]"), "\"Enviar projeto\"", pdfForm);
    await waitForText(driver, "PROJETO RECEBIDO");
  }));
});
