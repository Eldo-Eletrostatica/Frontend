"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { sendApiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import CaptchaField, { type CaptchaFieldHandle } from "@/components/public/CaptchaField";
import { INVALID_EMAIL_MESSAGE, isValidEmail } from "@/lib/validation/email";
import { INVALID_PERSON_NAME_MESSAGE, isValidPersonName, normalizePersonName } from "@/lib/validation/name";
import { INVALID_PHONE_MESSAGE, formatPhone, isValidPhone, normalizePhoneDigits } from "@/lib/validation/phone";

// Same limits as the Backend contact request DTO.
const NAME_MAX_LENGTH = 150;
const EMAIL_MAX_LENGTH = 254;
const MESSAGE_MAX_LENGTH = 2000;
const UNEXPECTED_ERROR_MESSAGE = "Não foi possível enviar a mensagem. Tente novamente.";

interface ContactRequestFields {
  name: string;
  phone: string;
  email: string;
  message: string;
  hasConsent: boolean;
}

type FieldErrors = Partial<Record<keyof ContactRequestFields, string>>;

const EMPTY_FIELDS: ContactRequestFields = { name: "", phone: "", email: "", message: "", hasConsent: false };

function validateContactRequest(fields: ContactRequestFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = "Informe seu nome.";
  else if (!isValidPersonName(fields.name)) errors.name = INVALID_PERSON_NAME_MESSAGE;
  if (!fields.phone.trim()) errors.phone = "Informe um telefone para contato.";
  else if (!isValidPhone(fields.phone)) errors.phone = INVALID_PHONE_MESSAGE;
  if (!fields.email.trim()) errors.email = "Informe seu e-mail.";
  else if (!isValidEmail(fields.email)) errors.email = INVALID_EMAIL_MESSAGE;
  if (!fields.message.trim()) errors.message = "Descreva o que você precisa.";
  if (!fields.hasConsent) errors.hasConsent = "Autorize o contato para enviar a mensagem.";
  return errors;
}

const INPUT_CLASS_NAME = "w-full h-[46px] px-4 bg-site-card border text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors";

function getBorderClassName(error: string | undefined): string {
  return error ? "border-red-400" : "border-site-text/18";
}

export default function ContactRequestForm() {
  const [fields, setFields] = useState<ContactRequestFields>(EMPTY_FIELDS);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<Field extends keyof ContactRequestFields>(field: Field, value: ContactRequestFields[Field]) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setIsSent(false);
  }

  async function submitContactRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateContactRequest(fields);
    setErrors(validationErrors);
    setSubmitError(null);
    const captchaToken = captchaRef.current?.requireToken() ?? null;
    if (Object.keys(validationErrors).length > 0 || !captchaToken) return;

    const honeypot = honeypotRef.current?.value ?? "";
    setIsSubmitting(true);
    try {
      await sendApiRequest("/contact-requests", {
        method: "POST",
        body: {
          name: normalizePersonName(fields.name).trim(),
          phone: normalizePhoneDigits(fields.phone),
          email: fields.email.trim(),
          message: fields.message.trim(),
          // Only a script fills the honeypot, so people never send this field.
          ...(honeypot ? { website: honeypot } : {}),
        },
        captchaToken,
      });
      setFields(EMPTY_FIELDS);
      setIsSent(true);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
      captchaRef.current?.reset();
    }
  }

  return (
    <form onSubmit={submitContactRequest} noValidate className="p-8 md:p-10 flex flex-col gap-5 bg-site-page">
      {/* Honeypot: off screen and out of the tab order, so people never fill it;
          a script that fills every field gets a fake success from the API. */}
      <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
        <label htmlFor="contact-website">Deixe este campo em branco</label>
        <input id="contact-website" ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="NOME COMPLETO" htmlFor="contact-name" error={errors.name}>
          <input id="contact-name" type="text" autoComplete="name" value={fields.name} maxLength={NAME_MAX_LENGTH}
            onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(errors.name)}
            placeholder="Seu nome" className={`${INPUT_CLASS_NAME} ${getBorderClassName(errors.name)}`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
        </FormField>
        <FormField label="TELEFONE (WHATSAPP)" htmlFor="contact-phone" error={errors.phone}>
          <input id="contact-phone" type="tel" inputMode="numeric" autoComplete="tel" value={fields.phone}
            onChange={(event) => updateField("phone", formatPhone(event.target.value))} aria-invalid={Boolean(errors.phone)}
            placeholder="(61) 99999-9999" className={`${INPUT_CLASS_NAME} ${getBorderClassName(errors.phone)}`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
        </FormField>
      </div>
      <FormField label="E-MAIL" htmlFor="contact-email" error={errors.email}>
        <input id="contact-email" type="email" autoComplete="email" value={fields.email} maxLength={EMAIL_MAX_LENGTH}
          onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)}
          placeholder="seu@email.com" className={`${INPUT_CLASS_NAME} ${getBorderClassName(errors.email)}`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
      </FormField>
      <FormField label="DESCRIÇÃO DO QUE PRECISO" htmlFor="contact-message" error={errors.message}>
        <textarea id="contact-message" value={fields.message} rows={4} maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) => updateField("message", event.target.value)} aria-invalid={Boolean(errors.message)}
          placeholder="Que peça é, medidas aproximadas, quantidade e a cor que você quer. Se tiver foto, envie depois pelo WhatsApp."
          className={`w-full px-4 py-3 bg-site-card border ${getBorderClassName(errors.message)} text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent resize-none transition-colors`}
          style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
      </FormField>
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={fields.hasConsent} onChange={(event) => updateField("hasConsent", event.target.checked)}
            aria-invalid={Boolean(errors.hasConsent)} className="mt-1 accent-site-accent" />
          <span className="text-[12px] text-site-text/55 leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Autorizo o contato pelo WhatsApp informado e a guarda dos meus dados para fins de orçamento.
          </span>
        </label>
        {errors.hasConsent && <FieldError message={errors.hasConsent} />}
      </div>

      <CaptchaField ref={captchaRef} />

      {submitError && (
        <p role="alert" className="px-4 py-3 border border-red-400 bg-red-400/10 text-red-300 text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
          {submitError}
        </p>
      )}

      {isSent ? (
        <div role="status" className="min-h-[52px] px-4 flex items-center justify-center text-center bg-[rgba(52,211,153,0.08)] border border-emerald-500 text-emerald-400 text-[13px]"
          style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
          Mensagem enviada. Nossa equipe vai entrar em contato pelo WhatsApp em breve.
        </div>
      ) : (
        <button type="submit" disabled={isSubmitting}
          className="flex items-center justify-center gap-2 h-[52px] rounded-full bg-site-accent text-site-page text-[14px] hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
          {isSubmitting ? "Enviando..." : <>Enviar mensagem <ArrowRight size={16} /></>}
        </button>
      )}
    </form>
  );
}

function FormField({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[11px] tracking-[2px] text-site-text/45"
        style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
      {error && <FieldError message={error} />}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-[12px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{message}</p>;
}
