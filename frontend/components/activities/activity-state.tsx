"use client";
import Link from "next/link";
import { AlertCircle, LoaderCircle, Inbox } from "lucide-react";
import { ActivityApiError } from "@/lib/activities-api";

export function ActivityLoading() {
  return (
    <div className="activity-state" role="status">
      <LoaderCircle className="activity-spin" size={28} />
      <p>Carregando atividade...</p>
    </div>
  );
}
export function ActivityError({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  const login = error instanceof ActivityApiError && error.status === 401;
  return (
    <div className="activity-state activity-error">
      <AlertCircle size={28} />
      <p role="alert">{error.message}</p>
      {login ? (
        <Link href="/login" className="dashboard-button-primary">
          Entrar na conta
        </Link>
      ) : (
        retry && (
          <button className="dashboard-button-secondary" onClick={retry}>
            Tentar novamente
          </button>
        )
      )}
    </div>
  );
}
export function ActivityEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="activity-state">
      <Inbox size={32} />
      <h2>Nenhuma atividade disponível</h2>
      <p>{children}</p>
      <Link href="/aulas" className="dashboard-button-secondary">
        Explorar as aulas
      </Link>
    </div>
  );
}
