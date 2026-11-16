export const ADMIN_PAGE_SIZE = 4;

export function normalizarBusca(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function selecionarRegistros<T>(
  items: T[],
  texto: (item: T) => string,
  busca: string,
  filtro = "TODOS",
  categoria?: (item: T) => string,
) {
  const termo = normalizarBusca(busca.trim());
  return items.filter(
    (item) =>
      (!termo || normalizarBusca(texto(item)).includes(termo)) &&
      (filtro === "TODOS" || !categoria || categoria(item) === filtro),
  );
}

export function paginarRegistros<T>(items: T[], paginaSolicitada: number) {
  const totalPaginas = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
  const pagina = Math.min(
    Math.max(1, Math.trunc(paginaSolicitada) || 1),
    totalPaginas,
  );
  const inicio = (pagina - 1) * ADMIN_PAGE_SIZE;
  return {
    pagina,
    totalPaginas,
    visiveis: items.slice(inicio, inicio + ADMIN_PAGE_SIZE),
    inicio: items.length ? inicio + 1 : 0,
    fim: Math.min(inicio + ADMIN_PAGE_SIZE, items.length),
  };
}
