"use client";

import { useEffect, useState } from "react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { ProvaCard } from "@/components/provas/prova-card";
import "@/components/provas/provas.css";
import { listarProvas, type ProvaResumo } from "@/lib/provas-api";

export default function AvaliacoesPage() {
  const [provas, setProvas] = useState<ProvaResumo[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarProvas()
      .then(setProvas)
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Erro ao carregar."),
      )
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="avaliacoes" />
      <section
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "2.5rem 1.25rem 4rem",
        }}
      >
        <h1>Avaliações</h1>
        <p style={{ opacity: 0.75, maxWidth: "60ch" }}>
          Teste o que você aprendeu nas trilhas. Cada avaliação gera uma nota de
          0 a 10 e fica registrada no seu histórico.
        </p>

        {carregando && <p className="provas-vazio">Carregando avaliações...</p>}
        {erro && <p className="prova-erro">{erro}</p>}

        {!carregando && !erro && provas.length === 0 && (
          <p className="provas-vazio">
            Nenhuma avaliação disponível no momento.
          </p>
        )}

        {provas.length > 0 && (
          <div className="provas-grid">
            {provas.map((prova) => (
              <ProvaCard key={prova.id} prova={prova} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
