import { DashboardNavigation } from "@/components/dashboard-navigation";
import { ResumoDesempenho } from "@/components/desempenho/resumo-desempenho";
export default function DesempenhoPage() {
  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="desempenho" />
      <div className="content-wrap py-10">
        <ResumoDesempenho />
      </div>
    </main>
  );
}
