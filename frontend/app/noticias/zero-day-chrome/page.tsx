import Link from 'next/link'
import { NewsHeader } from '@/components/news-header'
import '../../article.css'

export default function ChromeZeroDayNewsPage() {
  return <main className="article-page">
    <NewsHeader />
    <article className="article-content">
      <nav className="article-breadcrumb" aria-label="Caminho da página"><Link href="/">Início</Link><span>•</span><Link href="/#noticias">Notícias</Link><span>•</span><span>Vulnerabilidades</span></nav>
      <p className="article-category">Vulnerabilidades <span>•</span> 09/09/2026</p>
      <h1>Google corrige nova falha zero-day do Chrome explorada em ataques</h1>
      <p className="article-byline"><strong>Publicado em 09/09/2026</strong> <span>•</span> Fonte: BleepingComputer <span>•</span> Por Sergiu Gatlan</p>

      <p>O Google lançou uma atualização de segurança para corrigir uma nova vulnerabilidade <strong>zero-day do Chrome que já estava sendo explorada em ataques reais</strong>.</p>
      <p>Identificada como <strong>CVE-2026-87491</strong>, a vulnerabilidade é considerada de alta severidade e afeta o mecanismo <strong>V8</strong>, utilizado pelo navegador para executar JavaScript e WebAssembly. O Google confirmou que um exploit para a falha já existia e estava sendo utilizado no mundo real.</p>

      <figure className="article-figure"><img src="/noticia-chrome.jpg" alt="Logotipo do Google Chrome sobre elementos digitais" /><figcaption>Imagem ilustrativa do Google Chrome.</figcaption></figure>

      <h2>1. O que aconteceu?</h2>
      <p>A CVE-2026-87491 é resultado de uma falha do tipo <strong>out-of-bounds write</strong>, ou escrita fora dos limites de memória, presente no mecanismo V8 do Chrome.</p>
      <p>Segundo a matéria, invasores remotos podem explorar a vulnerabilidade por meio de páginas HTML especialmente preparadas, possibilitando a execução de código arbitrário dentro da <em>sandbox</em> do navegador.</p>
      <p>Uma exploração bem-sucedida também pode causar corrupção de memória, permitir acesso a informações sensíveis ou provocar o travamento do navegador. O Google não divulgou detalhes adicionais sobre os ataques nos quais a vulnerabilidade estava sendo utilizada.</p>

      <h2>2. Google começa a distribuir a correção</h2>
      <p>As versões corrigidas começaram a ser disponibilizadas para os principais sistemas operacionais:</p>
      <ul className="article-version-list"><li><strong>Windows:</strong> Chrome 153.0.8010.36</li><li><strong>macOS:</strong> Chrome 153.0.8010.37</li><li><strong>Linux:</strong> Chrome 153.0.8010.36</li></ul>
      <p>A vulnerabilidade havia sido reportada ao Google por <strong>Jihyeon Jeong</strong>, pesquisadora do Compsec Lab da Seoul National University. Dois dias depois, as versões corrigidas começaram a ser distribuídas pelo canal Stable Desktop.</p>

      <h2>3. Atualização pode levar semanas para chegar a todos</h2>
      <p>Embora a correção já estivesse disponível, o Google informou que sua distribuição poderia levar <strong>dias ou semanas</strong> para alcançar todos os usuários do Chrome ao redor do mundo.</p>
      <p>Quem não atualizar manualmente pode aguardar o próprio Chrome verificar e instalar automaticamente novas versões durante uma próxima inicialização.</p>

      <h2>4. Chrome acumula outras zero-days corrigidas em 2026</h2>
      <p>A CVE-2026-87491 não foi um caso isolado. Ao longo de 2026, o Google também corrigiu outras vulnerabilidades zero-day que estavam sendo exploradas ativamente.</p>
      <p>Entre as falhas mencionadas estão a <strong>CVE-2026-2441</strong>, relacionada ao CSSFontFeatureValuesMap; as <strong>CVE-2026-3909 e CVE-2026-3910</strong>, envolvendo Skia e V8; a <strong>CVE-2026-5281</strong>, presente no Dawn/WebGPU; e a <strong>CVE-2026-85046</strong>, outra vulnerabilidade encontrada no V8.</p>
      <p>Em 2025, o Google também havia corrigido outras oito vulnerabilidades zero-day exploradas no mundo real, várias delas identificadas por pesquisadores ligados ao Threat Analysis Group (TAG).</p>

      <h2>5. Como manter o Chrome protegido</h2>
      <p>Usuários do navegador devem manter o Chrome atualizado para uma versão que contenha a correção. A atualização pode ser verificada diretamente nas configurações do navegador.</p>
      <p>No Chrome, basta acessar <strong>Menu ⋮ → Ajuda → Sobre o Google Chrome</strong>. Quando uma nova versão estiver disponível, o navegador realiza a atualização e pode solicitar uma reinicialização para concluir o processo.</p>
      <p>Como a vulnerabilidade já estava sendo explorada ativamente, a instalação da versão corrigida reduz a exposição à CVE-2026-87491.</p>

      <p className="article-source"><strong>Fonte:</strong> BleepingComputer<br /><strong>Matéria original:</strong> <em>Google warns of new Chrome zero-day bug exploited in attacks</em><br /><strong>Autor:</strong> Sergiu Gatlan<br /><strong>Publicação:</strong> 9 de setembro de 2026.</p>
    </article>
  </main>
}
