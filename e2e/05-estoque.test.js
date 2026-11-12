// Estoque: categorias e cadastro de itens (US13), entradas e saídas (US14),
// alerta de estoque mínimo (US15) e histórico por período (US16). Cada fluxo
// cria pela API o item de que precisa; tudo é removido no fim.

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { By } = require("selenium-webdriver");

const {
  ADMIN_CREDENTIALS,
  MANAGER_CREDENTIALS,
  buildDriver,
  click,
  clickByText,
  login,
  openFromMenu,
  runFlow,
  selectOption,
  typeInto,
  waitForElement,
  waitForText,
  waitForTextToDisappear,
} = require("./support/browser");
const { callApi, ensureSuiteAccounts, expectOk, findEmployeeId, runLabel } = require("./support/api");

// Field of the inventory drawers, whose label is a sibling of the input.
function drawerField(labelText, tag = "input") {
  return By.xpath(`//aside//label[contains(normalize-space(.), '${labelText}')]/following-sibling::${tag}`);
}

function itemRow(itemName) {
  return `//tr[.//p[normalize-space(.)='${itemName}']]`;
}

describe("Estoque", () => {
  let driver;
  let adminToken;
  let categoryId;
  const label = runLabel();
  const categoryName = `${label} Insumos`;
  const createdItemIds = [];
  const createdCategoryIds = [];

  async function createItem(name, balance, minimumStock) {
    const item = await expectOk(callApi(adminToken, "POST", "/inventory-items", {
      name, categoryId, supplierName: "Fornecedor E2E", unit: "liter", balance, minimumStock,
    }), `Criar o item ${name}`);
    createdItemIds.push(item.inventoryItemId);
    return item;
  }

  before(async () => {
    adminToken = await ensureSuiteAccounts();
    const category = await expectOk(
      callApi(adminToken, "POST", "/inventory-categories", { name: categoryName }),
      "Criar a categoria",
    );
    categoryId = category.inventoryCategoryId;
    createdCategoryIds.push(categoryId);
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
    for (const inventoryItemId of createdItemIds) {
      await callApi(adminToken, "DELETE", `/inventory-items/${inventoryItemId}`);
    }
    for (const inventoryCategoryId of createdCategoryIds) {
      await callApi(adminToken, "DELETE", `/inventory-categories/${inventoryCategoryId}`);
    }
  });

  test("o administrador cria uma categoria e cadastra um item nela (US13)", () => runFlow(driver, "estoque-cadastro", async () => {
    const newCategory = `${label} Tintas`;
    const itemName = `${label} Tinta epóxi preta`;
    await login(driver, ADMIN_CREDENTIALS);
    await openFromMenu(driver, "Estoque");

    await clickByText(driver, "button", "Categorias");
    await typeInto(driver, drawerField("NOVA CATEGORIA"), newCategory, "a nova categoria");
    await clickByText(driver, "button", "Adicionar");
    await waitForText(driver, newCategory);
    await click(driver, By.xpath("//aside//h2/following-sibling::button"), "fechar as categorias");

    await clickByText(driver, "button", "Novo item");
    await clickByText(driver, "aside//button", "Cadastrar item");
    await waitForText(driver, "Escolha a categoria do item.");
    await typeInto(driver, drawerField("NOME DO ITEM"), itemName, "o nome");
    await selectOption(driver, drawerField("CATEGORIA", "select"), newCategory, "a categoria");
    await typeInto(driver, drawerField("FORNECEDOR"), "Tintas Brasil", "o fornecedor");
    await selectOption(driver, drawerField("UNIDADE", "select"), "L", "a unidade");
    await typeInto(driver, drawerField("QUANTIDADE INICIAL"), "20", "a quantidade inicial");
    await typeInto(driver, drawerField("ESTOQUE MÍNIMO"), "5", "o estoque mínimo");
    await clickByText(driver, "aside//button", "Cadastrar item");

    const row = await waitForElement(driver, By.xpath(itemRow(itemName)), null, "o item na lista");
    const rowText = await row.getText();
    assert.ok(rowText.includes(newCategory.toUpperCase()) && rowText.includes("20 L"), rowText);

    // The same name again: the screen warns about a possible duplicate.
    await clickByText(driver, "button", "Novo item");
    await typeInto(driver, drawerField("NOME DO ITEM"), itemName.toLowerCase(), "o mesmo nome");
    await selectOption(driver, drawerField("CATEGORIA", "select"), newCategory, "a categoria");
    await typeInto(driver, drawerField("FORNECEDOR"), "Tintas Brasil", "o fornecedor");
    await clickByText(driver, "aside//button", "Cadastrar item");
    await waitForText(driver, "Já existe um item com o nome");
    await clickByText(driver, "aside//button", "Cancelar");

    const { data: items } = await callApi(adminToken, "GET", "/inventory-items");
    for (const item of items.filter((candidate) => candidate.name === itemName)) {
      createdItemIds.push(item.inventoryItemId);
      createdCategoryIds.push(item.categoryId);
    }
  }));

  test("o funcionário registra entrada e saída e o saldo acompanha (US14)", () => runFlow(driver, "estoque-movimentacao", async () => {
    const item = await createItem(`${label} Solvente`, 10, 2);
    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Estoque");
    const movementButton = By.xpath(`${itemRow(item.name)}//button[contains(., 'Movimentar')]`);

    await click(driver, movementButton, "\"Movimentar\"");
    await clickByText(driver, "aside//button", "Entrada");
    await typeInto(driver, drawerField("QUANTIDADE"), "5", "a quantidade");
    await typeInto(driver, drawerField("MOTIVO"), "Compra PO-2250", "o motivo");
    await clickByText(driver, "aside//button", "Registrar movimentação");
    await driver.wait(async () => (await (await waitForElement(driver, By.xpath(itemRow(item.name)), null, "o item")).getText()).includes("15 L"), 60000, "O saldo não foi para 15 L");

    await click(driver, movementButton, "\"Movimentar\"");
    await clickByText(driver, "aside//button", "Saída");
    await typeInto(driver, drawerField("QUANTIDADE"), "40", "uma saída maior que o saldo");
    await typeInto(driver, drawerField("MOTIVO"), "OS de teste", "o motivo");
    await clickByText(driver, "aside//button", "Registrar movimentação");
    await waitForText(driver, "Saldo insuficiente");

    await typeInto(driver, drawerField("QUANTIDADE"), "12", "a quantidade");
    await clickByText(driver, "aside//button", "Registrar movimentação");
    await driver.wait(async () => (await (await waitForElement(driver, By.xpath(itemRow(item.name)), null, "o item")).getText()).includes("3 L"), 60000, "O saldo não foi para 3 L");
  }));

  test("o item abaixo do mínimo aparece no aviso do painel e no filtro de alertas (US15)", () => runFlow(driver, "estoque-alerta", async () => {
    const item = await createItem(`${label} Primer em alerta`, 1, 5);
    await login(driver, MANAGER_CREDENTIALS);
    await waitForText(driver, "do estoque mínimo.");
    await clickByText(driver, "main//a", "Ver estoque");
    await waitForText(driver, "CONTROLE DE ESTOQUE");

    await clickByText(driver, "button", "ver apenas alertas");
    await waitForText(driver, item.name);
    await clickByText(driver, "button", "mostrar todos");
  }));

  test("o gestor consulta o histórico de movimentações de um item (US16)", () => runFlow(driver, "estoque-historico", async () => {
    const item = await createItem(`${label} Lixa`, 50, 0);
    const employeeId = await findEmployeeId(adminToken, MANAGER_CREDENTIALS.email);
    for (const [type, quantity, reason] of [["outbound", 8, "OS de teste"], ["inbound", 20, "Compra de reposição"]]) {
      await expectOk(callApi(adminToken, "POST", "/stock-movements", {
        inventoryItemId: item.inventoryItemId, employeeId, type, quantity, reason,
      }), "Registrar a movimentação");
    }

    await login(driver, MANAGER_CREDENTIALS);
    await openFromMenu(driver, "Estoque");
    await clickByText(driver, "button", "Histórico");
    await selectOption(driver, drawerField("ITEM", "select"), item.name, "o item");
    await clickByText(driver, "aside//button", "Consultar período");
    await waitForText(driver, "Compra de reposição");
    await waitForText(driver, "OS de teste");
    await waitForTextToDisappear(driver, "Carregando histórico...");
  }));
});
