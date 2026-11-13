"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Mail, MessageCircle, Phone, RotateCcw } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { sendApiRequest } from "@/lib/api/client";
import { buildLoginPath } from "@/lib/auth/loginRedirect";

// The Backend only lets a contact request go between these two statuses; once
// it turns into a quote it leaves this screen.
type ContactRequestStatus = "requested" | "handled";
type StatusFilter = ContactRequestStatus | "all";

interface ContactRequest {
  orderId: string;
  status: ContactRequestStatus;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

type ListState =
  | { kind: "loading" }
  | { kind: "loaded"; contactRequests: ContactRequest[] }
  | { kind: "failed"; message: string };

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "requested", label: "Novos" },
  { value: "handled", label: "Atendidos" },
  { value: "all", label: "Todos" },
];

const EMPTY_LIST_MESSAGE: Record<StatusFilter, string> = {
  requested: "Nenhuma solicitação de contato nova.",
  handled: "Nenhuma solicitação de contato atendida.",
  all: "Nenhuma solicitação de contato recebida.",
};

const UNEXPECTED_ERROR_MESSAGE = "Não foi possível carregar as solicitações de contato. Tente novamente.";
const UNEXPECTED_UPDATE_ERROR_MESSAGE = "Não foi possível atualizar a solicitação de contato. Tente novamente.";
const BRAZIL_COUNTRY_CODE = "55";
// A Brazilian number with area code has 10 or 11 digits; longer ones already
// carry the country code.
const MAX_NATIONAL_PHONE_DIGITS = 11;

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function buildListPath(filter: StatusFilter): string {
  return filter === "all" ? "/contact-requests" : `/contact-requests?status=${filter}`;
}

function readPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function cleanNationalPhoneDigits(digits: string): string {
  if ((digits.length === 11 || digits.length === 12) && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

function buildWhatsAppUrl(phone: string): string {
  let digits = readPhoneDigits(phone);
  if (!digits) return "#";
  digits = cleanNationalPhoneDigits(digits);
  const hasCountryCode = digits.length > MAX_NATIONAL_PHONE_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE);
  return `https://wa.me/${hasCountryCode ? digits : `${BRAZIL_COUNTRY_CODE}${digits}`}`;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function ContactRequests() {
  const [filter, setFilter] = useState<StatusFilter>("requested");
  const [reloadCount, setReloadCount] = useState(0);
  const [listState, setListState] = useState<ListState>({ kind: "loading" });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  // An expired session navigates cleanly to login preserving the current destination.
  const redirectToLogin = useCallback(() => {
    const { pathname, search } = window.location;
    window.location.assign(buildLoginPath(`${pathname}${search}`));
  }, []);

  useEffect(() => {
    // Switching filters fast must not let an older answer overwrite a newer one.
    let isCurrent = true;
    sendApiRequest<ContactRequest[]>(buildListPath(filter))
      .then((contactRequests) => {
        if (isCurrent) setListState({ kind: "loaded", contactRequests });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        if (isUnauthorized(error)) {
          redirectToLogin();
          return;
        }
        setListState({ kind: "failed", message: readErrorMessage(error, UNEXPECTED_ERROR_MESSAGE) });
      });
    return () => {
      isCurrent = false;
    };
  }, [filter, reloadCount, redirectToLogin]);

  function selectFilter(nextFilter: StatusFilter) {
    if (nextFilter === filter) return;
    setListState({ kind: "loading" });
    setUpdateError("");
    setFilter(nextFilter);
  }

  function reload() {
    setListState({ kind: "loading" });
    setReloadCount((count) => count + 1);
  }

  async function changeStatus(contactRequest: ContactRequest, status: ContactRequestStatus) {
    setUpdatingOrderId(contactRequest.orderId);
    setUpdateError("");
    try {
      const updated = await sendApiRequest<ContactRequest>(`/contact-requests/${contactRequest.orderId}/status`, {
        method: "PATCH",
        body: { status },
      });
      setListState((current) => {
        if (current.kind !== "loaded") return current;
        const isStillInFilter = filter === "all" || filter === updated.status;
        const contactRequests = isStillInFilter
          ? current.contactRequests.map((item) => (item.orderId === updated.orderId ? updated : item))
          : current.contactRequests.filter((item) => item.orderId !== updated.orderId);
        return { kind: "loaded", contactRequests };
      });
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      if (error instanceof ApiError && error.status === 409) {
        // A contact request that turned into a quote leaves this screen.
        setListState((current) => {
          if (current.kind !== "loaded") return current;
          return {
            kind: "loaded",
            contactRequests: current.contactRequests.filter((item) => item.orderId !== contactRequest.orderId),
          };
        });
      }
      setUpdateError(readErrorMessage(error, UNEXPECTED_UPDATE_ERROR_MESSAGE));
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[12px] tracking-[2.5px] text-site-accent mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          ATENDIMENTO PESSOA FÍSICA
        </p>
        <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
          Contatos
        </h1>
        <p className="mt-2 text-[14px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Solicitações enviadas pelo formulário de contato do site. Responda pelo WhatsApp e marque como atendida.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrar por status">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${filter === option.value ? "bg-site-accent text-site-page" : "border border-site-text/15 text-site-text/55 hover:text-site-text/90"}`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
          >
            {option.label.toUpperCase()}
          </button>
        ))}
      </div>

      {updateError && (
        <p role="alert" className="mb-4 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {updateError}
        </p>
      )}

      {listState.kind === "loading" && (
        <p className="px-5 py-10 text-center text-[14px] text-site-text/35 border border-site-text/8" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Carregando solicitações de contato...
        </p>
      )}

      {listState.kind === "failed" && (
        <div role="alert" className="px-5 py-10 text-center border border-red-500/30">
          <p className="text-[14px] text-red-300 mb-4" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{listState.message}</p>
          <button
            type="button"
            onClick={reload}
            className="px-5 py-2.5 border border-site-text/20 text-[13px] text-site-text hover:border-site-accent hover:text-site-accent transition-colors"
            style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {listState.kind === "loaded" && listState.contactRequests.length === 0 && (
        <p className="px-5 py-10 text-center text-[14px] text-site-text/35 border border-site-text/8" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {EMPTY_LIST_MESSAGE[filter]}
        </p>
      )}

      {listState.kind === "loaded" && listState.contactRequests.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {listState.contactRequests.map((contactRequest) => (
              <ContactRequestCard
                key={contactRequest.orderId}
                contactRequest={contactRequest}
                isUpdating={updatingOrderId === contactRequest.orderId}
                onChangeStatus={changeStatus}
              />
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-site-text/30" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {listState.contactRequests.length} {listState.contactRequests.length === 1 ? "solicitação" : "solicitações"}
          </p>
        </>
      )}
    </div>
  );
}

interface ContactRequestCardProps {
  contactRequest: ContactRequest;
  isUpdating: boolean;
  onChangeStatus: (contactRequest: ContactRequest, status: ContactRequestStatus) => void;
}

function ContactRequestCard({ contactRequest, isUpdating, onChangeStatus }: ContactRequestCardProps) {
  const isHandled = contactRequest.status === "handled";
  const linkClassName = "flex items-center gap-2 text-[13px] text-site-text/70 hover:text-site-accent transition-colors break-all";

  return (
    <li
      data-order-id={contactRequest.orderId}
      className="border border-site-text/8 bg-site-text/2 px-5 py-5 flex flex-col lg:flex-row gap-5"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <p className="text-[15px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{contactRequest.name}</p>
          <StatusTag isHandled={isHandled} />
        </div>
        <p className="text-[12px] text-site-text/40 mb-3" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Recebido em {DATE_FORMATTER.format(new Date(contactRequest.createdAt))}
        </p>
        <p className="text-[14px] text-site-text/75 whitespace-pre-line break-words" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {contactRequest.message}
        </p>
      </div>

      <div className="lg:w-[260px] flex flex-col gap-2.5 lg:border-l lg:border-site-text/7 lg:pl-5" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        <a href={`tel:${readPhoneDigits(contactRequest.phone)}`} className={linkClassName} data-contact-link="phone">
          <Phone size={14} className="flex-shrink-0" /> {contactRequest.phone}
        </a>
        <a href={`mailto:${contactRequest.email}`} className={linkClassName} data-contact-link="email">
          <Mail size={14} className="flex-shrink-0" /> {contactRequest.email}
        </a>
        <a
          href={buildWhatsAppUrl(contactRequest.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          data-contact-link="whatsapp"
        >
          <MessageCircle size={14} className="flex-shrink-0" /> Responder pelo WhatsApp
        </a>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onChangeStatus(contactRequest, isHandled ? "requested" : "handled")}
          className={`mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] tracking-[0.5px] transition-opacity disabled:opacity-50 ${isHandled ? "border border-site-text/20 text-site-text/75 hover:border-site-accent hover:text-site-accent" : "bg-site-accent text-site-page hover:opacity-90"}`}
          style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
        >
          {isHandled ? <RotateCcw size={14} /> : <Check size={14} />}
          {isUpdating ? "Salvando..." : isHandled ? "Desfazer atendimento" : "Marcar como atendido"}
        </button>
      </div>
    </li>
  );
}

function StatusTag({ isHandled }: { isHandled: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 text-[10px] tracking-[1.5px] ${isHandled ? "bg-[rgba(74,222,128,0.1)] text-green-400" : "bg-site-accent/12 text-site-accent"}`}
      style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
    >
      {isHandled ? "ATENDIDO" : "NOVO"}
    </span>
  );
}
