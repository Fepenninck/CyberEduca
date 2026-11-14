const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const photos = [
  ['cd24b773-00b6-4750-9e38-c1a332554275', 'dados', 'a-golden-padlock-sitting-on-top-of-a-keyboard-FnA5pAzqhMM', 'Proteção de dados representada por um cadeado sobre um teclado.'],
  ['biblioteca-contas', 'contas', 'a-combination-lock-rests-on-a-computer-keyboard-WUJmdr8pNwk', 'Cadeado com combinação sobre um teclado, representando a proteção das contas.'],
  ['biblioteca-dispositivos', 'dispositivos', 'a-person-sitting-at-a-desk-with-two-laptops-1ZHvbXBNwaI', 'Celular e computador em uma mesa de trabalho.'],
  ['biblioteca-backup', 'copias', 'external-hard-drive-connected-to-a-laptop-MBVBzp8WH4E', 'Unidade externa conectada a um computador para guardar arquivos.'],
  ['biblioteca-redes', 'redes', 'a-close-up-of-a-network-with-wires-connected-to-it-dyUp7WPu5q4', 'Cabos conectados a um equipamento de rede.'],
  ['biblioteca-privacidade', 'privacidade', 'brown-padlock-on-black-computer-keyboard-FGH69mi53Mw', 'Cadeado sobre um teclado, representando a privacidade das informações.'],
  ['biblioteca-malware', 'malware', 'security-privacy-and-performance-status-with-fix-options-7Og0reGku4M', 'Tela de um programa de proteção mostrando verificações de segurança.'],
  ['biblioteca-remoto-ia', 'remoto', 'person-using-laptop-LCun3uxh-z0', 'Pessoa trabalhando em um computador portátil em casa.'],
  ['biblioteca-acesso', 'acesso', 'an-unlocked-padlock-rests-on-a-computer-keyboard-KdCJ1nIkgOU', 'Cadeado aberto sobre um teclado, representando decisões de acesso.'],
  ['biblioteca-configuracao', 'configuracao', 'a-close-up-of-a-server-in-a-server-room-vSprjjDbu60', 'Equipamentos em uma sala de servidores.'],
  ['biblioteca-desenvolvimento', 'codigo', 'code-is-displayed-on-a-computer-monitor-zUrEj_OwLQM', 'Código de programação exibido em um monitor.'],
  ['biblioteca-deteccao', 'analise', 'a-computer-screen-with-a-bunch-of-code-on-it-ieic5Tq8YMk', 'Tela com registros e código para análise técnica.'],
  ['9b98b7a6-5c4d-4e3f-8a2b-1c0d9e8f7a61', 'intermediario', 'a-network-switch-with-ethernet-cables-connected-vE5AKQRUs7c', 'Conexões de rede em um equipamento de comunicação.'],
];
function contentId(key) {
  const bytes = crypto.createHash('sha256').update(`cybereduca-library-v1:${key}`).digest();
  bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.subarray(0, 16).toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
async function main() {
  const directory = path.resolve(__dirname, '../public/images/trilhas');
  fs.mkdirSync(directory, { recursive: true });
  const manifest = {};
  // Três downloads por vez para não sobrecarregar o provedor.
  for (let start = 0; start < photos.length; start += 3) {
    await Promise.all(photos.slice(start, start + 3).map(async ([key, name, slug, alt]) => {
      const source = `https://unsplash.com/photos/${slug}`;
      const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Página indisponível: ${name}`);
      const html = await response.text();
      const match = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      if (!match) throw new Error(`Imagem não encontrada: ${name}`);
      const url = new URL(match[1].replaceAll('&amp;', '&'));
      url.search = new URLSearchParams({ auto: 'format', fit: 'crop', w: '900', h: '500', q: '82', fm: 'jpg' }).toString();
      const image = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!image.ok || !image.headers.get('content-type')?.startsWith('image/')) throw new Error(`Download inválido: ${name}`);
      fs.writeFileSync(path.join(directory, `${name}.jpg`), Buffer.from(await image.arrayBuffer()));
      manifest[key.startsWith('biblioteca-') ? contentId(key) : key] = { src: `/images/trilhas/${name}.jpg`, alt, source };
      console.log(`Imagem salva: ${name}`);
    }));
  }
  manifest['6a7b8c9d-0e1f-4a2b-9c3d-5e6f70819203'] = { ...manifest[contentId('biblioteca-configuracao')] };
  fs.writeFileSync(path.resolve(__dirname, '../lib/course-images.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'creditos.json'), JSON.stringify({ license: 'https://unsplash.com/license', images: manifest }, null, 2) + '\n');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
