import { useState, useEffect } from 'react';
import { useAppStore } from './lib/store';
import { ToastProvider } from './lib/ToastContext';
import { Menu, BarChart2, Calendar, DollarSign, Settings, LogOut, Loader2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Agenda } from './components/Agenda';
import { Financeiro } from './components/Financeiro';
import { Configuracoes } from './components/Configuracoes';
import { Auth } from './components/Auth';
import { logout } from './lib/firebase';

function lightenHex(hex: string, amt: number) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const store = useAppStore();

  useEffect(() => {
    const cor = store.config.cor || '#c9a84c';
    const nome = store.config.nome || '💈 Barber Manager';
    document.documentElement.style.setProperty('--gold', cor);
    document.documentElement.style.setProperty('--gold-light', lightenHex(cor, 30));
    document.documentElement.style.setProperty('--gold-dark', lightenHex(cor, -30));
    document.title = nome.replace(/[💈]/g, '').trim() || 'Barber Manager';
  }, [store.config.cor, store.config.nome]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  const activeLabel = navItems.find(n => n.id === activeTab)?.label;

  if (!store.isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!store.currentUser) {
    return <Auth store={store} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[240px] bg-surface border-r border-border flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.8)]' : '-translate-x-full md:translate-x-0'} md:w-[240px]`}>
        <div className="p-7 pb-5 border-b border-border">
          {store.config.logo ? (
            <img src={store.config.logo} alt="Logo" className="max-h-12 object-contain mb-2" />
          ) : (
            <div className="font-serif text-xl text-gold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
              {store.config.nome || '💈 Barber Manager'}
            </div>
          )}
          <div className="text-[10px] text-text-muted tracking-[2px] uppercase mt-0.5">
            Gestão profissional
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                activeTab === item.id 
                  ? 'bg-[rgba(201,168,76,0.12)] text-gold' 
                  : 'text-text-muted hover:bg-surface2 hover:text-text'
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-3">
          <button 
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm text-text-muted hover:bg-surface2 hover:text-red transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
          <div className="text-[11px] text-text-muted text-center">
            Dados salvos na nuvem<br/>(Firebase)
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-[240px] p-4 md:p-8 relative z-10 w-full">
        {/* Topbar Mobile */}
        <div className="flex items-center gap-3.5 mb-6 md:hidden">
          <button 
            className="p-2 -ml-2 text-text"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-serif text-lg text-gold">{activeLabel}</span>
        </div>

        {activeTab === 'dashboard' && <Dashboard store={store} />}
        {activeTab === 'agenda' && <Agenda store={store} />}
        {activeTab === 'financeiro' && <Financeiro store={store} />}
        {activeTab === 'config' && <Configuracoes store={store} />}
      </main>
    </div>
  );
}
