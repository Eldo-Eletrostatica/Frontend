// Confere, antes de rodar a suíte, se o Chrome abre pelo Selenium e quais
// versões do navegador e do ChromeDriver foram usadas. O Selenium Manager
// baixa o ChromeDriver compatível; um chromedriver antigo no PATH é a causa
// mais comum de erro de versão.
//
//   npm run e2e:check-driver

const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function main() {
  const options = new chrome.Options().addArguments("--headless=new");
  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  try {
    const capabilities = await driver.getCapabilities();
    const chromeVersion = capabilities.getBrowserVersion();
    const driverVersion = (capabilities.get("chrome") ?? {}).chromedriverVersion ?? "desconhecida";
    console.log(`Chrome ${chromeVersion}`);
    console.log(`ChromeDriver ${driverVersion.split(" ")[0]}`);
    console.log("O Selenium abriu o Chrome: a suíte pode rodar.");
  } finally {
    await driver.quit();
  }
}

main().catch((error) => {
  console.error(`O Selenium não abriu o Chrome: ${error.message}`);
  process.exitCode = 1;
});
