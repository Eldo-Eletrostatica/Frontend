// Brazilian phone with area code (DDD): 10 digits for landlines and 11 for
// mobiles. The API receives only the digits, so the mask lives in the screen.
const MAX_PHONE_DIGITS = 11;
const AREA_CODE_DIGITS = 2;
const LANDLINE_PREFIX_DIGITS = 4;
const MOBILE_PREFIX_DIGITS = 5;
// Area codes never start with 0, and every mobile number starts with 9.
const PHONE_DIGITS_PATTERN = /^[1-9]\d(?:\d{8}|9\d{8})$/;

export const INVALID_PHONE_MESSAGE = "Informe um telefone com DDD, como (61) 99999-9999.";

// A number pasted with the country code (+55) would push the last digits out
// of the mask, so the code is dropped when the digits do not fit otherwise.
const BRAZIL_COUNTRY_CODE = "55";

export function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > MAX_PHONE_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE)
    ? digits.slice(BRAZIL_COUNTRY_CODE.length)
    : digits;
}

export function isValidPhone(value: string): boolean {
  return PHONE_DIGITS_PATTERN.test(normalizePhoneDigits(value));
}

// Formats while the visitor types, as "(61) 9999-9999" or "(61) 99999-9999";
// digits beyond the eleventh are dropped.
export function formatPhone(value: string): string {
  const digits = normalizePhoneDigits(value).slice(0, MAX_PHONE_DIGITS);
  if (!digits) return "";
  const areaCode = digits.slice(0, AREA_CODE_DIGITS);
  const number = digits.slice(AREA_CODE_DIGITS);
  if (!number) return `(${areaCode}`;

  const prefixLength = digits.length === MAX_PHONE_DIGITS ? MOBILE_PREFIX_DIGITS : LANDLINE_PREFIX_DIGITS;
  const prefix = number.slice(0, prefixLength);
  const suffix = number.slice(prefixLength);
  return suffix ? `(${areaCode}) ${prefix}-${suffix}` : `(${areaCode}) ${prefix}`;
}
