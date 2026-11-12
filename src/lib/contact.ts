// Public contacts of the company, shown on the site. Kept in one place so a
// change of number or link is a one-line edit.

// The 0 before the area code is the trunk prefix; wa.me wants the country code.
const WHATSAPP_NATIONAL_NUMBER = "61992702881";

export const CONTACT_WHATSAPP_URL = `https://wa.me/55${WHATSAPP_NATIONAL_NUMBER}`;
export const CONTACT_WHATSAPP_LABEL = "(61) 99270-2881";

export const CONTACT_ADDRESS = "QS 114, Conjunto 6, Lote 5 · Samambaia Sul · Distrito Federal";
export const CONTACT_MAP_URL = "https://maps.app.goo.gl/euD9cLrvp9cfdwkA8";

export const CONTACT_EMAIL = "eldopedro25@gmail.com";

export const COMPANY_CNPJ = "55.136.678/0001-98";

// Closed for lunch on weekdays.
export const BUSINESS_HOURS = [
  { days: "Segunda a sexta", hours: "8h às 12h e 14h às 18h" },
  { days: "Sábado", hours: "8h às 14h" },
] as const;

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/p/Eldo-pintura-eletrost%C3%A1tica-100076350391061/" },
  { label: "TikTok", href: "https://www.tiktok.com/@eldo.eletrostatic" },
] as const;
