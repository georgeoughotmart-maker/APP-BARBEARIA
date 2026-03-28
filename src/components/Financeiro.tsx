import { useState } from 'react';
import { Agendamento, Transacao } from '../lib/store';
import { fmtMoeda } from '../lib/utils';
import { useToast } from '../lib/ToastContext';
import { Plus, X, CreditCard } from 'lucide-react';

export function Financeiro({ store }: { store: any }) {
  const { agendamentos, ganhos, setGanhos, custos, setCustos } = store;
  const { showToast } = useToast();

  const [ganhoDesc, setGanhoDesc] = useState('');
  const [ganhoValor, setGanhoValor] = useState('');
  const [custoDesc, setCustoDesc] = useState('');
  const [custoValor, setCustoValor] = useState('');

  const totalG = ganhos.reduce((a: number, b: Transacao) => a + (+b.valor || 0), 0)
    + agendamentos.filter((a: Agendamento) => a.status === 'concluido').reduce((a: number, b: Agendamento) => a + (+b.valor || 0), 0);
  const totalC = custos.reduce((a: number, b: Transacao) => a + (+b.valor || 0), 0);
  const saldo = totalG - totalC;

  const addGanho = () => {
    const desc = ganhoDesc.trim();
    const valor = parseFloat(ganhoValor);
    if (!desc) { showToast('Informe a descrição', 'err'); return; }
    if (!valor || valor <= 0) { showToast('Informe um valor válido', 'err'); return; }
    
    setGanhos([...ganhos, { id: crypto.randomUUID(), desc, valor }]);
    setGanhoDesc('');
    setGanhoValor('');
    showToast('Ganho adicionado!');
  };

  const addCusto = () => {
    const desc = custoDesc.trim();
    const valor = parseFloat(custoValor);
    if (!desc) { showToast('Informe a descrição', 'err'); return; }
    if (!valor || valor <= 0) { showToast('Informe um valor válido', 'err'); return; }
    
    setCustos([...custos, { id: crypto.randomUUID(), desc, valor }]);
    setCustoDesc('');
    setCustoValor('');
    showToast('Custo adicionado!');
  };

  const removerGanho = (id: string) => {
    setGanhos(ganhos.filter((g: Transacao) => g.id !== id));
    showToast('Removido', 'info');
  };

  const removerCusto = (id: string) => {
    setCustos(custos.filter((c: Transacao) => c.id !== id));
    showToast('Removido', 'info');
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold">💰 <span className="text-gold">Financeiro</span></h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[600px] mb-7">
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-dark to-gold-light" />
          <div className="text-[11px] tracking-[1.5px] uppercase text-text-muted">Total ganhos</div>
          <div className="text-2xl font-semibold mt-1.5 text-green">{fmtMoeda(totalG)}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-dark to-gold-light" />
          <div className="text-[11px] tracking-[1.5px] uppercase text-text-muted">Total custos</div>
          <div className="text-2xl font-semibold mt-1.5 text-red">{fmtMoeda(totalC)}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-dark to-gold-light" />
          <div className="text-[11px] tracking-[1.5px] uppercase text-text-muted">Saldo</div>
          <div className={`text-2xl font-semibold mt-1.5 ${saldo >= 0 ? 'text-green' : 'text-red'}`}>{fmtMoeda(saldo)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* GANHOS */}
        <div>
          <div className="flex items-center gap-2.5 mb-3.5 text-[13px] font-bold tracking-[1px] uppercase text-green">
            ✅ Ganhos
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 mb-3.5">
            <div className="flex flex-col gap-1.5 mb-2.5">
              <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Descrição</label>
              <input 
                value={ganhoDesc} onChange={e => setGanhoDesc(e.target.value)}
                className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                placeholder="Ex: corte + barba"
              />
            </div>
            <div className="flex flex-col gap-1.5 mb-3.5">
              <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Valor (R$)</label>
              <input 
                type="number" min="0" step="0.01"
                value={ganhoValor} onChange={e => setGanhoValor(e.target.value)}
                className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                placeholder="0,00"
              />
            </div>
            <button onClick={addGanho} className="bg-gradient-to-br from-gold-dark to-gold text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all w-full flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar ganho
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {ganhos.length === 0 ? (
              <div className="text-center py-6 px-6 text-text-muted text-sm">
                <CreditCard className="w-6 h-6 mx-auto mb-2 opacity-50" />
                Nenhum ganho registrado
              </div>
            ) : (
              ganhos.map((g: Transacao) => (
                <div key={g.id} className="flex items-center justify-between p-3.5 rounded-lg bg-surface2 border border-border hover:border-gold/30 transition-colors">
                  <div className="font-semibold text-[15px]">{g.desc}</div>
                  <div className="flex items-center gap-2.5">
                    <div className="font-semibold text-base text-green whitespace-nowrap">+{fmtMoeda(g.valor)}</div>
                    <button onClick={() => removerGanho(g.id)} className="bg-red/10 text-red border border-red/20 p-1.5 rounded hover:bg-red/20 transition-colors" title="Remover">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CUSTOS */}
        <div>
          <div className="flex items-center gap-2.5 mb-3.5 text-[13px] font-bold tracking-[1px] uppercase text-red">
            ❌ Custos / Despesas
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 mb-3.5">
            <div className="flex flex-col gap-1.5 mb-2.5">
              <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Descrição</label>
              <input 
                value={custoDesc} onChange={e => setCustoDesc(e.target.value)}
                className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                placeholder="Ex: produto, aluguel..."
              />
            </div>
            <div className="flex flex-col gap-1.5 mb-3.5">
              <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Valor (R$)</label>
              <input 
                type="number" min="0" step="0.01"
                value={custoValor} onChange={e => setCustoValor(e.target.value)}
                className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                placeholder="0,00"
              />
            </div>
            <button onClick={addCusto} className="bg-gradient-to-br from-[#8b2020] to-[#e05555] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all w-full flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar custo
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {custos.length === 0 ? (
              <div className="text-center py-6 px-6 text-text-muted text-sm">
                <CreditCard className="w-6 h-6 mx-auto mb-2 opacity-50" />
                Nenhum custo registrado
              </div>
            ) : (
              custos.map((c: Transacao) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 rounded-lg bg-surface2 border border-border hover:border-gold/30 transition-colors">
                  <div className="font-semibold text-[15px]">{c.desc}</div>
                  <div className="flex items-center gap-2.5">
                    <div className="font-semibold text-base text-red whitespace-nowrap">-{fmtMoeda(c.valor)}</div>
                    <button onClick={() => removerCusto(c.id)} className="bg-red/10 text-red border border-red/20 p-1.5 rounded hover:bg-red/20 transition-colors" title="Remover">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
