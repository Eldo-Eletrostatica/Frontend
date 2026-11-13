"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { sendApiRequest } from "@/lib/api/client";

interface GoogleProfile {
  googleProfileUrl: string | null;
}

// US18: once the service order is completed, the customer gets the link to
// review the Eldo on Google. Without the link (Google unavailable), the
// invitation does not show: the tracking works without it.
export default function ReviewInvite() {
  const [googleProfileUrl, setGoogleProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    sendApiRequest<GoogleProfile>("/reviews", { skipAuthRedirect: true })
      .then(({ googleProfileUrl: url }) => {
        if (isCurrent) setGoogleProfileUrl(url);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, []);

  if (!googleProfileUrl) return null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border border-[rgba(52,211,153,0.3)]" style={{ background: "rgba(52,211,153,0.04)" }} data-testid="review-invite">
      <div className="flex items-start gap-3">
        <Star size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-site-text/70 leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Seu serviço foi concluído. Conte para outros clientes como foi a sua experiência com a Eldo.
        </p>
      </div>
      <a
        href={googleProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 px-5 py-2.5 bg-site-accent text-site-page text-[12px] text-center hover:opacity-90 transition-opacity"
        style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
      >
        Avaliar no Google
      </a>
    </div>
  );
}
