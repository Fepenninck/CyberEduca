"use client";
import { useParams } from "next/navigation";
import { ResumoDesempenho } from "@/components/desempenho/resumo-desempenho";
export default function DesempenhoUsuarioPage() {
  const { usuarioId } = useParams<{ usuarioId: string }>();
  return <ResumoDesempenho usuarioId={usuarioId} />;
}
