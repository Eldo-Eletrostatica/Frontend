// Helpers of the end-to-end suite: browser, login and waits.
//
// The suite runs against a real Backend and a real Frontend, so the
// credentials and the address come from the environment:
//
//   E2E_BASE_URL          address of the Frontend (default http://localhost:3001)
//   E2E_ADMIN_EMAIL       e-mail of the administrator
//   E2E_ADMIN_PASSWORD    password of the administrator
//   E2E_MANAGER_EMAIL     e-mail of the manager
//   E2E_MANAGER_PASSWORD  password of the manager
//   E2E_HEADLESS          "false" opens the browser with the screen visible
//
//   npm run test:e2e

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001";
const ADMIN_CREDENTIALS = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@eldo.com.br",
  password: process.env.E2E_ADMIN_PASSWORD ?? "Admin@123",
};
const MANAGER_CREDENTIALS = {
  email: process.env.E2E_MANAGER_EMAIL ?? "gestor.demo@eldo.com.br",
  password: process.env.E2E_MANAGER_PASSWORD ?? "Gestor@2026",
};

// The first visit to a screen makes the development server compile it, so the
// wait is generous.
const DEFAULT_TIMEOUT = 60000;

// Opens a browser for the suite.
async function buildDriver() {
  const options = new chrome.Options();
  if ((process.env.E2E_HEADLESS ?? "true") !== "false") {
    options.addArguments("--headless=new");
  }
  options.addArguments("--window-size=1440,1000", "--no-sandbox");
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

// XPath of an element whose text contains the given phrase.
function textXPath(tagName, text) {
  return `//${tagName}[contains(normalize-space(.), ${JSON.stringify(text)})]`;
}

// True when the visible text of the page contains the phrase.
async function pageContains(driver, text) {
  return driver.executeScript("return document.body.innerText.includes(arguments[0]);", text);
}

// Waits for the first element with the text and clicks it.
async function clickByText(driver, tagName, text) {
  const element = await driver.wait(
    until.elementLocated(By.xpath(textXPath(tagName, text))),
    DEFAULT_TIMEOUT,
    `O elemento "${text}" não apareceu`,
  );
  await element.click();
  return element;
}

// True when the page shows the text somewhere.
async function hasText(driver, text) {
  return pageContains(driver, text);
}

// Waits until the page shows the text.
async function waitForText(driver, text) {
  await driver.wait(
    () => pageContains(driver, text),
    DEFAULT_TIMEOUT,
    `O texto "${text}" não apareceu`,
  );
}

// Signs in with the given credentials and waits for the internal area.
async function login(driver, credentials) {
  // A session already open sends the login screen away, so every test starts
  // signed out.
  await driver.manage().deleteAllCookies();
  await driver.get(`${BASE_URL}/area-interna/login`);
  const emailField = await driver.wait(
    until.elementLocated(By.css('input[type="email"]')),
    DEFAULT_TIMEOUT,
    "A tela de login não carregou",
  );
  await emailField.sendKeys(credentials.email);
  const passwordField = await driver.findElement(By.css('input[type="password"]'));
  await passwordField.sendKeys(credentials.password);
  await clickByText(driver, "button", "Entrar");
  // The login screen also lives under /area-interna, so the wait looks for the
  // screen the employee was sent to.
  await driver.wait(
    async () => !(await driver.getCurrentUrl()).includes("/login"),
    DEFAULT_TIMEOUT,
    "O login não entrou na área interna",
  );
}

// Opens a screen of the internal area.
async function openScreen(driver, path) {
  await driver.get(`${BASE_URL}${path}`);
  await driver.wait(
    until.elementLocated(By.css("h1")),
    DEFAULT_TIMEOUT,
    `A tela ${path} não carregou`,
  );
}

// Options of a select, by their visible text.
async function selectOptions(driver, selectLocator) {
  const options = await selectLocator.findElements(By.css("option"));
  const texts = [];
  for (const option of options) {
    texts.push(await option.getText());
  }
  return texts;
}

module.exports = {
  ADMIN_CREDENTIALS,
  BASE_URL,
  DEFAULT_TIMEOUT,
  MANAGER_CREDENTIALS,
  buildDriver,
  clickByText,
  hasText,
  login,
  openScreen,
  pageContains,
  selectOptions,
  waitForText,
};
