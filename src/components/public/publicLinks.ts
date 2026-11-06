import { ROUTES } from "@/lib/routes";

// No link to the internal area: employees reach it by its address, so the
// public site does not advertise it.
export const PUBLIC_LINKS: { href: string; label: string }[] = [
  { href: ROUTES.home,         label: "Início" },
  { href: ROUTES.events,       label: "Eventos" },
  { href: ROUTES.quote, label: "Solicitar Orçamento" },
];
