"use client";
import { use, useCallback } from "react";
import { buscarCenario } from "@/lib/phishing-api";
import { ActivityShell } from "@/components/activities/activity-shell";
import {
  ActivityError,
  ActivityLoading,
} from "@/components/activities/activity-state";
import { useActivity } from "@/components/activities/use-activity";
import { PhishingSimulator } from "@/components/phishing/phishing-simulator";
export default function CenarioPage({
  params,
}: {
  params: Promise<{ cenarioId: string }>;
}) {
  const { cenarioId } = use(params);
  const loader = useCallback(
    (signal: AbortSignal) => buscarCenario(cenarioId, signal),
    [cenarioId],
  );
  const { data, error, loading, retry } = useActivity(loader);
  return (
    <ActivityShell
      section="simulacoes"
      title={data?.titulo || "Simulação de phishing"}
      description={data?.descricao || "Observe os detalhes antes de decidir."}
      back="/simulacoes"
    >
      {loading ? (
        <ActivityLoading />
      ) : error ? (
        <ActivityError error={error} retry={retry} />
      ) : (
        data && <PhishingSimulator key={data.id} cenario={data} />
      )}
    </ActivityShell>
  );
}
