// Visitante: vitrine do site (US01, US02, US03, US05). Os testes leem o que a
// Eldo publicou, sem criar nada: o conteúdo vem do editor da área interna.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  buildDriver,
  click,
  clickByText,
  open,
  pageContains,
  readText,
  runFlow,
  scrollIntoView,
  step,
  waitForElement,
  waitForPath,
  waitForText,
} = require("./support/browser");

const EMPTY_PORTFOLIO = "Nenhum projeto publicado ainda";
const EMPTY_EVENTS = "Nenhum evento no momento";
const REVIEW_STATES = [
  "AVALIAÇÕES MAIS RELEVANTES NO GOOGLE",
  "Avaliações indisponíveis no momento",
  "Ainda não há avaliações no Google",
];

describe("Visitante: vitrine", () => {
  let driver;

  before(async () => {
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  async function openPortfolio() {
    await open(driver, "/", "a página inicial");
    const portfolio = await waitForElement(driver, By.css("#portfolio"), null, "a seção do portfólio");
    await scrollIntoView(driver, portfolio);
    await step(driver, "rola até o portfólio");
    await waitForText(driver, "PORTFÓLIO");
    return portfolio;
  }

  test("o visitante vê o portfólio e filtra por categoria (US01)", () => runFlow(driver, "vitrine-portfolio", async () => {
    const portfolio = await openPortfolio();
    if (await pageContains(driver, EMPTY_PORTFOLIO)) {
      console.log("  - nenhum projeto publicado: o site mostra o aviso");
      return;
    }

    const filters = await portfolio.findElements(By.css("button[aria-pressed]"));
    assert.ok(filters.length > 1, "O filtro deveria ter \"Todos\" e ao menos uma categoria");
    const category = await filters[1].getText();
    await click(driver, By.css("button[aria-pressed]:nth-of-type(2)"), `o filtro ${category}`, portfolio);

    const cardCategories = await portfolio.findElements(By.css(".grid > button span"));
    assert.ok(cardCategories.length > 0, "O filtro deveria mostrar ao menos um projeto");
    for (const cardCategory of cardCategories) {
      assert.equal(await cardCategory.getText(), category);
    }
  }));

  test("o visitante abre o detalhe de um projeto (US02)", () => runFlow(driver, "vitrine-detalhe", async () => {
    const portfolio = await openPortfolio();
    if (await pageContains(driver, EMPTY_PORTFOLIO)) {
      console.log("  - nenhum projeto publicado: não há detalhe para abrir");
      return;
    }

    const projectTitle = await readText(driver, "#portfolio .grid > button p");
    await click(driver, By.css(".grid > button"), `o projeto "${projectTitle}"`, portfolio);

    const detail = await waitForElement(driver, By.css('[role="dialog"]'), null, "o detalhe do projeto");
    const detailText = await detail.getText();
    assert.ok(detailText.includes(projectTitle), "O detalhe deveria mostrar o título do projeto");
    assert.ok(detailText.includes("TIPO DE SERVIÇO") && detailText.includes("MATERIAIS"));
    await click(driver, By.css('[role="dialog"] button[aria-label="Fechar"]'), "fechar o detalhe");
  }));

  test("o visitante vê os eventos e abre um registro (US03)", () => runFlow(driver, "vitrine-eventos", async () => {
    await open(driver, "/", "a página inicial");
    await clickByText(driver, "header//a", "Eventos");
    await waitForPath(driver, "/eventos");
    await driver.wait(
      async () => (await pageContains(driver, "VER REGISTRO")) || pageContains(driver, EMPTY_EVENTS),
      60000,
      "A lista de eventos não carregou",
    );
    if (await pageContains(driver, EMPTY_EVENTS)) {
      console.log("  - nenhum evento publicado: o site mostra o aviso");
      return;
    }

    const firstEventTitle = await readText(driver, "h2");
    await clickByText(driver, "button", "VER REGISTRO");
    const detail = await waitForElement(driver, By.css('[role="dialog"]'), null, "o registro do evento");
    assert.ok((await detail.getText()).includes(firstEventTitle), "O registro deveria mostrar o título do evento");
    await click(driver, By.css('[role="dialog"] button[aria-label="Fechar"]'), "fechar o registro");
  }));

  test("o visitante vê as avaliações do Google ou o aviso de indisponível (US05)", () => runFlow(driver, "vitrine-avaliacoes", async () => {
    await open(driver, "/", "a página inicial");
    const reviews = await waitForElement(driver, By.css("#avaliacoes"), null, "a seção de avaliações");
    await scrollIntoView(driver, reviews);
    await step(driver, "rola até as avaliações");
    // The section asks the API only when it comes into view.
    await driver.wait(async () => {
      for (const state of REVIEW_STATES) {
        if (await pageContains(driver, state)) return true;
      }
      return false;
    }, 60000, "A seção de avaliações não terminou de carregar");
  }));
});
