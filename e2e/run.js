// Runs the end-to-end suite by interaction flow:
//
//   npm run test:e2e                     every flow, in order
//   npm run test:e2e -- venda estoque    only these flows
//   npm run test:e2e -- fumaca           one test of each flow
//   npm run test:e2e -- producao         read-only check of production
//
// Before the browser opens it checks the variables, wakes the site and the
// API up (free instances sleep) and, with E2E_DATABASE_URL, saves a copy of
// the database. At the end, even after a failure or Ctrl+C, it loads that copy
// back, so the data the suite creates does not pile up in the staging
// environment. The variables are listed in the README.

const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { createReadStream, createWriteStream, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { clearSiteCache } = require("./support/api");
const { ADMIN_CREDENTIALS, BASE_URL, IS_PRODUCTION, MANAGER_CREDENTIALS } = require("./support/browser");

const E2E_DIRECTORY = __dirname;
const DATABASE_URL = process.env.E2E_DATABASE_URL;
// The API's own public address. A request from the site to a sleeping API
// on Render does not wake it up, so the API is woken directly.
const API_URL = process.env.E2E_API_URL?.replace(/\/+$/, "");
// Same major version as the staging and production databases.
const POSTGRES_CLIENT_IMAGE = "postgres:16-alpine";
// A free Render instance takes about a minute to wake up; both may be asleep.
const WAKE_UP_TIMEOUT_MS = 5 * 60 * 1000;
const WAKE_UP_RETRY_MS = 5000;
// A lock older than this belongs to a run that died without cleaning up.
const STALE_LOCK_MS = 60 * 60 * 1000;
const LOCK_PREFIX = "e2e-em-andamento";
const INTERRUPTED_EXIT_CODE = 130;

// Ctrl+C reaches every process of the terminal's group. The test running at
// that moment stops on its own; the flows that follow are skipped, and the
// database is restored before the script exits.
let isInterrupted = false;

// Each flow is a user journey; a step is a test file, optionally narrowed to
// the tests whose name matches the pattern.
const FLOWS = {
  vitrine: [{ file: "01-visitante-vitrine" }],
  contato: [{ file: "02-visitante-contato" }],
  venda: [
    { file: "07-vendas-comissoes", pattern: "\\(US21\\)" },
    { file: "06-servicos" },
    { file: "03-cliente-consulta-os" },
  ],
  comissoes: [
    { file: "07-vendas-comissoes", pattern: "\\(US2[23]\\)" },
    { file: "08-gestor", pattern: "\\(US24\\)" },
  ],
  estoque: [{ file: "05-estoque" }],
  gestao: [{ file: "08-gestor", pattern: "\\(US1[12]\\)" }],
  administracao: [{ file: "04-administrador" }],
  celular: [{ file: "09-celular" }],
  // Read-only: the only flow allowed against production.
  producao: [{ file: "01-visitante-vitrine" }, { file: "10-producao" }],
};
// One test per flow, to check a deploy in a few minutes.
const SMOKE_FLOW = [
  { file: "01-visitante-vitrine", pattern: "\\(US01\\)" },
  { file: "02-visitante-contato", pattern: "\\(US06\\)" },
  { file: "07-vendas-comissoes", pattern: "venda direta" },
  { file: "05-estoque", pattern: "\\(US13\\)" },
  { file: "08-gestor", pattern: "\\(US11\\)" },
  { file: "04-administrador", pattern: "\\(US09\\)" },
  { file: "09-celular", pattern: "site público" },
];
const SMOKE_FLOW_NAME = "fumaca";
const PRODUCTION_FLOW_NAME = "producao";

function isLocalUrl(url) {
  return ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
}

// The other flows create contacts, sales and employees and restore the
// database at the end, which in production would erase what real clients did
// meanwhile.
function selectFlows(names) {
  if (IS_PRODUCTION) {
    if (names.some((name) => name !== PRODUCTION_FLOW_NAME)) {
      throw new Error(`Na produção só roda o fluxo ${PRODUCTION_FLOW_NAME}, que não grava nada.`);
    }
    return [PRODUCTION_FLOW_NAME];
  }
  if (names.length === 0) return Object.keys(FLOWS).filter((name) => name !== PRODUCTION_FLOW_NAME);
  const unknown = names.filter((name) => name !== SMOKE_FLOW_NAME && !FLOWS[name]);
  if (unknown.length > 0) {
    const available = [...Object.keys(FLOWS), SMOKE_FLOW_NAME].join(", ");
    throw new Error(`Fluxo desconhecido: ${unknown.join(", ")}. Disponíveis: ${available}.`);
  }
  return names;
}

// The development defaults only exist locally, so a remote site needs the
// staging values.
function checkVariables() {
  if (IS_PRODUCTION) {
    if (DATABASE_URL) throw new Error("Na produção, tire o E2E_DATABASE_URL: o banco de produção nunca é restaurado.");
    if (!process.env.E2E_MANAGER_EMAIL || !process.env.E2E_MANAGER_PASSWORD) {
      throw new Error("Para rodar na produção, defina E2E_MANAGER_EMAIL e E2E_MANAGER_PASSWORD da conta de gestor de teste (ver o README).");
    }
    return;
  }
  if (isLocalUrl(BASE_URL)) return;
  const missing = [];
  if (!process.env.E2E_CAPTCHA_TOKEN) missing.push("E2E_CAPTCHA_TOKEN");
  if (!process.env.E2E_ADMIN_PASSWORD) missing.push("E2E_ADMIN_PASSWORD");
  if (missing.length > 0) {
    throw new Error(`Para rodar contra ${BASE_URL}, defina ${missing.join(" e ")} (ver o README).`);
  }
  if (!DATABASE_URL) {
    console.warn("E2E_DATABASE_URL não definida: os dados de teste vão ficar no banco depois da execução.");
  }
}

async function waitUntilAvailable(url, description) {
  const startedAt = Date.now();
  for (;;) {
    let outcome;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(WAKE_UP_RETRY_MS * 6) });
      if (response.ok) {
        console.log(`  ${description} respondeu em ${Math.round((Date.now() - startedAt) / 1000)} s.`);
        return;
      }
      outcome = `HTTP ${response.status}`;
    } catch (error) {
      outcome = error.name === "TimeoutError" ? "sem resposta em 30 s" : error.message;
    }
    console.log(`  ${description} ainda acordando (${outcome})...`);
    if (Date.now() - startedAt > WAKE_UP_TIMEOUT_MS) {
      throw new Error(`${description} não respondeu em ${WAKE_UP_TIMEOUT_MS / 60000} minutos (${url}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, WAKE_UP_RETRY_MS));
  }
}

// Render answers /robots.txt itself while a free service sleeps, so the site
// is woken by /versao, a route the app serves. Both wake up at the same time;
// the /api proxy then confirms the site reaches the API.
async function wakeUp() {
  console.log(`Acordando o site e a API em ${BASE_URL}...`);
  await Promise.all([
    waitUntilAvailable(`${BASE_URL}/versao`, "O site"),
    API_URL ? waitUntilAvailable(`${API_URL}/`, "A API") : Promise.resolve(),
  ]);
  await waitUntilAvailable(`${BASE_URL}/api`, "O proxy do site para a API");
  // A restore made outside the suite may have left the site's cache behind
  // the database. Production is never restored and the suite has no admin
  // account there.
  if (!IS_PRODUCTION) await clearSiteCache();
}

// The PostgreSQL client runs from Docker, so nobody installs it. A database on
// the host is reached through host.docker.internal.
function postgresClientArgs(command) {
  const url = new URL(DATABASE_URL);
  if (isLocalUrl(DATABASE_URL)) url.hostname = "host.docker.internal";
  return [
    "run", "--rm", "-i", "--add-host=host.docker.internal:host-gateway",
    POSTGRES_CLIENT_IMAGE, ...command(url.toString()),
  ];
}

function runPostgresClient(command, { input, output } = {}) {
  return new Promise((resolve, reject) => {
    // Its own process group, so a Ctrl+C in the terminal does not abort a
    // restore halfway.
    const child = spawn("docker", postgresClientArgs(command), { stdio: ["pipe", "pipe", "pipe"], detached: true });
    let stdout = "";
    let stderr = "";
    if (output) child.stdout.pipe(output);
    else child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    if (input) input.pipe(child.stdin);
    else child.stdin.end();
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command("<url>").join(" ")} falhou: ${stderr.trim()}`));
      } else if (output && !output.writableFinished) {
        output.on("finish", () => resolve(stdout.trim()));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function runSql(sql) {
  return runPostgresClient((url) => ["psql", url, "-tAc", sql]);
}

// The lock lives in the database comment, which pg_dump does not copy and
// pg_restore does not touch, so two runs never restore over each other.
async function acquireLock(runId) {
  const current = await runSql("SELECT COALESCE(shobj_description(oid, 'pg_database'), '') FROM pg_database WHERE datname = current_database()");
  if (current.startsWith(LOCK_PREFIX)) {
    const startedAt = Number(current.split(":")[2]);
    if (Date.now() - startedAt < STALE_LOCK_MS) {
      throw new Error("Outra execução da suíte está usando este banco. Espere ela terminar e rode de novo.");
    }
    console.warn("Encontrei a trava de uma execução antiga que não terminou; seguindo.");
  }
  await commentOnDatabase(`'${LOCK_PREFIX}:${runId}:${Date.now()}'`);
}

async function releaseLock() {
  await commentOnDatabase("NULL");
}

async function commentOnDatabase(value) {
  const name = await runSql("SELECT current_database()");
  await runSql(`COMMENT ON DATABASE "${name}" IS ${value}`);
}

async function saveDatabase(dumpPath) {
  console.log("Salvando uma cópia do banco...");
  await runPostgresClient((url) => ["pg_dump", "--format=custom", "--no-owner", "--no-privileges", url], {
    output: createWriteStream(dumpPath),
  });
}

// One transaction: if anything fails, the database stays as the suite left it.
async function restoreDatabase(dumpPath) {
  console.log("Restaurando o banco como estava antes da suíte...");
  await runPostgresClient(
    (url) => ["pg_restore", "--clean", "--if-exists", "--no-owner", "--no-privileges", "--single-transaction", `--dbname=${url}`],
    { input: createReadStream(dumpPath) },
  );
}

function runStep({ file, pattern }) {
  const args = ["--test", "--test-concurrency=1", "--test-reporter=spec"];
  if (pattern) args.push(`--test-name-pattern=${pattern}`);
  args.push(path.join(E2E_DIRECTORY, `${file}.test.js`));
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
    child.on("close", (code) => resolve(code === 0));
  });
}

async function runFlows(flowNames) {
  const failed = [];
  for (const name of flowNames) {
    const steps = name === SMOKE_FLOW_NAME ? SMOKE_FLOW : FLOWS[name];
    console.log(`\n=== Fluxo: ${name} ===`);
    let isFlowOk = true;
    for (const flowStep of steps) {
      if (isInterrupted) break;
      isFlowOk = (await runStep(flowStep)) && isFlowOk;
    }
    if (isInterrupted) break;
    if (!isFlowOk) failed.push(name);
  }
  return failed;
}

// The copy is kept when the restore fails, so it can be loaded by hand.
async function restoreAndUnlock(dumpPath) {
  try {
    await restoreDatabase(dumpPath);
  } catch (error) {
    console.error(`A restauração falhou; a cópia do banco ficou em ${dumpPath}.`);
    throw error;
  }
  await releaseLock();
  rmSync(dumpPath, { force: true });
  // The site would keep showing what the suite created and the restore removed.
  await clearSiteCache();
  console.log("Banco restaurado.");
}

async function main() {
  const flowNames = selectFlows(process.argv.slice(2));
  checkVariables();
  const account = IS_PRODUCTION ? `gestor: ${MANAGER_CREDENTIALS.email}` : `admin: ${ADMIN_CREDENTIALS.email}`;
  console.log(`Site: ${BASE_URL} | ${account} | fluxos: ${flowNames.join(", ")}`);
  await wakeUp();

  const runId = randomUUID();
  const dumpPath = path.join(os.tmpdir(), `eldo-e2e-${runId}.dump`);
  let isDatabaseSaved = false;
  process.on("SIGINT", () => {
    if (isInterrupted) {
      console.log("\nAguarde: o banco está sendo restaurado.");
      return;
    }
    isInterrupted = true;
    console.log("\nInterrompido: os fluxos seguintes não vão rodar.");
  });

  if (DATABASE_URL) {
    await acquireLock(runId);
    await saveDatabase(dumpPath);
    isDatabaseSaved = true;
  }

  try {
    const failed = await runFlows(flowNames);
    if (isInterrupted) {
      process.exitCode = INTERRUPTED_EXIT_CODE;
    } else {
      console.log(failed.length === 0 ? "\nTodos os fluxos passaram." : `\nFluxos com falha: ${failed.join(", ")}. Os prints estão em e2e/screenshots/.`);
      process.exitCode = failed.length === 0 ? 0 : 1;
    }
  } finally {
    if (isDatabaseSaved) await restoreAndUnlock(dumpPath);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
