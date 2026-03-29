import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../lib/ToastContext';
import { Save, Download, Trash2, X, Plus, Upload, Copy, ExternalLink } from 'lucide-react';
import { DiaFuncionamento } from '../lib/store';

export function Configuracoes({ store }: { store: any }) {
  const { config, setConfig, agendamentos, ganhos, custos, setAgendamentos, setGanhos, setCustos } = store;
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(config.nome || '');
  const [cor, setCor] = useState(config.cor || '#c9a84c');
  const [logo, setLogo] = useState(config.logo || '');
  const [servicosList, setServicosList] = useState<string[]>((config.servicos || 'Corte\nBarba\nCorte + Barba\nPezinho\nSobrancelha').split('\n').filter(Boolean));
  const [novoServico, setNovoServico] = useState('');
  
  const [funcionamento, setFuncionamento] = useState<Record<number, DiaFuncionamento>>(config.funcionamento || {
    0: { ativo: false, inicio: '09:00', fim: '18:00' },
    1: { ativo: true, inicio: '09:00', fim: '18:00' },
    2: { ativo: true, inicio: '09:00', fim: '18:00' },
    3: { ativo: true, inicio: '09:00', fim: '18:00' },
    4: { ativo: true, inicio: '09:00', fim: '18:00' },
    5: { ativo: true, inicio: '09:00', fim: '19:00' },
    6: { ativo: true, inicio: '09:00', fim: '14:00' },
  });
  const [intervaloMinutos, setIntervaloMinutos] = useState(config.intervaloMinutos || 30);

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    setNome(config.nome || '');
    setCor(config.cor || '#c9a84c');
    setLogo(config.logo || '');
    setServicosList((config.servicos || 'Corte\nBarba\nCorte + Barba\nPezinho\nSobrancelha').split('\n').filter(Boolean));
    if (config.funcionamento) setFuncionamento(config.funcionamento);
    if (config.intervaloMinutos) setIntervaloMinutos(config.intervaloMinutos);
  }, [config]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast('A imagem deve ter no máximo 2MB', 'err');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddServico = () => {
    const s = novoServico.trim();
    if (s && !servicosList.includes(s)) {
      setServicosList([...servicosList, s]);
      setNovoServico('');
    } else if (servicosList.includes(s)) {
      showToast('Serviço já existe', 'info');
    }
  };

  const handleRemoveServico = (servico: string) => {
    setServicosList(servicosList.filter(s => s !== servico));
  };

  const salvarConfig = () => {
    setConfig({
      nome: nome.trim(),
      cor,
      logo,
      servicos: servicosList.join('\n'),
      funcionamento,
      intervaloMinutos
    });
    showToast('Configurações salvas!');
  };

  const copyPublicLink = () => {
    const link = `${window.location.origin}/agendar/${store.currentUser?.uid}`;
    navigator.clipboard.writeText(link);
    showToast('Link copiado para a área de transferência!');
  };

  const exportarDados = () => {
    const dados = { agendamentos, ganhos, custos, config, exportado: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'barber-manager-backup.json';
    a.click();
    showToast('Dados exportados!');
  };

  const confirmarLimpar = () => {
    if (confirm('⚠️ Isso vai apagar TODOS os dados. Tem certeza?')) {
      setAgendamentos([]);
      setGanhos([]);
      setCustos([]);
      setConfig({});
      showToast('Dados limpos!', 'info');
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold">⚙️ <span className="text-gold">Configurações</span></h1>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 max-w-[560px]">
        
        {/* Link Público */}
        <div className="flex flex-col py-4 border-b border-border">
          <div className="mb-3">
            <div className="text-sm font-medium text-gold">Agendamento Online (Link Público)</div>
            <div className="text-xs text-text-muted mt-0.5">Envie este link para seus clientes agendarem sozinhos</div>
          </div>
          <div className="flex gap-2">
            <input 
              readOnly
              value={`${window.location.origin}/agendar/${store.currentUser?.uid}`}
              className="flex-1 bg-surface2 border border-border text-text px-3 py-2 rounded-lg text-sm outline-none opacity-70"
            />
            <button 
              onClick={copyPublicLink}
              className="bg-surface2 border border-border text-text px-3 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" /> Copiar
            </button>
            <a 
              href={`/agendar/${store.currentUser?.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-black px-3 py-2 rounded-lg text-sm hover:brightness-110 transition-colors flex items-center gap-1.5 font-medium"
            >
              <ExternalLink className="w-4 h-4" /> Abrir
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <div className="text-sm font-medium">Logo da barbearia</div>
            <div className="text-xs text-text-muted mt-0.5">Imagem para o menu e login (Máx 2MB)</div>
          </div>
          <div className="flex items-center gap-3">
            {logo && (
              <div className="relative group">
                <img src={logo} alt="Logo preview" className="h-10 w-auto object-contain bg-surface2 rounded border border-border p-1" />
                <button 
                  onClick={() => setLogo('')}
                  className="absolute -top-2 -right-2 bg-red text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover logo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-surface2 border border-border text-text px-3 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> {logo ? 'Trocar' : 'Enviar'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <div className="text-sm font-medium">Nome da barbearia</div>
            <div className="text-xs text-text-muted mt-0.5">Aparece no topo do menu lateral</div>
          </div>
          <input 
            value={nome} onChange={e => setNome(e.target.value)}
            className="w-[180px] bg-surface2 border border-border text-text px-3 py-2 rounded-lg text-sm outline-none focus:border-gold transition-colors"
            placeholder="Barber Manager"
          />
        </div>

        <div className="flex items-center justify-between py-4 border-b border-border">
          <div>
            <div className="text-sm font-medium">Cor de destaque</div>
            <div className="text-xs text-text-muted mt-0.5">Cor principal do sistema</div>
          </div>
          <input 
            type="color" 
            value={cor} onChange={e => setCor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
          />
        </div>

        <div className="flex flex-col py-4">
          <div className="mb-3">
            <div className="text-sm font-medium">Serviços padrão</div>
            <div className="text-xs text-text-muted mt-0.5">Gerencie os serviços disponíveis no agendamento</div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input 
              value={novoServico}
              onChange={e => setNovoServico(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddServico()}
              className="flex-1 bg-surface2 border border-border text-text px-3 py-2 rounded-lg text-sm outline-none focus:border-gold transition-colors"
              placeholder="Adicionar novo serviço..."
            />
            <button 
              onClick={handleAddServico}
              className="bg-surface2 border border-border text-text px-4 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {servicosList.map(s => (
              <div key={s} className="flex items-center gap-1.5 bg-surface2 border border-border px-3 py-1.5 rounded-lg text-sm">
                <span>{s}</span>
                <button 
                  onClick={() => handleRemoveServico(s)} 
                  className="text-text-muted hover:text-red transition-colors ml-1"
                  title="Remover serviço"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {servicosList.length === 0 && (
              <div className="text-xs text-text-muted italic py-2">Nenhum serviço cadastrado.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col py-4 border-t border-border">
          <div className="mb-4">
            <div className="text-sm font-medium">Horários de Funcionamento</div>
            <div className="text-xs text-text-muted mt-0.5">Defina os dias e horários que a barbearia está aberta</div>
          </div>

          <div className="flex items-center justify-between mb-4 bg-surface2 p-3 rounded-lg border border-border">
            <div className="text-sm">Duração de cada agendamento</div>
            <select 
              value={intervaloMinutos}
              onChange={(e) => setIntervaloMinutos(Number(e.target.value))}
              className="bg-surface border border-border text-text px-3 py-1.5 rounded-lg text-sm outline-none focus:border-gold"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
            </select>
          </div>

          <div className="space-y-3">
            {diasSemana.map((dia, index) => {
              const func = funcionamento[index];
              return (
                <div key={index} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-28 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={func.ativo}
                      onChange={(e) => setFuncionamento({...funcionamento, [index]: { ...func, ativo: e.target.checked }})}
                      className="accent-gold w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm ${func.ativo ? 'text-text' : 'text-text-muted'}`}>{dia}</span>
                  </label>
                  
                  {func.ativo ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="time" 
                        value={func.inicio}
                        onChange={(e) => setFuncionamento({...funcionamento, [index]: { ...func, inicio: e.target.value }})}
                        className="bg-surface2 border border-border text-text px-2 py-1 rounded text-sm outline-none focus:border-gold w-24"
                      />
                      <span className="text-text-muted text-sm">até</span>
                      <input 
                        type="time" 
                        value={func.fim}
                        onChange={(e) => setFuncionamento({...funcionamento, [index]: { ...func, fim: e.target.value }})}
                        className="bg-surface2 border border-border text-text px-2 py-1 rounded text-sm outline-none focus:border-gold w-24"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-text-muted italic flex-1">Fechado</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <hr className="border-t border-border my-6" />

        <div className="flex gap-2.5 flex-wrap">
          <button onClick={salvarConfig} className="bg-gradient-to-br from-gold-dark to-gold text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-1.5">
            <Save className="w-4 h-4" /> Salvar configurações
          </button>
          <button onClick={exportarDados} className="bg-transparent border border-border text-text-muted px-5 py-2.5 rounded-lg text-sm font-semibold hover:border-gold hover:text-gold transition-colors flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Exportar dados
          </button>
          <button onClick={confirmarLimpar} className="bg-red/10 text-red border border-red/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red/20 transition-colors flex items-center gap-1.5 ml-auto">
            <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
