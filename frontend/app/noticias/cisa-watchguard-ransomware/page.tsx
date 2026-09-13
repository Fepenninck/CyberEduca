import Link from 'next/link'
import { NewsHeader } from '@/components/news-header'
import '../../article.css'

export default function CisaWatchGuardNewsPage() {
  return <main className="article-page"><NewsHeader /><article className="article-content">
    <nav className="article-breadcrumb" aria-label="Caminho da página"><Link href="/">Início</Link><span>•</span><Link href="/#noticias">Notícias</Link><span>•</span><span>Ransomware</span></nav>
    <p className="article-category">Ransomware <span>•</span> 10/09/2026</p>
    <h1>CISA confirma exploração de falha crítica da WatchGuard em ataques de ransomware</h1>
    <p className="article-byline"><strong>Publicado em 10/09/2026</strong> <span>•</span> Fonte: BleepingComputer <span>•</span> Por Sergiu Gatlan</p>
    <p>A Agência de Segurança Cibernética e de Infraestrutura dos Estados Unidos, a <strong>CISA</strong>, confirmou que grupos de ransomware estão explorando uma vulnerabilidade crítica presente em firewalls <strong>WatchGuard Firebox</strong>.</p>
    <p>Identificada como <strong>CVE-2025-14733</strong>, a falha permite que invasores não autenticados executem código malicioso remotamente em dispositivos vulneráveis. A vulnerabilidade já havia sido marcada como explorada ativamente anteriormente, mas agora também foi associada a operações de ransomware.</p>
    <figure className="article-figure"><img src="/noticia-phishing.jpg" alt="Circuitos digitais da WatchGuard" /><figcaption>Imagem ilustrativa da WatchGuard.</figcaption></figure>
    <h2>1. O que é a CVE-2025-14733?</h2>
    <p>A CVE-2025-14733 é uma vulnerabilidade relacionada a uma falha de <strong>escrita fora dos limites de memória (out-of-bounds write)</strong>.</p>
    <p>O problema pode permitir que um invasor não autenticado execute código malicioso remotamente, e a exploração é considerada de baixa complexidade. A vulnerabilidade afeta equipamentos executando diferentes versões do <strong>Fireware OS</strong>, incluindo versões das famílias 11.x, 12.x e 2025.1.</p>
    <h2>2. Firewalls vulneráveis continuam expostos</h2>
    <p>A WatchGuard disponibilizou correções para a CVE-2025-14733 em dezembro de 2025. Na ocasião, a empresa informou que determinadas configurações envolvendo <strong>IKEv2 VPN</strong> poderiam deixar dispositivos Firebox sem atualização vulneráveis.</p>
    <p>A fabricante também confirmou que criminosos já estavam explorando a vulnerabilidade e publicou indicadores de comprometimento para ajudar clientes a identificar possíveis invasões. Mesmo meses depois da disponibilização das correções, equipamentos vulneráveis continuavam acessíveis pela internet.</p>
    <p>O grupo de monitoramento Shadowserver havia identificado <strong>mais de 115 mil firewalls Firebox sem correção expostos online</strong> em dezembro. Cerca de nove meses depois, <strong>quase 9 mil instâncias ainda permaneciam sem proteção</strong>, segundo os dados citados pela matéria.</p>
    <h2>3. CISA confirma uso da vulnerabilidade por ransomware</h2>
    <p>A situação ganhou uma nova dimensão após uma atualização da CISA em seu catálogo de vulnerabilidades conhecidas e exploradas, o <strong>Known Exploited Vulnerabilities (KEV)</strong>.</p>
    <p>A agência informou que a <strong>CVE-2025-14733 passou a ser conhecida por seu uso por grupos de ransomware</strong>. Até a publicação da matéria, porém, a CISA não havia divulgado detalhes adicionais sobre os ataques ou quais grupos estavam envolvidos.</p>
    <p>A vulnerabilidade já fazia parte do catálogo KEV desde dezembro, quando órgãos federais dos Estados Unidos receberam a determinação de proteger seus sistemas dentro do prazo estabelecido pela agência.</p>
    <h2>4. WatchGuard já enfrentou outras vulnerabilidades críticas</h2>
    <p>Esse não é o primeiro alerta envolvendo vulnerabilidades exploradas em produtos WatchGuard. Em setembro de 2025, a empresa corrigiu outra vulnerabilidade de execução remota de código, identificada como <strong>CVE-2025-9242</strong>, que também afetava firewalls Firebox e era muito semelhante à CVE-2025-14733.</p>
    <p>No mês seguinte, a CISA classificou aquela falha como explorada ativamente. Na época, o Shadowserver encontrou <strong>mais de 75 mil dispositivos Firebox vulneráveis</strong> acessíveis a possíveis ataques.</p>
    <h2>5. Alcance dos produtos WatchGuard</h2>
    <p>O impacto potencial dessas vulnerabilidades ganha relevância pela presença da WatchGuard no mercado corporativo. Segundo os dados apresentados na matéria, a empresa fornece serviços para <strong>mais de 250 mil pequenas e médias empresas</strong>, utilizando uma rede mundial com mais de <strong>17 mil revendedores e provedores de serviços de segurança</strong>.</p>
    <h2>6. Atualização dos equipamentos</h2>
    <p>Organizações que utilizam equipamentos WatchGuard Firebox afetados devem verificar a versão instalada do <strong>Fireware OS</strong> e aplicar as correções de segurança disponibilizadas pela fabricante.</p>
    <p>A WatchGuard também disponibilizou <strong>indicadores de comprometimento (IoCs)</strong> que podem ser utilizados para verificar sinais de exploração nos dispositivos. A confirmação do uso da vulnerabilidade por grupos de ransomware torna especialmente importante a atualização de equipamentos que ainda estejam executando versões vulneráveis.</p>
    <p className="article-source"><strong>Fonte:</strong> BleepingComputer<br /><strong>Matéria original:</strong> <em>CISA: WatchGuard RCE flaw now exploited in ransomware attacks</em><br /><strong>Autor:</strong> Sergiu Gatlan<br /><strong>Publicação:</strong> 10 de setembro de 2026.</p>
  </article></main>
}
