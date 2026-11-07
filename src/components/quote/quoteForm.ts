import {
  INVALID_PERSON_NAME_MESSAGE,
  isValidCompanyName,
  isValidPersonName,
  SHORT_COMPANY_NAME_MESSAGE,
} from "@/lib/validation/name";
import { INVALID_PHONE_MESSAGE, isValidPhone, normalizePhoneDigits } from "@/lib/validation/phone";
import type { CreateEstimatedQuote, QuoteCustomer, QuoteItem } from "./types";

// Limits of the Backend DTOs (CreateEstimatedQuoteDto, QuoteCustomerDto).
export const CUSTOMER_NAME_MAX_LENGTH = 150;
export const EMAIL_MAX_LENGTH = 254;
export const CUSTOMER_MESSAGE_MAX_LENGTH = 2000;
export const MAX_QUOTE_PDF_BYTES = 10 * 1024 * 1024;
const CNPJ_DIGITS = 14;
// area is numeric(10,3) in the database.
const AREA_PATTERN = /^\d+([.,]\d{1,3})?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CustomerFields {
  companyName: string;
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface QuoteItemFields {
  key: number;
  paintCatalogItemId: string;
  materialCatalogItemId: string;
  description: string;
  areaM2: string;
  quantity: string;
}

export interface EstimatorFields {
  items: QuoteItemFields[];
  dueDate: string;
  color: string;
  notes: string;
}

export interface PdfFields {
  file: File | null;
  dueDate: string;
  notes: string;
}

// Keyed by field name, such as "cnpj" or "items.0.areaM2".
export type FieldErrors = Record<string, string>;

export const EMPTY_CUSTOMER: CustomerFields = { companyName: "", cnpj: "", contactName: "", phone: "", email: "" };

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function todayAsDateOnly(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseArea(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function validateCustomer(customer: CustomerFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!customer.companyName.trim()) errors.companyName = "Informe a razão social da empresa.";
  else if (!isValidCompanyName(customer.companyName)) errors.companyName = SHORT_COMPANY_NAME_MESSAGE;
  if (!customer.cnpj.trim()) errors.cnpj = "Informe o CNPJ.";
  else if (onlyDigits(customer.cnpj).length !== CNPJ_DIGITS) errors.cnpj = "O CNPJ precisa ter 14 dígitos.";
  if (customer.contactName.trim() && !isValidPersonName(customer.contactName)) errors.contactName = INVALID_PERSON_NAME_MESSAGE;
  if (!customer.phone.trim()) errors.phone = "Informe o telefone.";
  else if (!isValidPhone(customer.phone)) errors.phone = INVALID_PHONE_MESSAGE;
  if (!customer.email.trim()) errors.email = "Informe o e-mail.";
  else if (!EMAIL_PATTERN.test(customer.email.trim())) errors.email = "Informe um e-mail válido.";
  return errors;
}

function validateDueDate(dueDate: string, isRequired: boolean): string | undefined {
  if (!dueDate) return isRequired ? "Informe o prazo desejado." : undefined;
  if (dueDate < todayAsDateOnly()) return "O prazo não pode ser anterior a hoje.";
  return undefined;
}

function validateItem(item: QuoteItemFields, index: number): FieldErrors {
  const errors: FieldErrors = {};
  const prefix = `items.${index}`;
  if (!item.paintCatalogItemId) errors[`${prefix}.paintCatalogItemId`] = "Escolha o tipo de pintura.";
  if (!item.materialCatalogItemId) errors[`${prefix}.materialCatalogItemId`] = "Escolha o material da peça.";

  if (!item.areaM2.trim()) errors[`${prefix}.areaM2`] = "Informe a área.";
  else if (!AREA_PATTERN.test(item.areaM2.trim())) errors[`${prefix}.areaM2`] = "Use um número com até 3 casas decimais.";
  else if (parseArea(item.areaM2) <= 0) errors[`${prefix}.areaM2`] = "A área precisa ser maior que zero.";

  const quantity = Number(item.quantity);
  if (!item.quantity.trim()) errors[`${prefix}.quantity`] = "Informe a quantidade.";
  else if (!Number.isInteger(quantity) || quantity <= 0) errors[`${prefix}.quantity`] = "A quantidade precisa ser um número inteiro maior que zero.";
  return errors;
}

// The DTO has no field for the contact person, the color or the description of
// each part, so they travel in the free text message.
function buildEstimatorMessage(customer: CustomerFields, fields: EstimatorFields): string {
  const lines = [
    customer.contactName.trim() && `Responsável: ${customer.contactName.trim()}`,
    fields.color.trim() && `Cor desejada: ${fields.color.trim()}`,
    ...fields.items.map((item, index) => item.description.trim() && `Peça ${index + 1}: ${item.description.trim()}`),
    fields.notes.trim() && `Observações: ${fields.notes.trim()}`,
  ];
  return lines.filter(Boolean).join("\n");
}

function buildPdfMessage(customer: CustomerFields, fields: PdfFields): string {
  const lines = [
    customer.contactName.trim() && `Responsável: ${customer.contactName.trim()}`,
    fields.notes.trim() && `Observações: ${fields.notes.trim()}`,
  ];
  return lines.filter(Boolean).join("\n");
}

function validateMessageLength(message: string): FieldErrors {
  return message.length > CUSTOMER_MESSAGE_MAX_LENGTH
    ? { notes: `As informações adicionais passaram do limite de ${CUSTOMER_MESSAGE_MAX_LENGTH} caracteres.` }
    : {};
}

function toQuoteCustomer(customer: CustomerFields): QuoteCustomer {
  return {
    name: customer.companyName.trim(),
    cnpj: onlyDigits(customer.cnpj),
    email: customer.email.trim(),
    phone: normalizePhoneDigits(customer.phone),
  };
}

function toQuoteItem(item: QuoteItemFields): QuoteItem {
  return {
    paintCatalogItemId: item.paintCatalogItemId,
    materialCatalogItemId: item.materialCatalogItemId,
    areaM2: parseArea(item.areaM2),
    quantity: Number(item.quantity),
  };
}

type BuildResult<T> = { errors: FieldErrors; payload?: undefined } | { errors?: undefined; payload: T };

export function buildEstimatedQuote(customer: CustomerFields, fields: EstimatorFields): BuildResult<CreateEstimatedQuote> {
  const message = buildEstimatorMessage(customer, fields);
  const errors: FieldErrors = {
    ...validateCustomer(customer),
    ...fields.items.reduce<FieldErrors>((all, item, index) => ({ ...all, ...validateItem(item, index) }), {}),
    ...validateMessageLength(message),
  };
  const dueDateError = validateDueDate(fields.dueDate, true);
  if (dueDateError) errors.dueDate = dueDateError;
  if (Object.keys(errors).length > 0) return { errors };

  return {
    payload: {
      customer: toQuoteCustomer(customer),
      items: fields.items.map(toQuoteItem),
      dueDate: fields.dueDate,
      message: message || undefined,
    },
  };
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

// Multipart: the Backend reads the customer fields flat, next to the file.
export function buildPdfQuote(customer: CustomerFields, fields: PdfFields): BuildResult<FormData> {
  const message = buildPdfMessage(customer, fields);
  const errors: FieldErrors = { ...validateCustomer(customer), ...validateMessageLength(message) };
  if (!fields.file) errors.file = "Selecione o arquivo PDF do projeto.";
  else if (!isPdfFile(fields.file)) errors.file = "O arquivo precisa ser um PDF.";
  else if (fields.file.size > MAX_QUOTE_PDF_BYTES) errors.file = "O PDF precisa ter até 10 MB.";
  const dueDateError = validateDueDate(fields.dueDate, false);
  if (dueDateError) errors.dueDate = dueDateError;
  if (Object.keys(errors).length > 0 || !fields.file) return { errors };

  const formData = new FormData();
  Object.entries(toQuoteCustomer(customer)).forEach(([name, value]) => formData.append(name, value));
  if (fields.dueDate) formData.append("dueDate", fields.dueDate);
  if (message) formData.append("message", message);
  formData.append("file", fields.file);
  return { payload: formData };
}
