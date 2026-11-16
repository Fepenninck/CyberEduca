const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript')
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
const cache=new Map()
const aliases={'./template-simulation':'../components/activities/template-simulation.tsx','@/lib/simulation-scene':'../lib/simulation-scene.ts','./simulation-scene-editor':'../components/admin/simulation-scene-editor.tsx','../activities/template-simulation':'../components/activities/template-simulation.tsx','@/lib/admin-assessment':'../lib/admin-assessment.ts','@/lib/admin-collection':'../lib/admin-collection.ts','./list-toolbar':'../components/admin/list-toolbar.tsx','./assessment-editor':'../components/admin/assessment-editor.tsx'}
function carregar(relative){const file=path.resolve(__dirname,relative);if(cache.has(file))return cache.get(file);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const m={exports:{}};new Function('require','module','exports',compiled)(name=>name.endsWith('.css')?{}:aliases[name]?carregar(aliases[name]):require(name),m,m.exports);cache.set(file,m.exports);return m.exports}
const {validarQuestoesEditoriais,prepararQuestoesProva,prepararQuestoesSimulacao,separarContextoEditorial,juntarContextoEditorial}=carregar('../lib/admin-assessment.ts')
const boa={enunciado:'Pergunta de teste',tipo:'MULTIPLA_ESCOLHA',contexto:'Título do cenário\nLinha 1\nLinha 2',explicacao:'Explicação',alternativas:[{texto:'Resposta correta',isCorreta:true},{texto:'Outra resposta',isCorreta:false}]}
assert.equal(validarQuestoesEditoriais([],false),null)
assert.equal(validarQuestoesEditoriais([],true).indice,0)
assert.equal(validarQuestoesEditoriais([boa],true,true),null)
assert.ok(validarQuestoesEditoriais([{...boa,alternativas:boa.alternativas.map(a=>({...a,isCorreta:true}))}]))
assert.ok(validarQuestoesEditoriais([{...boa,enunciado:'  '}]))
assert.ok(validarQuestoesEditoriais([{...boa,alternativas:[boa.alternativas[0]]}]))
assert.ok(validarQuestoesEditoriais([{...boa,explicacao:''}],true,true))
assert.equal(validarQuestoesEditoriais([...Array(5).fill(boa),{...boa,enunciado:''}]).indice,5)
const antes=JSON.stringify(boa)
assert.equal(prepararQuestoesProva([boa])[0].alternativas.filter(a=>a.isCorreta).length,1)
assert.equal(prepararQuestoesSimulacao([boa])[0].contexto,boa.contexto)
assert.deepEqual(prepararQuestoesProva([{...boa,tipo:'DISSERTATIVA'}])[0].alternativas,[])
assert.equal(JSON.stringify(boa),antes,'Preparação não deve modificar os objetos em edição')
const contexto=separarContextoEditorial(boa.contexto)
assert.equal(juntarContextoEditorial(contexto.titulo,contexto.texto),boa.contexto)
const ui=carregar('../components/admin/assessment-editor.tsx')
const nove=Array.from({length:9},(_,i)=>({...boa,enunciado:`Pergunta ${i+1}`}))
const cards=renderToStaticMarkup(React.createElement(ui.QuestoesRascunhoEditor,{value:nove,onChange:()=>{}}))
assert.equal((cards.match(/class="admin-draft-question-heading"/g)||[]).length,4)
assert.ok(!cards.includes('Pergunta 5'))
assert.ok(!cards.includes('Alternativas de resposta'),'Questões devem iniciar recolhidas')
const preview=renderToStaticMarkup(React.createElement(ui.PreviaAvaliacao,{titulo:'Avaliação',descricao:'Orientações',questoes:nove}))
assert.equal((preview.match(/class="admin-question-preview"/g)||[]).length,4)
assert.ok(!preview.includes('data-correct="true"'),'Gabarito deve iniciar oculto na prévia')
const comGabarito=renderToStaticMarkup(React.createElement(ui.PreviaQuestaoEditorial,{questao:boa,numero:1,gabarito:true}))
assert.equal((comGabarito.match(/data-correct="true"/g)||[]).length,1)
for(const [arquivo,nome,props] of [['formulario-quiz','FormularioQuiz',{aulas:[]}],['formulario-prova','FormularioProva',{trilhas:[],initialValues:{titulo:'Título'}}],['formulario-simulacao','FormularioSimulacao',{categorias:[],initialValues:{titulo:'Título',questoes:nove}}]]){const Componente=carregar(`../components/admin/${arquivo}.tsx`)[nome];const html=renderToStaticMarkup(React.createElement(Componente,{...props,onSubmit:async()=>{}}));assert.ok(html.includes('Pré-visualização'));assert.ok(!html.includes('"isCorreta"'));assert.ok(!html.includes('font-mono'))}
console.log('Avaliações: campos legíveis, prévias, gabaritos, paginação, validação de questões e preservação dos dados verificados.')
if(process.argv.includes('--banco')){require('../../backend/node_modules/dotenv').config({path:path.resolve(__dirname,'../../backend/.env'),quiet:true});const {PrismaClient}=require('../../backend/node_modules/@prisma/client');const prisma=new PrismaClient();(async()=>{try{const [quizzes,provas,simulacoes]=await Promise.all([prisma.quiz.findMany({select:{questoes:{include:{alternativas:true}}}}),prisma.prova.findMany({select:{questoes:{include:{alternativas:true}}}}),prisma.simulacao.findMany({select:{questoes:{include:{alternativas:true}}}})]);let questoes=0;for(const entidade of [...provas,...simulacoes])for(const item of entidade.questoes){const textoOriginal=JSON.stringify(item);const normalizada=prepararQuestoesSimulacao([item])[0];assert.equal(normalizada.enunciado,item.enunciado.trim());assert.equal(normalizada.contexto,item.contexto?.trim()??'');assert.equal(normalizada.alternativas.length,item.alternativas.length);normalizada.alternativas.forEach((a,i)=>assert.equal(a.isCorreta,item.alternativas[i].isCorreta));assert.equal(JSON.stringify(item),textoOriginal);questoes++}for(const quiz of quizzes)for(const item of quiz.questoes){const editor={...item,alternativas:item.alternativas.map(a=>({...a,isCorreta:a.correta}))};assert.equal(editor.enunciado,item.enunciado);editor.alternativas.forEach((a,i)=>assert.equal(a.isCorreta,item.alternativas[i].correta));questoes++}console.log(JSON.stringify({quizzes:quizzes.length,provas:provas.length,simulacoes:simulacoes.length,questoesVerificadas:questoes,alteracoesNoBanco:0}));}finally{await prisma.$disconnect()}})().catch(error=>{console.error(error.message);process.exitCode=1})}

const scenes=carregar('../lib/simulation-scene.ts');
assert.equal(scenes.lerCenario('Texto original'),null);
assert.equal(scenes.lerCenario('{"formato":"cybereduca-simulation-scene-v1","modelo":"__proto__"}'),null);
assert.equal(scenes.lerCenario('{invalid'),null);
for(const modelo of Object.keys(scenes.modelosCenario)){
 const cena=scenes.criarCenario(modelo,boa.contexto);
 cena.conteudo='Conteudo personalizado <script>alert(1)</script>';
 const serialized=scenes.salvarCenario(cena);
 assert.deepEqual(scenes.lerCenario(serialized),cena);
 assert.equal(prepararQuestoesSimulacao([{...boa,contexto:serialized}])[0].contexto,serialized);
 const html=renderToStaticMarkup(React.createElement(ui.PreviaQuestaoEditorial,{questao:{...boa,contexto:serialized},numero:1}));
 assert.ok(html.includes('simulation-template'));
 assert.ok(html.includes('Conteudo personalizado'));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('cybereduca-simulation-scene-v1'));
 assert.ok(!html.includes('contextoAnterior'));
 const fields=carregar('../components/admin/simulation-scene-editor.tsx');
 const editor=renderToStaticMarkup(React.createElement(fields.SimulationSceneEditor,{value:serialized,onChange:()=>{}}));
 assert.ok(editor.includes('Modelo do cen'));
 assert.ok(!editor.includes('cybereduca-simulation-scene-v1'));
 assert.equal(scenes.lerCenario(serialized).contextoAnterior,boa.contexto);
}
console.log('Cenarios: tres modelos, persistencia no contrato existente, previa real, escape de conteudo e preservacao do cenario anterior verificados.');

const aluno=carregar('../components/activities/immersive-simulation.tsx');
for(const modelo of Object.keys(scenes.modelosCenario)){
 const questao=scenes.criarQuestaoCenario(modelo);
 assert.equal(validarQuestoesEditoriais([questao],true,true),null);
 const alternativas=questao.alternativas.map((a,i)=>({id:String(i),texto:a.texto}));
 const html=renderToStaticMarkup(React.createElement(aluno.ImmersiveSimulation,{title:'Titulo independente do modelo',category:'Contas e acesso',decision:{id:'q',enunciado:questao.enunciado,contexto:questao.contexto,alternativas},step:0,selected:'1',disabled:true,onChoose:()=>{}}));
 assert.ok(html.includes('simulation-template'));
 assert.ok(html.includes('aria-pressed="true"'));
 assert.ok(html.includes('disabled=""'));
 assert.ok(!html.includes('cybereduca-simulation-scene-v1'));
 assert.ok(!html.includes('isCorreta'));
 assert.ok(!html.includes('href='));
}
console.log('Aluno: modelo escolhido independe do titulo/categoria, selecao e bloqueio preservados, sem envio externo nem exposicao do gabarito.');
