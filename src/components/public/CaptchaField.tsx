"use client";

import { useId, useImperativeHandle, useRef, useState, useSyncExternalStore, type Ref } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

// The site key is public by design: Turnstile renders it in the page HTML.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const MISSING_TOKEN_MESSAGE = "Confirme que você não é um robô.";
const EXPIRED_TOKEN_MESSAGE = "A verificação expirou. Confirme de novo que você não é um robô.";
const WIDGET_ERROR_MESSAGE = "Não foi possível carregar a verificação. Recarregue a página e tente de novo.";

// The Selenium suite runs against production, where Cloudflare does not let an
// automated browser pass the challenge. The suite writes the Backend's
// E2E_CAPTCHA_TOKEN here and the form sends it instead of a Turnstile token;
// a real visitor never has this key, and a wrong value is refused by the API.
const END_TO_END_TOKEN_STORAGE_KEY = "eldo-e2e-captcha-token";

function subscribeToNothing() {
  return () => {};
}

function readEndToEndToken(): string | null {
  return window.localStorage.getItem(END_TO_END_TOKEN_STORAGE_KEY);
}

// The server has no localStorage; React reads the browser value after hydration.
function readEndToEndTokenOnServer(): string | null {
  return null;
}

export interface CaptchaFieldHandle {
  // Returns the current token, or null after showing the missing token message.
  requireToken: () => string | null;
  // Turnstile tokens are single use, so every submission needs a fresh one.
  reset: () => void;
}

export default function CaptchaField({ ref }: { ref: Ref<CaptchaFieldHandle> }) {
  // The library defaults every widget to the same element id, and the quote
  // page renders two widgets at once.
  const widgetId = useId();
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const endToEndToken = useSyncExternalStore(subscribeToNothing, readEndToEndToken, readEndToEndTokenOnServer);

  useImperativeHandle(ref, () => ({
    requireToken() {
      if (endToEndToken) return endToEndToken;
      if (!token) setMessage(MISSING_TOKEN_MESSAGE);
      return token;
    },
    reset() {
      setToken(null);
      turnstileRef.current?.reset();
    },
  }), [token, endToEndToken]);

  function acceptToken(newToken: string) {
    setToken(newToken);
    setMessage(null);
  }

  function discardToken(reason: string) {
    setToken(null);
    setMessage(reason);
  }

  if (endToEndToken) return null;

  return (
    <div className="flex flex-col gap-2">
      <Turnstile ref={turnstileRef} id={widgetId} siteKey={TURNSTILE_SITE_KEY} options={{ theme: "dark", language: "pt-BR" }}
        onSuccess={acceptToken} onExpire={() => discardToken(EXPIRED_TOKEN_MESSAGE)} onError={() => discardToken(WIDGET_ERROR_MESSAGE)} />
      {message && (
        <p role="alert" className="text-[12px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{message}</p>
      )}
    </div>
  );
}
