// The Backend validation (class-validator) and the framework answer some
// errors in English. The employee reads Portuguese, so the messages are
// translated here, once, before they reach any screen.

const FIELD_LABELS: Record<string, string> = {
  name: "nome",
  email: "e-mail",
  phone: "telefone",
  document: "documento",
  password: "senha",
  role: "nível de acesso",
  category: "categoria",
  categoryId: "categoria",
  supplierName: "fornecedor",
  unit: "unidade",
  balance: "quantidade inicial",
  minimumStock: "estoque mínimo",
  quantity: "quantidade",
  reason: "motivo",
  type: "tipo",
  scope: "escopo",
  dueDate: "prazo de entrega",
  finalPrice: "valor final",
  areaM2: "área",
  pricePerM2: "preço por m²",
  priceFactor: "fator",
  negotiationMargin: "margem de negociação",
  commissionType: "tipo de comissão",
  commissionValue: "valor da comissão",
  title: "título",
  description: "descrição",
  serviceType: "tipo de serviço",
  materials: "materiais",
  imageUrl: "imagem",
  startDate: "data inicial",
  endDate: "data final",
  from: "data inicial",
  to: "data final",
  items: "itens",
  customer: "cliente",
};

const FORBIDDEN_MESSAGE = "Você não tem permissão para esta ação.";
const UNAUTHORIZED_MESSAGE = "Sua sessão expirou. Entre novamente.";
const FILE_TOO_LARGE_MESSAGE = "O arquivo é grande demais. Envie um arquivo menor.";
const TOO_MANY_REQUESTS_MESSAGE = "Muitas tentativas seguidas. Aguarde um instante e tente de novo.";

const PAYLOAD_TOO_LARGE_STATUS = 413;
const TOO_MANY_REQUESTS_STATUS = 429;

// "items.0.areaM2" is shown by its last segment: "área".
function labelOf(property: string): string {
  const key = property.split(".").pop() ?? property;
  return FIELD_LABELS[key] ?? key;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type FieldRule = [RegExp, (label: string, ...groups: string[]) => string];

// Each rule matches one default message of class-validator: "<field> <rule>".
const FIELD_RULES: FieldRule[] = [
  [/^(\S+) should not be empty$/, (label) => `Preencha o campo ${label}.`],
  [/^(\S+) must not be less than (\S+)$/, (label, limit) => `${capitalize(label)} não pode ser menor que ${limit}.`],
  [/^(\S+) must not be greater than (\S+)$/, (label, limit) => `${capitalize(label)} não pode ser maior que ${limit}.`],
  [/^(\S+) must be a positive number$/, (label) => `${capitalize(label)} deve ser maior que zero.`],
  [/^(\S+) must be an integer number$/, (label) => `${capitalize(label)} deve ser um número inteiro.`],
  [/^(\S+) must be a number( conforming to the specified constraints)?$/, (label) => `${capitalize(label)} deve ser um número válido.`],
  [/^(\S+) must be an email$/, () => "Informe um e-mail válido."],
  [/^(\S+) must be a string$/, (label) => `${capitalize(label)} deve ser um texto.`],
  [/^(\S+) must be a boolean value$/, (label) => `${capitalize(label)} deve ser verdadeiro ou falso.`],
  [/^(\S+) must be a UUID$/, (label) => `${capitalize(label)} inválido.`],
  [/^(\S+) must be a valid ISO 8601 date string$/, (label) => `${capitalize(label)} deve ser uma data válida.`],
  [/^(\S+) must be longer than or equal to (\d+) characters$/, (label, length) => `${capitalize(label)} deve ter pelo menos ${length} caracteres.`],
  [/^(\S+) must be shorter than or equal to (\d+) characters$/, (label, length) => `${capitalize(label)} deve ter no máximo ${length} caracteres.`],
  [/^(\S+) must be one of the following values: (.+)$/, (label, values) => `${capitalize(label)} deve ser um destes valores: ${values}.`],
  [/^(\S+) must match .+ regular expression$/, (label) => `${capitalize(label)} está em um formato inválido.`],
  [/^(\S+) must contain at least (\d+) elements$/, (label) => `Informe pelo menos um valor em ${label}.`],
  [/^property (\S+) should not exist$/, (label) => `O campo ${label} não é aceito.`],
];

function translateValidationMessage(message: string): string {
  for (const [pattern, build] of FIELD_RULES) {
    const match = pattern.exec(message);
    if (!match) continue;
    const [, property, ...groups] = match;
    return build(labelOf(property), ...groups);
  }
  return message;
}

// Receives the message as the Backend sent it (a validation error list is
// already joined) and the HTTP status, and answers the text for the screen.
export function translateApiMessage(status: number, message: string): string {
  if (status === PAYLOAD_TOO_LARGE_STATUS || message === "File too large") return FILE_TOO_LARGE_MESSAGE;
  if (status === TOO_MANY_REQUESTS_STATUS) return TOO_MANY_REQUESTS_MESSAGE;
  if (message === "Forbidden resource") return FORBIDDEN_MESSAGE;
  if (message === "Unauthorized") return UNAUTHORIZED_MESSAGE;
  return translateValidationMessage(message);
}

// The validation list comes as separate sentences; each one is translated.
export function translateApiMessages(status: number, messages: string[]): string {
  return messages.map((message) => translateApiMessage(status, message)).join(" ");
}
