import type { Metadata } from "next";
import ContactPJPage from "@/components/public/ContactPJPage";
import type { EstimatorOptions } from "@/components/quote/types";
import { CACHE_TAGS, fetchPublicData } from "@/lib/api/server";

export const metadata: Metadata = { title: "Solicitar orçamento | Eldo Pintura Eletrostática" };

// Read on request, so next build does not need the Backend running.
export const dynamic = "force-dynamic";

// Without the options the page still offers the PDF upload, which the Backend
// accepts even with the estimator turned off.
const ESTIMATOR_UNAVAILABLE: EstimatorOptions = { isEnabled: false, paintTypes: [], partMaterials: [] };

async function loadEstimatorOptions(): Promise<EstimatorOptions> {
  try {
    return await fetchPublicData<EstimatorOptions>("/quotes/estimator", CACHE_TAGS.estimator);
  } catch (error) {
    console.error("Falha ao carregar as opções do simulador de orçamento", error);
    return ESTIMATOR_UNAVAILABLE;
  }
}

export default async function QuotePage() {
  const estimatorOptions = await loadEstimatorOptions();
  return <ContactPJPage estimatorOptions={estimatorOptions} />;
}
