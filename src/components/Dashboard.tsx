import { Agendamento, Transacao } from '../lib/store';
import { fmtData, fmtMoeda } from '../lib/utils';
import { Calendar, Inbox, CreditCard } from 'lucide-react';

export function Dashboard({ store }: { store: any }) {
  const { agendamentos, ganhos, custos } = store;
  
  const hoje = new Date().toISOString().split('T')[0];
  
  const totalGanhos = ganhos.reduce((a: number, b: Transacao) => a + (+b.valor || 0), 0)
    + agendamentos.filter((a: Agendamento) => a.status === 'concluido').reduce((a: number, b: Agendamento) => a + (+b.valor || 0), 0);
  const totalCustos = custos.reduce((a: number, b: Transacao) => a + (+b.valor || 0), 0);
  const saldo = totalGanhos - totalCustos;
  const totalHoje = agendamentos.filter((a: Agendamento) => a.data === hoje).length;
  const pendentes = agendamentos.filter((a: Agendamento) => a.status === 'pendente').length;

  const proximos = [...agendamentos]
    .filter((a: Agendamento) => a.data >= hoje && a.status !== 'cancelado')
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .slice(0, 5);

  const movs = [
    ...ganhos.map((g: Transacao) => ({ ...g, tipo: 'ganho' })),
    ...custos.map((c: Transacao) => ({ ...c, tipo: 'custo' }))
  ].slice(-6).reverse();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold">Visão <span className="text-gold">Geral</span></h1>
        <div className="inline-flex items-center gap-1.5 bg-surface3 px-2.5 py-1 rounded-full text-xs text-text-muted">
          <Calendar className="w-3.5 h-3.5" /> <span>{fmtData(hoje)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard label="Agendamentos hoje" value={totalHoje} valueClass="text-gold" />
        <StatCard label="Pendentes" value={pendentes} valueClass="text-gold-light" />
        <StatCard label="Total ganhos" value={fmtMoeda(totalGanhos)} valueClass="text-green" />
        <StatCard label="Saldo" value={fmtMoeda(saldo)} valueClass={saldo >= 0 ? 'text-green' : 'text-red'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="font-serif text-lg mb-4 pb-2.5 border-b border-border flex items-center gap-2.5">
            📅 Próximos agendamentos
          </div>
          <div className="flex flex-col gap-2">
            {proximos.length === 0 ? (
              <div className="text-center py-12 px-6 text-text-muted text-sm">
                <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                Nenhum agendamento próximo
              </div>
            ) : (
              proximos.map((a: Agendamento) => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-lg bg-surface2 border border-border hover:border-gold/30 transition-colors">
                  <div>
                    <div className="font-semibold text-[15px]">{a.cliente}</div>
                    <div className="text-xs text-text-muted mt-0.5">{a.servico} · {fmtData(a.data)} {a.hora || ''}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {a.valor ? <div className="font-semibold text-base text-gold whitespace-nowrap">{fmtMoeda(a.valor)}</div> : null}
                    <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full uppercase ${
                      a.status === 'concluido' ? 'bg-green/15 text-green' :
                      a.status === 'cancelado' ? 'bg-red/15 text-red' :
                      'bg-gold/15 text-gold'
                    }`}>
                      {a.status || 'pendente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="font-serif text-lg mb-4 pb-2.5 border-b border-border flex items-center gap-2.5">
            💸 Últimas movimentações
          </div>
          <div className="flex flex-col gap-2">
            {movs.length === 0 ? (
              <div className="text-center py-12 px-6 text-text-muted text-sm">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                Nenhuma movimentação
              </div>
            ) : (
              movs.map((m: any, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-lg bg-surface2 border border-border hover:border-gold/30 transition-colors">
                  <div className="font-semibold text-[15px]">{m.desc}</div>
                  <div className={`font-semibold text-base whitespace-nowrap ${m.tipo === 'ganho' ? 'text-green' : 'text-red'}`}>
                    {m.tipo === 'ganho' ? '+' : '-'} {fmtMoeda(m.valor)}
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

function StatCard({ label, value, valueClass }: { label: string, value: string | number, valueClass?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-dark to-gold-light" />
      <div className="text-[11px] tracking-[1.5px] uppercase text-text-muted">{label}</div>
      <div className={`text-2xl font-semibold mt-1.5 ${valueClass || ''}`}>{value}</div>
    </div>
  );
}
