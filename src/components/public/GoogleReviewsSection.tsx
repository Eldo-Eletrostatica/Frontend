"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import type { GoogleReview, GoogleReviews } from "./publicContent";

type ReviewsState =
  | { status: "waiting" }
  | { status: "loaded"; data: GoogleReviews }
  | { status: "unavailable" };

const MAX_RATING = 5;
// Starts the request a little before the section scrolls into view.
const PRELOAD_MARGIN = "200px";

const publishedAtFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

// The Google terms forbid storing reviews, so they are fetched in the browser on
// every visit, never through the cached server fetch. The Backend also limits
// the daily calls to Google, so only visitors who reach the section spend one.
function useGoogleReviewsWhenVisible() {
  const sectionRef = useRef<HTMLElement>(null);
  const hasRequestedRef = useRef(false);
  const [state, setState] = useState<ReviewsState>({ status: "waiting" });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || hasRequestedRef.current) return;
      hasRequestedRef.current = true;
      observer.disconnect();
      apiRequest<GoogleReviews>("/reviews")
        .then((data) => setState(data.isAvailable ? { status: "loaded", data } : { status: "unavailable" }))
        .catch(() => setState({ status: "unavailable" }));
    }, { rootMargin: PRELOAD_MARGIN });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return { sectionRef, state };
}

export default function GoogleReviewsSection({ title }: { title: string }) {
  const { sectionRef, state } = useGoogleReviewsWhenVisible();

  return (
    <section ref={sectionRef} id="avaliacoes" className="py-20 bg-site-deep">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="border-b border-site-text/10 pb-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[3px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>AVALIAÇÕES</p>
            <h2 className="text-[40px] text-site-text leading-[1.05] tracking-[-1px] max-w-[560px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{title}</h2>
          </div>
          {state.status === "loaded" && state.data.googleProfileUrl && (
            <a href={state.data.googleProfileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] text-site-accent hover:opacity-80 transition-opacity flex-shrink-0"
              style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              Ver todas as avaliações no Google <ArrowRight size={14} />
            </a>
          )}
        </div>

        {state.status === "waiting" && (
          <p className="py-10 text-center text-[14px] text-site-text/45" aria-live="polite" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Carregando avaliações do Google...
          </p>
        )}

        {state.status === "unavailable" && (
          <ReviewsNotice
            title="Avaliações indisponíveis no momento"
            description="Não conseguimos carregar as avaliações do Google agora. Tente novamente mais tarde."
          />
        )}

        {state.status === "loaded" && state.data.reviews.length === 0 && (
          <ReviewsNotice title="Ainda não há avaliações no Google" description="Assim que recebermos avaliações, elas aparecem aqui." />
        )}

        {state.status === "loaded" && state.data.reviews.length > 0 && (
          <>
            {/* The Google terms ask the site to say the order is Google's. */}
            <p className="mb-6 text-[12px] tracking-[2px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
              AVALIAÇÕES MAIS RELEVANTES NO GOOGLE
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.data.reviews.map((review, index) => (
                <ReviewCard key={`${review.authorName}-${index}`} review={review} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ReviewsNotice({ title, description }: { title: string; description: string }) {
  return (
    <div role="status" className="py-14 px-6 text-center border border-site-text/8 bg-site-page">
      <p className="text-[18px] text-site-text mb-2" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{title}</p>
      <p className="text-[14px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{description}</p>
    </div>
  );
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const rating = Math.min(MAX_RATING, Math.max(0, Math.round(review.rating)));
  const stars = "★".repeat(rating) + "☆".repeat(MAX_RATING - rating);

  return (
    <article className="p-7 flex flex-col bg-site-page border border-site-text/7">
      <p className="text-site-accent text-[15px] tracking-[2px] mb-4" role="img" aria-label={`Nota ${rating} de ${MAX_RATING}`}>{stars}</p>
      {review.comment && (
        <p className="mb-5 text-[14px] text-site-text/80 leading-[1.75]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{`“${review.comment}”`}</p>
      )}
      <div className="mt-auto pt-4 border-t border-site-text/10 flex items-center gap-3">
        {review.authorPhotoUrl && (
          // The photo host is Google's and is not allowed in next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.authorPhotoUrl} alt="" width={36} height={36} referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-site-text/10"
            onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
        )}
        <div className="min-w-0">
          {review.authorProfileUrl ? (
            <a href={review.authorProfileUrl} target="_blank" rel="noopener noreferrer"
              className="text-[14px] text-site-text hover:text-site-accent transition-colors" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
              {review.authorName}
            </a>
          ) : (
            <p className="text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{review.authorName}</p>
          )}
          <p className="text-[11px] text-site-text/40" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {publishedAtFormat.format(new Date(review.publishedAt))}
            {review.reviewUrl && (
              <>
                {" · "}
                <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-site-accent">
                  Ver no Google Maps
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
