const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const source = fs.readFileSync(path.join(__dirname, '../lib/admin-dashboard.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const moduleObject = { exports: {} }
new Function('exports', 'module', compiled)(moduleObject.exports, moduleObject)
const { diaLocal, diasDoPeriodo, filtrarPeriodo, mediaNotas, resumirAtividades, situacaoNota, contarAlunosAtivos } = moduleObject.exports
const agora = new Date('2026-11-15T15:00:00Z')
assert.equal(diaLocal('2026-11-15T01:00:00Z'), '2026-11-14', 'Agrupa pelo dia de Brasília')
const dias = diasDoPeriodo(7, agora)
assert.equal(dias.length, 7)
assert.equal(dias[0], '2026-11-09')
assert.equal(dias[6], '2026-11-15')
assert.deepEqual(diasDoPeriodo(3, new Date('2026-01-01T15:00:00Z')), ['2025-12-30', '2025-12-31', '2026-01-01'])
const registros = [{ criadoEm: '2026-11-09T02:59:00Z' }, { criadoEm: '2026-11-09T03:00:00Z' }, { criadoEm: '2026-11-15T14:00:00Z' }, { criadoEm: '2026-11-15T16:00:00Z' }, { criadoEm: 'invalida' }]
assert.deepEqual(filtrarPeriodo(registros, dias, agora), [registros[1], registros[2]], 'Exclui dias fora do período, datas futuras e inválidas')
assert.equal(mediaNotas([]), null, 'Ausência de resultados não é zero')
assert.equal(mediaNotas([{ acertos: 0, totalQuestoes: 0 }]), null)
assert.equal(mediaNotas([{ acertos: 1, totalQuestoes: 2 }, { acertos: 10, totalQuestoes: 10 }]), 75, 'Média por resultado, independente do tamanho da prova')
assert.equal(mediaNotas([{ acertos: 0, totalQuestoes: 10 }]), 0, 'Preserva notas reais iguais a zero')
assert.equal(mediaNotas([{ acertos: 11, totalQuestoes: 10 }]), null)
const serie = resumirAtividades([{ criadoEm: '2026-11-15T01:00:00Z' }], [{ criadoEm: '2026-11-15T14:00:00Z' }], [], dias)
assert.equal(serie[5].provas, 1)
assert.equal(serie[6].simulacoes, 1)
assert.equal(serie[0].provas, 0)
console.log('Dashboard: filtros, fuso horário, agregações e médias verificados.')

assert.equal(situacaoNota(null).tom, 'neutral')
assert.equal(situacaoNota(NaN).tom, 'neutral')
assert.equal(situacaoNota(0).tom, 'danger')
assert.equal(situacaoNota(39.99).tom, 'danger')
assert.equal(situacaoNota(40).tom, 'warning')
assert.equal(situacaoNota(69.99).tom, 'warning')
assert.equal(situacaoNota(70).tom, 'success')
assert.equal(situacaoNota(100).tom, 'success')
assert.equal(mediaNotas([{ acertos: Infinity, totalQuestoes: Infinity }]), null)
const usuarios = [{ id: 'a', papel: 'USUARIO' }, { id: 'b', papel: 'ALUNO' }, { id: 'admin', papel: 'ADMIN' }]
assert.equal(contarAlunosAtivos(usuarios, [{ usuario: { id: 'a' } }, { usuario: { id: 'a' } }, { usuario: { id: 'b' } }, { usuario: { id: 'admin' } }, { usuario: { id: 'removido' } }]), 2)
assert.equal(contarAlunosAtivos(usuarios, []), 0)
console.log('Dashboard: cores nas faixas de 40% e 70%, notas invalidas e alunos unicos verificados.')

const { taxaAprovacao, lerFiltroResultadosDashboard, linkResultadosDashboard } = moduleObject.exports;
assert.equal(taxaAprovacao([]), null);
assert.equal(taxaAprovacao([{aprovado:null},{}]), null);
assert.equal(taxaAprovacao([{aprovado:true},{aprovado:false},{aprovado:null}]),50);
assert.equal(taxaAprovacao([{aprovado:false}]),0);
const comAtividades = resumirAtividades([],[],[],dias,[{criadoEm:'2026-11-15T01:00:00Z'}],[{criadoEm:'2026-11-15T14:00:00Z'}]);
assert.equal(comAtividades[5].aulas,1);
assert.equal(comAtividades[6].acessos,1);
assert.equal(lerFiltroResultadosDashboard('?dias=999&ate=erro'),null);
assert.equal(lerFiltroResultadosDashboard('?dias=30'),null);
const alternativasFaixa=[{acertos:0,totalQuestoes:10,criadoEm:'2026-11-15T12:00:00Z'},{acertos:4,totalQuestoes:10,criadoEm:'2026-11-15T12:00:00Z'},{acertos:7,totalQuestoes:10,criadoEm:'2026-11-15T12:00:00Z'},{acertos:10,totalQuestoes:10,criadoEm:'2026-10-01T12:00:00Z'},{acertos:8,totalQuestoes:10,criadoEm:'2026-11-16T12:00:00Z'}];
for(const tom of ['warning','success','danger']){
 const url=new URL(linkResultadosDashboard(tom,7,agora),'http://localhost');
 assert.equal(url.hash,'#provas');assert.equal(url.searchParams.get('faixa'),tom);
 const filtro=lerFiltroResultadosDashboard(url.search);
 assert.deepEqual(filtro,{dias:7,ate:agora.toISOString()});
 const filtrados=filtrarPeriodo(alternativasFaixa,diasDoPeriodo(filtro.dias,new Date(filtro.ate)),new Date(filtro.ate)).filter(item=>situacaoNota(mediaNotas([item])).tom===url.searchParams.get('faixa'));
 assert.equal(filtrados.length,1,'O link deve manter a faixa e o periodo do card, sem incluir resultados futuros');
}
console.log('Dashboard: aprovacao, aulas, acessos e links com filtros por faixa e periodo verificados.');
