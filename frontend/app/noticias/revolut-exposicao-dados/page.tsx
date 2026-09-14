import Link from 'next/link'
import { NewsHeader } from '@/components/news-header'
import { SiteFooter } from '@/components/site-footer'
import '../../article.css'
import '../../footer.css'

export default function RevolutExposureNewsPage() {
  return <main className="article-page"><NewsHeader /><article className="article-content">
    <nav className="article-breadcrumb" aria-label="Caminho da página"><Link href="/">Início</Link><span>•</span><Link href="/#noticias">Notícias</Link><span>•</span><span>Vazamento de dados</span></nav>
    <p className="article-category">Vazamento de dados <span>•</span> 12/09/2026</p>
    <h1>Revolut confirma exposição de dados sensíveis após solicitações falsas</h1>
    <p className="article-byline"><strong>Publicado em 12/09/2026</strong> <span>•</span> Fonte: Reuters <span>•</span> Reportagem de Sumedha Mukherjee</p>
    <p>A fintech britânica <a href="https://www.revolut.com/" target="_blank" rel="noreferrer">Revolut</a> confirmou que <strong>informações sensíveis de clientes foram divulgadas a um terceiro não autorizado</strong> após a empresa receber solicitações fraudulentas enviadas a partir do domínio legítimo de e-mail de uma agência governamental.</p>
    <p>Segundo a empresa, seus sistemas e o dinheiro dos clientes não foram afetados. O incidente, porém, envolveu informações pessoais e cópias de documentos de identidade.</p>
    <figure className="article-figure"><img src="/noticia-revolut.png" alt="Logotipo da Revolut na tela de um celular" /><figcaption>Imagem ilustrativa da Revolut.</figcaption></figure>
    <h2>1. O que aconteceu?</h2>
    <p>De acordo com a Reuters, a Revolut recebeu <strong>solicitações fraudulentas que aparentavam ter origem legítima</strong>, pois foram enviadas utilizando o domínio de e-mail verdadeiro de uma agência governamental. A partir dessas solicitações, informações de clientes acabaram sendo fornecidas a uma pessoa não autorizada.</p>
    <p>O caso se diferencia de uma invasão tradicional porque, segundo as informações divulgadas, não houve comprometimento dos sistemas internos da Revolut. O incidente envolveu o uso de solicitações fraudulentas para obter informações.</p>
    <p>Após identificar o problema, a Revolut afirmou ter <strong>bloqueado o endereço envolvido</strong> e alertado a agência governamental relacionada ao caso. Autoridades policiais, órgãos de proteção de dados e reguladores financeiros também foram comunicados.</p>
    <h2>2. Quais informações foram comprometidas?</h2>
    <p>Segundo um relatório do TechCrunch citado pela Reuters, os dados expostos incluíam:</p>
    <ul className="article-version-list"><li>data de nascimento;</li><li>endereço residencial;</li><li>endereço de e-mail;</li><li>número de telefone;</li><li>cópias de passaportes;</li><li>cópias de carteiras de motorista.</li></ul>
    <p>A presença de documentos de identidade torna o incidente especialmente sensível, já que essas informações podem ser utilizadas em tentativas posteriores de fraude e falsificação de identidade.</p>
    <h2>3. Sistemas e dinheiro dos clientes não foram afetados</h2>
    <p>A Revolut afirmou que <strong>seus sistemas e os fundos mantidos pelos clientes não foram afetados pelo incidente</strong>. Não havia indicação de que criminosos tivessem obtido acesso direto às contas bancárias ou retirado dinheiro de clientes como consequência do caso.</p>
    <p>A empresa, entretanto, <strong>não informou o número exato de pessoas afetadas</strong> pela exposição dos dados.</p>
    <h2>4. O risco após a exposição dos dados</h2>
    <p>Mesmo sem acesso direto ao dinheiro dos clientes, informações como nome, telefone, endereço, data de nascimento e documentos de identidade podem ser valiosas para criminosos.</p>
    <p>Esses dados podem ser utilizados para criar <strong>golpes mais convincentes e personalizados</strong>, nos quais o criminoso utiliza informações verdadeiras da vítima para tentar conquistar sua confiança. Também podem aumentar o risco de falsificação de identidade e outros tipos de fraude.</p>
    <p>Por isso, clientes potencialmente envolvidos devem prestar atenção especial a mensagens, ligações ou e-mails inesperados que solicitem senhas, códigos de autenticação ou outras informações confidenciais.</p>
    <h2>5. Revolut planeja possível abertura de capital</h2>
    <p>O incidente acontece enquanto a Revolut avalia uma possível <strong>oferta pública inicial de ações (IPO)</strong>. Segundo informações citadas pela Reuters, a fintech estaria buscando uma avaliação de até <strong>US$ 200 bilhões</strong> em uma eventual abertura de capital.</p>
    <p>A Revolut se tornou uma das fintechs europeias de maior destaque e opera de maneira predominantemente digital, sem uma rede tradicional de agências bancárias físicas.</p>
    <h2>6. Investigação e comunicação às autoridades</h2>
    <p>Após detectar a divulgação não autorizada, a Revolut informou ter comunicado o ocorrido às autoridades responsáveis. Além da agência governamental relacionada ao endereço utilizado nas solicitações fraudulentas, foram alertados <strong>órgãos policiais, autoridades de proteção de dados e reguladores financeiros</strong>.</p>
    <p>Até a publicação da matéria, a empresa não havia divulgado publicamente quantos clientes tiveram informações comprometidas.</p>
    <p className="article-source"><strong>Fonte:</strong> Reuters<br /><strong>Matéria original:</strong> <em>Revolut confirms sensitive customer data breach, falling for fake government requests</em><br /><strong>Reportagem:</strong> Sumedha Mukherjee<br /><strong>Edição:</strong> Philippa Fletcher<br /><strong>Publicação:</strong> 12 de setembro de 2026.</p>
  </article><SiteFooter /></main>
}
