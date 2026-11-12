// Prepares the data a flow needs straight through the API, so each test only
// clicks through the screen it covers. Calls go through the site's /api proxy,
// the same address the browser uses, so this also works against production.

const {
  ADMIN_CREDENTIALS,
  BASE_URL,
  CAPTCHA_TOKEN,
  EMPLOYEE_CREDENTIALS,
  MANAGER_CREDENTIALS,
} = require("./browser");

const HTTP_CONFLICT = 409;
const DAY_MS = 24 * 60 * 60 * 1000;
// Everything the suite creates carries this prefix, so it is easy to find.
const E2E_PREFIX = "E2E";

async function callApi(token, method, routePath, body) {
  const response = await fetch(`${BASE_URL}/api${routePath}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data };
}

async function expectOk(responsePromise, description) {
  const { status, data } = await responsePromise;
  if (status >= 400) {
    throw new Error(`${description} falhou com ${status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// The login answers the access token too; a Bearer call needs no CSRF header.
async function signIn(credentials) {
  const data = await expectOk(
    callApi(null, "POST", "/auth/login", credentials),
    `O login de ${credentials.email}`,
  );
  return data.accessToken;
}

// Creates the account when it does not exist yet (409 means it does).
async function ensureEmployee(adminToken, credentials, name, role) {
  const { status, data } = await callApi(adminToken, "POST", "/employees", {
    name,
    email: credentials.email,
    password: credentials.password,
    role,
  });
  if (status >= 400 && status !== HTTP_CONFLICT) {
    throw new Error(`Criar ${credentials.email} falhou com ${status}: ${JSON.stringify(data)}`);
  }
}

// The manager and the employee of the suite.
async function ensureSuiteAccounts() {
  const adminToken = await signIn(ADMIN_CREDENTIALS);
  await ensureEmployee(adminToken, MANAGER_CREDENTIALS, "Gestor E2E", "manager");
  await ensureEmployee(adminToken, EMPLOYEE_CREDENTIALS, "Funcionário E2E", "employee");
  return adminToken;
}

// A sale needs one active paint type and one active part material.
async function ensureCatalog(adminToken) {
  const options = await expectOk(callApi(adminToken, "GET", "/catalog-items/options"), "Ler o catálogo");
  let paint = options.find((option) => option.type === "paintType");
  let material = options.find((option) => option.type === "partMaterial");
  if (!paint) {
    paint = await expectOk(callApi(adminToken, "POST", "/catalog-items", {
      type: "paintType", name: `${E2E_PREFIX} Tinta epóxi`, pricePerM2: 80,
    }), "Criar o tipo de pintura");
  }
  if (!material) {
    material = await expectOk(callApi(adminToken, "POST", "/catalog-items", {
      type: "partMaterial", name: `${E2E_PREFIX} Aço carbono`, priceFactor: 1.2,
    }), "Criar o material");
  }
  return { paint, material };
}

async function findEmployeeId(adminToken, email) {
  const employees = await expectOk(callApi(adminToken, "GET", "/employees"), "Listar os funcionários");
  const employee = employees.find((candidate) => candidate.email === email.toLowerCase());
  if (!employee) throw new Error(`Funcionário ${email} não encontrado`);
  return employee.employeeId;
}

// Sale straight from the internal area: it creates the service order (OS)
// and its protocol, which the client tracks.
async function launchDirectSale(adminToken, { sellerEmployeeId, customer, finalPrice, dueDate, scope }) {
  const { paint, material } = await ensureCatalog(adminToken);
  return expectOk(callApi(adminToken, "POST", "/sales", {
    sellerEmployeeId,
    scope,
    dueDate,
    customer,
    finalPrice,
    items: [{
      paintCatalogItemId: paint.catalogItemId,
      materialCatalogItemId: material.catalogItemId,
      areaM2: 2.5,
      quantity: 4,
    }],
  }), "Lançar a venda");
}

// A quote sent by a company through the site, the way the PDF form does.
// The PDF path works whether the simulator is on or off.
async function requestPdfQuote(customerName, cnpj) {
  const form = new FormData();
  form.append("name", customerName);
  form.append("cnpj", cnpj);
  form.append("email", "orcamento.e2e@empresa.test");
  form.append("phone", "61992702881");
  form.append("message", "Pedido criado pela suíte de testes.");
  form.append("file", new Blob(["%PDF-1.4\n%%EOF\n"], { type: "application/pdf" }), "projeto-e2e.pdf");
  const response = await fetch(`${BASE_URL}/api/quotes/pdf`, {
    method: "POST",
    headers: { "X-Captcha-Token": CAPTCHA_TOKEN },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Enviar o orçamento falhou com ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function setCommissionRule(adminToken, employeeId, commissionType, commissionValue) {
  return expectOk(callApi(adminToken, "PATCH", `/employees/${employeeId}/commission-rule`, {
    commissionType, commissionValue,
  }), "Configurar a regra de comissão");
}

// Leaves the service orders of the suite completed, so none stays open or late.
async function completeServiceOrders(adminToken, orderIds) {
  for (const orderId of orderIds) {
    await callApi(adminToken, "PATCH", `/service-orders/${orderId}/status`, { status: "completed" });
  }
}

// A CNPJ with valid check digits, different on every run.
function generateCnpj() {
  const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).concat([0, 0, 0, 1]);
  const checkDigit = (digits) => {
    const weights = digits.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = digits.reduce((total, digit, index) => total + digit * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = checkDigit(base);
  const second = checkDigit([...base, first]);
  return [...base, first, second].join("");
}

// YYYY-MM-DD, days from today (negative for the past).
function isoDateFromToday(days) {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

// Short and unique per run, to tell apart what each run created.
function runLabel() {
  return `${E2E_PREFIX} ${new Date().toISOString().slice(5, 16).replace("T", " ")}`;
}

module.exports = {
  callApi,
  completeServiceOrders,
  ensureCatalog,
  ensureSuiteAccounts,
  expectOk,
  findEmployeeId,
  generateCnpj,
  isoDateFromToday,
  launchDirectSale,
  requestPdfQuote,
  runLabel,
  setCommissionRule,
  signIn,
};
