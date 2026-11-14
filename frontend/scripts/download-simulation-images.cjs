const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
// Separate photo collection for simulations. No source is shared with learning paths.
const photos = [
 ['acesso-desconhecido', 'photo-1667453466805-75bbf36e8707', 'a-person-holding-a-phone-Uw_8vSroCSc', 'Onur Binay'],
 ['permissoes-equipe', 'photo-1762340275855-ae8f4c2c144e', 'account-preferences-screen-with-verification-prompt-hvbjTynPt7A', 'Zulfugar Karimov'],
 ['instalar-apps', 'photo-1651235732694-0d057ace2f30', 'a-screenshot-of-a-phone-RMIsZlv8qv4', 'Ed Hardie'],
 ['arquivo-bloqueado', 'photo-1642783327704-2500e96fe3d9', 'a-dell-laptop-computer-with-a-red-screen-1C5F88Af9ZU', 'Ed Hardie'],
 ['publicar-foto', 'photo-1774535852012-0c634d8f2da0', 'papers-and-documents-scattered-on-the-floor-YkcFA_tMNrA', 'Paige Prevost'],
 ['pasta-privada', 'photo-1786911354420-3495e4728c03', 'paper-documents-on-white-shelf-cwKwug-yyXM', 'Hansheng Zhao'],
 ['wifi-publico', 'photo-1563168206-f0f627c83ca8', 'free-wifi-print-board-KRAk_61pgTo', 'Paul Hanaoka'],
 ['rede-equipe', 'flagged/photo-1579274216947-86eaa4b00475', 'https://unsplash.com/s/photos/network-server', null],
 ['depois-clique', 'photo-1674049405160-9b800f5645f5', 'a-person-wearing-a-mask-using-a-laptop-56CjIvG10lo', 'Bermix Studio'],
 ['triagem', 'photo-1742072594105-1efb79e6dd18', 'programming-code-is-shown-in-a-colorful-display-8l_9yVcKiJE', 'Peaky Frames'],
 ['codigo-autorizacao', 'photo-1607799279861-4dd421887fb3', 'laptop-screen-displaying-colorful-code-8qEB0fTe9Vw', 'Mohammad Rahmani'],
 ['codigo-consulta', 'photo-1569748130764-3fed0c102c59', 'a-computer-screen-with-a-bunch-of-code-on-it-1HCb2gPk3ik', 'Fili Santillan'],
 ['email', 'photo-1596526131083-e8c633c948d2', 'closeup-of-mail-app-icon-on-phone-LPZy4da9aRo', 'Brett Jordan'],
 ['sms', 'photo-1720069004713-f72d26684a87', 'a-close-up-of-a-cell-phone-with-a-keyboard-qbwGUYHiYnI', 'Samuel Angor'],
 ['social', 'photo-1762330466873-9a7dba6135b4', 'instagram-login-screen-with-username-and-password-fields-sVswkI_MQUo', 'Zulfugar Karimov'],
 ['site', 'photo-1774898989484-0b9becf69efb', 'a-padlock-rests-on-a-computer-keyboard-QP7RBa5r8HM', 'Sasun Bughdaryan'],
];
async function main() {
 const directory = path.resolve(__dirname, '../public/images/simulacoes');
 const learningPaths = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../lib/course-images.json'), 'utf8'));
 const oldIds = new Set(Object.values(learningPaths).map(item => item.source.slice(-11)));
 for (const [, , source] of photos) if (oldIds.has(source.slice(-11))) throw new Error('A photo is already used in learning paths.');
 fs.mkdirSync(directory, { recursive: true });
 const images = {};
 for (let index = 0; index < photos.length; index += 3) await Promise.all(photos.slice(index, index + 3).map(async ([name, asset, source, author]) => {
  const url = `https://images.unsplash.com/${asset}?auto=format&fit=crop&w=900&h=540&q=82&fm=jpg`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Image unavailable: ${name} (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 5000 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error(`Invalid photo: ${name}`);
  fs.writeFileSync(path.join(directory, `${name}.jpg`), bytes);
  images[name] = { src: `/images/simulacoes/${name}.jpg`, source: source.startsWith('https:') ? source : `https://unsplash.com/photos/${source}`, image: url, author, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  console.log(`Photo saved: ${name}`);
 }));
 if (new Set(Object.values(images).map(item => item.sha256)).size !== photos.length) throw new Error('Duplicate photos detected.');
 fs.writeFileSync(path.join(directory, 'creditos.json'), JSON.stringify({ license: 'https://unsplash.com/license', images }, null, 2) + '\n');
 console.log(`${photos.length} exclusive simulation photos saved.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });