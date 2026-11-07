const MIN_NAME_LENGTH = 2;
// Letters (accented ones included), spaces, apostrophe and hyphen, starting
// and ending with a letter, as in "Ana D'Ávila" or "Maria-Clara".
const PERSON_NAME_PATTERN = /^\p{L}[\p{L} '-]*\p{L}$/u;

export const INVALID_PERSON_NAME_MESSAGE = "Use só letras, espaços, apóstrofo ou hífen no nome.";
export const SHORT_COMPANY_NAME_MESSAGE = `A razão social precisa ter pelo menos ${MIN_NAME_LENGTH} caracteres.`;

export function isValidPersonName(value: string): boolean {
  return PERSON_NAME_PATTERN.test(value.trim());
}

// Company names keep numbers and symbols, as in "Ltda." and "S/A", so only the
// length is checked.
export function isValidCompanyName(value: string): boolean {
  return value.trim().length >= MIN_NAME_LENGTH;
}
