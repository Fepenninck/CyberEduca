"use client";
import { criarCenario, lerCenario, salvarCenario, modelosCenario, type ModeloCenario, type CenarioSimulacao } from '@/lib/simulation-scene';
export function SimulationSceneEditor({ value = '', onChange }: { value?: string; onChange: (value: string) => void }) {
  const cenario = lerCenario(value);
  function alterar(campo: keyof CenarioSimulacao, texto: string) { if (cenario) onChange(salvarCenario({ ...cenario, [campo]: texto })); }
  const campos: { campo: keyof CenarioSimulacao; label: string; max: number }[] = [
    { campo:'titulo',label:'Orientação do cenário',max:200 },
    ...(cenario?.modelo !== 'SITE' ? [{ campo:'remetente' as const,label:'Remetente',max:200 },{ campo:'destinatario' as const,label:'Destinatário',max:200 }] : []),
    { campo:'assunto',label:cenario?.modelo === 'SITE' ? 'Título da página' : 'Assunto / título da mensagem',max:200 },
    { campo:'endereco',label:cenario?.modelo === 'SITE' ? 'Endereço exibido no navegador' : 'Link apresentado na mensagem',max:500 },
    ...(cenario?.modelo === 'EMAIL' ? [{ campo:'anexo' as const,label:'Nome do anexo (opcional)',max:200 }] : []),
  ];
  return <div className="admin-question-fields"><label className="admin-editor-field">Modelo do cenário<select className="admin-control" value={cenario?.modelo ?? 'LEGADO'} onChange={event => onChange(event.target.value === 'LEGADO' ? cenario?.contextoAnterior ?? '' : salvarCenario(cenario ? {...cenario, modelo:event.target.value as ModeloCenario} : criarCenario(event.target.value as ModeloCenario,value)))}><option value="LEGADO">Cenário atual / texto livre</option>{Object.entries(modelosCenario).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    {cenario ? <><p className="admin-form-help">Edite o modelo abaixo. As alternativas da questão serão as ações disponíveis ao aluno.</p><div className="admin-field-grid">{campos.map(({campo,label,max}) => <label key={campo}>{label}<input className="admin-control" maxLength={max} value={cenario[campo]} onChange={event => alterar(campo,event.target.value)} /></label>)}</div><label className="admin-editor-field">Conteúdo do cenário<textarea className="admin-control" rows={6} maxLength={4000} value={cenario.conteudo} onChange={event => alterar('conteudo',event.target.value)} /></label></> : <label className="admin-editor-field">Situação apresentada ao aluno<textarea className="admin-control" rows={5} maxLength={8000} value={value} onChange={event => onChange(event.target.value)} /></label>}
  </div>;
}
