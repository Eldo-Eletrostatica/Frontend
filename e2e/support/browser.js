// Helpers of the end-to-end suite: browser, steps with a pause, login and
// explicit waits. The suite opens Chrome on the machine that runs it and visits
// the site at E2E_BASE_URL, so the same tests run against localhost and
// against the staging environment. The variables are listed in the README.
//
//   npm run test:e2e

const { mkdirSync, readdirSync, rmSync } = require("node:fs");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
// The site the clients use, where only the read-only flow runs. A custom
// domain, once it exists, joins this list.
const PRODUCTION_HOSTNAMES = ["eldo-site.onrender.com"];
const IS_PRODUCTION = PRODUCTION_HOSTNAMES.includes(new URL(BASE_URL).hostname);
const ADMIN_CREDENTIALS = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@eldo.com.br",
  password: process.env.E2E_ADMIN_PASSWORD ?? "Admin@123",
};
// The suite creates these accounts when they do not exist (see api.js).
const MANAGER_CREDENTIALS = {
  email: process.env.E2E_MANAGER_EMAIL ?? "e2e.gestor@eldo.test",
  password: process.env.E2E_MANAGER_PASSWORD ?? "E2eGestor@2026",
};
const EMPLOYEE_CREDENTIALS = {
  email: process.env.E2E_EMPLOYEE_EMAIL ?? "e2e.funcionario@eldo.test",
  password: process.env.E2E_EMPLOYEE_PASSWORD ?? "E2eFuncionario@2026",
};
// The Backend's E2E_CAPTCHA_TOKEN; the default is the development value of
// docker-compose.yml and .env.example in the Backend.
const CAPTCHA_TOKEN = process.env.E2E_CAPTCHA_TOKEN ?? "eldo-dev-e2e-captcha-token-local";
const CAPTCHA_TOKEN_STORAGE_KEY = "eldo-e2e-captcha-token";

// The pause between steps lets whoever watches follow the test. 0 runs fast.
const STEP_DELAY_MS = Number(process.env.E2E_STEP_DELAY_MS ?? 1000);
// The browser opens on screen unless E2E_HEADLESS=true.
const IS_HEADLESS = process.env.E2E_HEADLESS === "true";
// A cold server or the first compilation of a screen in development is slow.
const DEFAULT_TIMEOUT = 60000;
const DESKTOP_WINDOW = { width: 1440, height: 1000 };
const SCREENSHOTS_DIRECTORY = path.join(__dirname, "..", "screenshots");
// The exports go here, not to the Downloads folder of whoever runs the suite.
const DOWNLOADS_DIRECTORY = path.join(__dirname, "..", "downloads");

// Opens Chrome. Selenium Manager downloads the ChromeDriver that matches the
// installed Chrome, so no driver is configured here.
async function buildDriver(window = DESKTOP_WINDOW) {
  const options = new chrome.Options();
  if (IS_HEADLESS) options.addArguments("--headless=new");
  options.addArguments(`--window-size=${window.width},${window.height}`, "--lang=pt-BR");
  mkdirSync(DOWNLOADS_DIRECTORY, { recursive: true });
  options.setUserPreferences({
    "download.default_directory": DOWNLOADS_DIRECTORY,
    "download.prompt_for_download": false,
  });
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

// Chrome with the screen of a phone (390 px wide), for the mobile flows.
async function buildMobileDriver() {
  const options = new chrome.Options();
  if (IS_HEADLESS) options.addArguments("--headless=new");
  options.addArguments("--window-size=480,960", "--lang=pt-BR");
  options.setMobileEmulation({ deviceName: "iPhone 12 Pro" });
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

// Logs the step and waits, so the video shows one action at a time.
async function step(driver, description) {
  console.log(`  - ${description}`);
  if (STEP_DELAY_MS > 0) await driver.sleep(STEP_DELAY_MS);
}

// Runs a flow and, when it fails, saves a screenshot named after it.
async function runFlow(driver, name, flow) {
  try {
    await flow();
  } catch (error) {
    await saveScreenshot(driver, name);
    throw error;
  }
}

async function saveScreenshot(driver, name) {
  try {
    mkdirSync(SCREENSHOTS_DIRECTORY, { recursive: true });
    const fileName = `${name.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")}.png`;
    await writeFile(path.join(SCREENSHOTS_DIRECTORY, fileName), await driver.takeScreenshot(), "base64");
  } catch {
    // A browser that already closed has nothing to show; the error that
    // matters is the one of the flow.
  }
}

// XPath literal that also works when the text has quotes.
function xpathLiteral(text) {
  if (!text.includes("'")) return `'${text}'`;
  if (!text.includes('"')) return `"${text}"`;
  return `concat('${text.replace(/'/g, `', "'", '`)}')`;
}

// XPath of an element whose visible text contains the phrase.
function textXPath(tagName, text) {
  return `//${tagName}[contains(normalize-space(.), ${xpathLiteral(text)})]`;
}

// XPath of the input (or other field) inside the label with the given text.
function fieldXPath(labelText, fieldTag = "input") {
  return `//label[contains(normalize-space(.), ${xpathLiteral(labelText)})]//${fieldTag}`;
}

async function pageContains(driver, text) {
  return driver.executeScript("return document.body.innerText.includes(arguments[0]);", text);
}

async function waitForText(driver, text, timeout = DEFAULT_TIMEOUT) {
  await driver.wait(() => pageContains(driver, text), timeout, `O texto "${text}" não apareceu`);
}

async function waitForTextToDisappear(driver, text, timeout = DEFAULT_TIMEOUT) {
  await driver.wait(async () => !(await pageContains(driver, text)), timeout, `O texto "${text}" não sumiu`);
}

// Waits until the address is the given path, after a click on a link.
async function waitForPath(driver, routePath) {
  await driver.wait(
    async () => new URL(await driver.getCurrentUrl()).pathname === routePath,
    DEFAULT_TIMEOUT,
    `A página ${routePath} não abriu`,
  );
}

// Visible text of the first element that matches the CSS selector, read in the
// page itself, so a re-render between finding and reading does not break it.
async function readText(driver, cssSelector) {
  return driver.wait(
    () => driver.executeScript("return document.querySelector(arguments[0])?.innerText.trim() || null;", cssSelector),
    DEFAULT_TIMEOUT,
    `O elemento ${cssSelector} não apareceu`,
  );
}

// Waits for a visible and enabled element. Without a scope it searches the
// whole page; with one, only inside it.
async function waitForElement(driver, locator, scope = null, description = String(locator)) {
  return driver.wait(async () => {
    const candidates = await (scope ?? driver).findElements(locator);
    for (const candidate of candidates) {
      if ((await candidate.isDisplayed()) && (await candidate.isEnabled())) return candidate;
    }
    return null;
  }, DEFAULT_TIMEOUT, `O elemento ${description} não apareceu`);
}

// Scrolls to the element so the video shows it before the click.
async function scrollIntoView(driver, element) {
  await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", element);
}

// A slow server re-renders a form while the test uses it, or an overlay is
// still fading out: these errors pass on their own after a moment.
const TRANSIENT_ERRORS = new Set([
  "StaleElementReferenceError",
  "ElementClickInterceptedError",
  "ElementNotInteractableError",
]);
const RETRY_TIMEOUT_MS = 10000;
const RETRY_INTERVAL_MS = 250;

async function retryWhileChanging(driver, action) {
  const deadline = Date.now() + RETRY_TIMEOUT_MS;
  for (;;) {
    try {
      return await action();
    } catch (error) {
      if (!TRANSIENT_ERRORS.has(error.name) || Date.now() > deadline) throw error;
      await driver.sleep(RETRY_INTERVAL_MS);
    }
  }
}

async function click(driver, locator, description, scope = null) {
  await step(driver, `clica em ${description}`);
  return retryWhileChanging(driver, async () => {
    const element = await waitForElement(driver, locator, scope, description);
    await scrollIntoView(driver, element);
    await element.click();
    return element;
  });
}

async function clickByText(driver, tagName, text, scope = null) {
  const locator = By.xpath(scope ? `.${textXPath(tagName, text)}` : textXPath(tagName, text));
  return click(driver, locator, `"${text}"`, scope);
}

async function clickByTestId(driver, testId, scope = null) {
  return click(driver, By.css(`[data-testid="${testId}"]`), testId, scope);
}

// Clears the field and types the text, the way a person would.
async function typeInto(driver, locator, text, description, scope = null) {
  await step(driver, `preenche ${description}`);
  return retryWhileChanging(driver, async () => {
    const element = await waitForElement(driver, locator, scope, description);
    await scrollIntoView(driver, element);
    await element.click();
    await element.sendKeys(Key.chord(process.platform === "darwin" ? Key.COMMAND : Key.CONTROL, "a"), Key.BACK_SPACE);
    await element.sendKeys(text);
    return element;
  });
}

async function typeIntoField(driver, labelText, text, scope = null, fieldTag = "input") {
  const xpath = fieldXPath(labelText, fieldTag);
  return typeInto(driver, By.xpath(scope ? `.${xpath}` : xpath), text, labelText, scope);
}

// Chooses an option of a select by its visible text.
async function selectOption(driver, selectLocator, optionText, description, scope = null) {
  const select = await waitForElement(driver, selectLocator, scope, description);
  await scrollIntoView(driver, select);
  await step(driver, `escolhe "${optionText}" em ${description}`);
  // The options may come from the API after the select appears.
  const option = await driver.wait(async () => {
    const options = await select.findElements(By.xpath(`.//option[normalize-space(.)=${xpathLiteral(optionText)}]`));
    return options[0] ?? null;
  }, DEFAULT_TIMEOUT, `A opção "${optionText}" não apareceu em ${description}`);
  await option.click();
  return select;
}

// Date inputs follow the browser's locale when typed, so the value is set the
// way React expects: through the native setter, then the input event.
async function setDateInput(driver, element, isoDate) {
  await scrollIntoView(driver, element);
  await step(driver, `informa a data ${isoDate}`);
  await driver.executeScript(
    `const input = arguments[0];
     const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
     setter.call(input, arguments[1]);
     input.dispatchEvent(new Event("input", { bubbles: true }));
     input.dispatchEvent(new Event("change", { bubbles: true }));`,
    element,
    isoDate,
  );
}

async function selectOptions(driver, selectElement) {
  const options = await selectElement.findElements(By.css("option"));
  const texts = [];
  for (const option of options) texts.push(await option.getText());
  return texts;
}

async function open(driver, routePath, description = routePath) {
  await step(driver, `abre ${description}`);
  await driver.get(`${BASE_URL}${routePath}`);
}

// Signs in through the login screen and waits for the internal area.
async function login(driver, credentials) {
  // A session already open sends the login screen away, so every flow starts
  // signed out.
  await driver.get(`${BASE_URL}/area-interna/login`);
  await driver.manage().deleteAllCookies();
  await open(driver, "/area-interna/login", "a tela de login");
  await typeInto(driver, By.css('input[type="email"]'), credentials.email, "o e-mail");
  await typeInto(driver, By.css('input[type="password"]'), credentials.password, "a senha");
  await clickByText(driver, "button", "Entrar");
  // The login screen also lives under /area-interna, so the wait looks for the
  // screen the employee was sent to.
  await driver.wait(
    async () => !(await driver.getCurrentUrl()).includes("/login"),
    DEFAULT_TIMEOUT,
    "O login não entrou na área interna",
  );
}

// Opens a screen of the internal area through the side menu and waits for the
// address to change, so the title found is the one of the new screen.
async function openFromMenu(driver, label) {
  const locator = By.xpath(textXPath("nav//a", label));
  const link = await waitForElement(driver, locator, null, `"${label}" no menu`);
  const targetPath = new URL(await link.getAttribute("href"), BASE_URL).pathname;
  await click(driver, locator, `"${label}" no menu`);
  await waitForPath(driver, targetPath);
  await waitForElement(driver, By.css("main h1"), null, `o título da tela ${label}`);
}

// Accepts the browser confirmation (window.confirm) that a removal opens.
async function acceptConfirmation(driver) {
  await driver.wait(until.alertIsPresent(), DEFAULT_TIMEOUT, "A confirmação não apareceu");
  await step(driver, "confirma");
  await driver.switchTo().alert().accept();
}

// Turns on the CAPTCHA replacement of the suite for this site (see the
// CaptchaField component): localStorage is per site, so the page opens first.
async function enableCaptchaToken(driver) {
  await driver.get(`${BASE_URL}/`);
  await driver.executeScript(
    "window.localStorage.setItem(arguments[0], arguments[1]);",
    CAPTCHA_TOKEN_STORAGE_KEY,
    CAPTCHA_TOKEN,
  );
}

// Empties the downloads folder, so a test only sees the files it exported.
function clearDownloads() {
  rmSync(DOWNLOADS_DIRECTORY, { recursive: true, force: true });
  mkdirSync(DOWNLOADS_DIRECTORY, { recursive: true });
}

// Waits for a finished download with the extension (Chrome writes
// .crdownload while it is still saving) and returns its name.
async function waitForDownload(driver, extension) {
  return driver.wait(() => {
    const files = readdirSync(DOWNLOADS_DIRECTORY);
    return files.find((file) => file.endsWith(extension)) ?? null;
  }, DEFAULT_TIMEOUT, `Nenhum arquivo ${extension} foi baixado`);
}

// True when the page is wider than the window, which a phone shows as a
// horizontal scroll.
async function hasHorizontalScroll(driver) {
  return driver.executeScript(
    "return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;",
  );
}

module.exports = {
  ADMIN_CREDENTIALS,
  CAPTCHA_TOKEN,
  acceptConfirmation,
  BASE_URL,
  DEFAULT_TIMEOUT,
  EMPLOYEE_CREDENTIALS,
  IS_PRODUCTION,
  MANAGER_CREDENTIALS,
  buildDriver,
  buildMobileDriver,
  clearDownloads,
  click,
  clickByTestId,
  clickByText,
  enableCaptchaToken,
  fieldXPath,
  hasHorizontalScroll,
  login,
  open,
  openFromMenu,
  pageContains,
  readText,
  runFlow,
  scrollIntoView,
  selectOption,
  selectOptions,
  setDateInput,
  step,
  textXPath,
  typeInto,
  typeIntoField,
  waitForDownload,
  waitForElement,
  waitForPath,
  waitForText,
  waitForTextToDisappear,
};
