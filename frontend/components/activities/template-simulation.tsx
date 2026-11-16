"use client";
import { useState } from 'react';
import type { CenarioSimulacao } from '@/lib/simulation-scene';
import './template-simulation.css';

export function TemplateSimulation({ cenario, alternativas = [], selected, disabled = false, onChoose }: {
  cenario: CenarioSimulacao; alternativas?: { id: string; texto: string }[];
  selected?: string; disabled?: boolean; onChoose?: (id: string) => void;
}) {
  const [local, setLocal] = useState<string>();
  const escolha = onChoose ? selected : local;
  return <section className="simulation-template" data-modelo={cenario.modelo}>
    <div className="simulation-template-mission"><strong>{cenario.titulo}</strong><small>Ambiente de simulação · As ações acontecem somente nesta atividade.</small></div>
    <div className="simulation-template-window">
      <header>{cenario.modelo === 'EMAIL' ? 'Caixa de entrada / E-mail' : cenario.modelo === 'MENSAGEM' ? 'Mensagens' : 'Navegador'}<span>Simulação</span></header>
      {cenario.modelo === 'SITE' ? <div className="simulation-template-address">{cenario.endereco || 'Endereço da página'}</div> : <dl><div><dt>De</dt><dd>{cenario.remetente}</dd></div><div><dt>Para</dt><dd>{cenario.destinatario}</dd></div></dl>}
      <div className="simulation-template-content">
        <h3>{cenario.assunto}</h3><p>{cenario.conteudo}</p>
        {cenario.modelo !== 'SITE' && cenario.endereco && <div className="simulation-template-link">{cenario.endereco}</div>}
        {cenario.anexo && <div className="simulation-template-attachment">Anexo: {cenario.anexo}</div>}
      </div>
      {alternativas.length > 0 && <div className="simulation-template-actions" aria-label="Ações no cenário">{alternativas.map(item => <button key={item.id} type="button" disabled={disabled} aria-pressed={escolha === item.id} onClick={() => onChoose ? onChoose(item.id) : setLocal(item.id)}>{item.texto || 'Preencha esta ação no editor'}</button>)}</div>}
    </div>
    {escolha && <p className="simulation-template-receipt" role="status">Ação selecionada: {alternativas.find(item => item.id === escolha)?.texto}</p>}
  </section>;
}
