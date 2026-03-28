import { useState } from 'react';
import { Agendamento } from '../lib/store';
import { fmtData, fmtMoeda } from '../lib/utils';
import { useToast } from '../lib/ToastContext';
import { Inbox, Plus, Check, Pencil, X } from 'lucide-react';

export function Agenda({ store }: { store: any }) {
  const { agendamentos, setAgendamentos, config } = store;
  const [filtro, setFiltro] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    cliente: '',
    servico: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    hora: '',
    obs: '',
    status: 'pendente'
  });

  const servicos = (config.servicos || 'Corte\nBarba\nCorte + Barba\nPezinho\nSobrancelha').split('\n').filter(Boolean);

  let lista = [...agendamentos];
  if (filtro !== 'todos') lista = lista.filter(a => (a.status || 'pendente') === filtro);
  lista.sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));

  const abrirModal = (ag?: Agendamento) => {
    if (ag) {
      setEditandoId(ag.id);
      setFormData({
        cliente: ag.cliente,
        servico: ag.servico,
        valor: ag.valor ? String(ag.valor) : '',
        data: ag.data,
        hora: ag.hora || '',
        obs: ag.obs || '',
        status: ag.status || 'pendente'
      });
    } else {
      setEditandoId(null);
      setFormData({
        cliente: '',
        servico: servicos[0] || '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        hora: '',
        obs: '',
        status: 'pendente'
      });
    }
    setModalOpen(true);
  };

  const salvarAgendamento = () => {
    if (!formData.cliente.trim()) { showToast('Informe o nome do cliente', 'err'); return; }
    if (!formData.data) { showToast('Informe a data', 'err'); return; }

    const ag = {
      id: editandoId || crypto.randomUUID(),
      cliente: formData.cliente.trim(),
      servico: formData.servico,
      valor: parseFloat(formData.valor) || 0,
      data: formData.data,
      hora: formData.hora,
      obs: formData.obs.trim(),
      status: formData.status as any
    };

    if (editandoId) {
      setAgendamentos(agendamentos.map((a: Agendamento) => a.id === editandoId ? ag : a));
      showToast('Agendamento atualizado!');
    } else {
      setAgendamentos([...agendamentos, ag]);
      showToast('Agendamento salvo!');
    }
    setModalOpen(false);
  };

  const concluirAg = (id: string) => {
    setAgendamentos(agendamentos.map((a: Agendamento) => a.id === id ? { ...a, status: 'concluido' } : a));
    showToast('Agendamento concluído!');
  };

  const removerAg = (id: string) => {
    if (!confirm('Remover este agendamento?')) return;
    setAgendamentos(agendamentos.filter((a: Agendamento) => a.id !== id));
    showToast('Agendamento removido', 'info');
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold">📅 <span className="text-gold">Agenda</span></h1>
        <button 
          onClick={() => abrirModal()}
          className="bg-gradient-to-br from-gold-dark to-gold text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Novo agendamento
        </button>
      </div>

      <div className="flex gap-2 mb-4.5 flex-wrap">
        {['todos', 'pendente', 'concluido', 'cancelado'].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filtro === f 
                ? 'bg-gold/15 border-gold text-gold' 
                : 'border-border text-text-muted hover:border-gold/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {lista.length === 0 ? (
          <div className="text-center py-12 px-6 text-text-muted text-sm">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Nenhum agendamento encontrado
          </div>
        ) : (
          lista.map((a: Agendamento) => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-surface2 border border-border hover:border-gold/30 transition-colors gap-3">
              <div>
                <div className="font-semibold text-[15px]">{a.cliente}</div>
                <div className="text-xs text-text-muted mt-0.5">
                  {a.servico} · {fmtData(a.data)} {a.hora || ''} {a.obs ? `· ${a.obs}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {a.valor ? <div className="font-semibold text-base text-gold whitespace-nowrap">{fmtMoeda(a.valor)}</div> : null}
                <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full uppercase ${
                  a.status === 'concluido' ? 'bg-green/15 text-green' :
                  a.status === 'cancelado' ? 'bg-red/15 text-red' :
                  'bg-gold/15 text-gold'
                }`}>
                  {a.status || 'pendente'}
                </span>
                
                {a.status === 'pendente' && (
                  <button onClick={() => concluirAg(a.id)} className="bg-green/10 text-green border border-green/20 p-1.5 rounded hover:bg-green/20 transition-colors" title="Concluir">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => abrirModal(a)} className="bg-transparent border border-border text-text-muted p-1.5 rounded hover:border-gold hover:text-gold transition-colors" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => removerAg(a.id)} className="bg-red/10 text-red border border-red/20 p-1.5 rounded hover:bg-red/20 transition-colors" title="Remover">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-surface border border-border rounded-2xl p-7 w-[90%] max-w-[480px] animate-in zoom-in-95 duration-200">
            <h2 className="font-serif text-xl mb-4">✦ {editandoId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Nome do cliente *</label>
                <input 
                  autoFocus
                  value={formData.cliente}
                  onChange={e => setFormData({...formData, cliente: e.target.value})}
                  className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Serviço *</label>
                <select 
                  value={formData.servico}
                  onChange={e => setFormData({...formData, servico: e.target.value})}
                  className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                >
                  {servicos.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  {formData.servico && !servicos.includes(formData.servico) && <option value={formData.servico}>{formData.servico}</option>}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Valor (R$)</label>
                <input 
                  type="number" min="0" step="0.01"
                  value={formData.valor}
                  onChange={e => setFormData({...formData, valor: e.target.value})}
                  className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                  placeholder="0,00"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Data *</label>
                <input 
                  type="date"
                  value={formData.data}
                  onChange={e => setFormData({...formData, data: e.target.value})}
                  className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Horário</label>
                <input 
                  type="time"
                  value={formData.hora}
                  onChange={e => setFormData({...formData, hora: e.target.value})}
                  className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                >
                  <option value="pendente">⏳ Pendente</option>
                  <option value="concluido">✅ Concluído</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[11px] tracking-[1px] uppercase text-text-muted font-semibold">Observação</label>
              <input 
                value={formData.obs}
                onChange={e => setFormData({...formData, obs: e.target.value})}
                className="bg-surface2 border border-border text-text px-3.5 py-2.5 rounded-lg text-sm outline-none focus:border-gold transition-colors w-full"
                placeholder="Opcional..."
              />
            </div>

            <div className="flex gap-2.5 justify-end mt-5">
              <button onClick={() => setModalOpen(false)} className="bg-transparent border border-border text-text-muted px-5 py-2.5 rounded-lg text-sm font-semibold hover:border-gold hover:text-gold transition-colors">
                Cancelar
              </button>
              <button onClick={salvarAgendamento} className="bg-gradient-to-br from-gold-dark to-gold text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all">
                {editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
