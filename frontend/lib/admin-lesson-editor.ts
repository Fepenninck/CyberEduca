import type { LessonMaterial } from "./lesson-material";

export type ConteudoAulaEditavel =
  | { modo: "estruturado"; material: LessonMaterial }
  | { modo: "texto"; texto: string }
  | { modo: "invalido"; original: string };
export function novoMaterialAula(): LessonMaterial {
  return {
    format: "cybereduca-lesson-v1",
    title: "",
    concept: "",
    practice: "",
    source: "",
    sourceTitle: "",
    objectives: [],
  };
}
export function carregarConteudoAula(conteudo: string): ConteudoAulaEditavel {
  if (!conteudo.trim())
    return { modo: "estruturado", material: novoMaterialAula() };
  try {
    const valor = JSON.parse(conteudo.trim());
    if (valor?.format === "cybereduca-lesson-v1") {
      if (
        typeof valor.concept !== "string" ||
        typeof valor.practice !== "string"
      )
        return { modo: "invalido", original: conteudo };
      return { modo: "estruturado", material: valor as LessonMaterial };
    }
    if (valor && typeof valor === "object" && "format" in valor)
      return { modo: "invalido", original: conteudo };
  } catch {
    if (conteudo.includes("cybereduca-lesson-v1"))
      return { modo: "invalido", original: conteudo };
  }
  return { modo: "texto", texto: conteudo };
}
export function serializarMaterialAula(
  material: LessonMaterial,
  titulo: string,
  nivel?: LessonMaterial["level"],
): string {
  return JSON.stringify({
    ...material,
    format: "cybereduca-lesson-v1",
    title: titulo.trim(),
    ...(nivel ? { level: nivel } : {}),
  });
}
export function urlEditorialValida(valor: string, local = false): boolean {
  if (!valor.trim()) return true;
  if (local && /^\/(?!\/)/.test(valor.trim())) return true;
  try {
    return ["https:", "http:"].includes(new URL(valor.trim()).protocol);
  } catch {
    return false;
  }
}
export function validarMaterialAula(material: LessonMaterial): string | null {
  if (!material.concept.trim())
    return "Preencha a explicação principal da aula.";
  const links = [
    material.source,
    material.video?.url,
    material.video?.source,
    ...(material.readings ?? []).map((item) => item.url),
  ];
  if (links.some((link) => link && !urlEditorialValida(link)))
    return "Revise os links das fontes, leituras e vídeo. Use endereços iniciados por https:// ou http://.";
  if (
    material.video &&
    (!material.video.title.trim() ||
      !material.video.url.trim() ||
      !material.video.source.trim())
  )
    return "Informe o título, o endereço do vídeo e a página de origem, ou remova esse recurso.";
  if (
    material.diagram &&
    (!material.diagram.title.trim() ||
      !material.diagram.nodes.length ||
      material.diagram.nodes.some((item) => !item.trim()))
  )
    return "Preencha o título e as etapas do diagrama ou remova esse recurso.";
  if (
    (material.readings ?? []).some(
      (item) => !item.title.trim() || !item.url.trim(),
    )
  )
    return "Cada leitura complementar precisa de título e link.";
  if (
    (material.glossary ?? []).some(
      (item) => !item.term.trim() || !item.meaning.trim(),
    )
  )
    return "Preencha o termo e o significado de cada item do glossário.";
  if (material.introductory) {
    const intro = material.introductory;
    if (!urlEditorialValida(intro.image.src, true))
      return "Revise o endereço da imagem introdutória.";
    if (
      !intro.checkpoint.question.trim() ||
      !intro.checkpoint.options.length ||
      intro.checkpoint.options.some((item) => !item.trim()) ||
      !Number.isInteger(intro.checkpoint.correct) ||
      intro.checkpoint.correct < 0 ||
      intro.checkpoint.correct >= intro.checkpoint.options.length
    )
      return "Revise a pergunta, as opções e a resposta da atividade introdutória.";
  }
  return null;
}
export function resumoConteudoAula(conteudo: string): string {
  const resultado = carregarConteudoAula(conteudo);
  if (resultado.modo === "invalido")
    return "Conteúdo da aula indisponível para prévia.";
  const texto =
    resultado.modo === "estruturado"
      ? resultado.material.concept
      : resultado.texto;
  return texto
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 350);
}
