import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Config, DiaFuncionamento } from '../lib/store';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, User, Scissors } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function PublicBooking({ barberId }: { barberId: string }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [cliente, setCliente] = useState('');
  const [servico, setServico] = useState('');
  const [telefone, setTelefone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, `users/${barberId}/config/main`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as Config);
          
          // Set initial date to today
          const today = new Date().toISOString().split('T')[0];
          setSelectedDate(today);
        } else {
          setError('Barbearia não encontrada.');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${barberId}/config/main`);
        setError('Erro ao carregar dados da barbearia.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [barberId]);

  useEffect(() => {
    if (!selectedDate || !config?.funcionamento) return;

    const fetchSlots = async () => {
      const dateObj = new Date(selectedDate + 'T12:00:00'); // Use noon to avoid timezone issues
      const dayOfWeek = dateObj.getDay();
      
      const funcionamentoDia = config.funcionamento![dayOfWeek];
      if (!funcionamentoDia || !funcionamentoDia.ativo) {
        setAvailableSlots([]);
        return;
      }

      // Generate all possible slots
      const slots: string[] = [];
      const intervalo = config.intervaloMinutos || 30;
      
      let [hora, min] = funcionamentoDia.inicio.split(':').map(Number);
      const [fimHora, fimMin] = funcionamentoDia.fim.split(':').map(Number);
      
      while (hora < fimHora || (hora === fimHora && min < fimMin)) {
        slots.push(`${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        min += intervalo;
        if (min >= 60) {
          hora += Math.floor(min / 60);
          min = min % 60;
        }
      }

      // Fetch taken slots from public_slots
      try {
        const slotsRef = collection(db, `users/${barberId}/public_slots`);
        const q = query(slotsRef, where('data', '==', selectedDate));
        const querySnapshot = await getDocs(q);
        
        const takenSlots = new Set<string>();
        querySnapshot.forEach((doc) => {
          takenSlots.add(doc.data().hora);
        });

        // Filter available
        setAvailableSlots(slots.filter(s => !takenSlots.has(s)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${barberId}/public_slots`);
        setAvailableSlots(slots);
      }
    };

    fetchSlots();
    setSelectedSlot('');
  }, [selectedDate, config, barberId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !servico || !selectedDate || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);

      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const agendamentoRef = doc(db, `users/${barberId}/agendamentos/${id}`);
      
      batch.set(agendamentoRef, {
        cliente: cliente.trim(),
        servico,
        valor: 0,
        data: selectedDate,
        hora: selectedSlot,
        obs: telefone ? `Telefone: ${telefone}` : '',
        status: 'pendente',
        createdAt: new Date().toISOString()
      });

      const slotId = `${selectedDate}_${selectedSlot}`;
      const slotRef = doc(db, `users/${barberId}/public_slots/${slotId}`);
      batch.set(slotRef, {
        data: selectedDate,
        hora: selectedSlot
      });

      await batch.commit();
      setSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${barberId}/agendamentos`);
      alert('Erro ao agendar. O horário pode já ter sido preenchido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414]">
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Ops!</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const servicosList = (config.servicos || '').split('\n').filter(Boolean);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] p-4">
        <div className="bg-[#1c1c1c] border border-[#333] rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[#c9a84c] mb-2">Agendamento Confirmado!</h2>
          <p className="text-gray-400 mb-6">
            Seu horário para <strong>{selectedDate.split('-').reverse().join('/')}</strong> às <strong>{selectedSlot}</strong> foi reservado com sucesso.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#c9a84c] text-black px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all w-full"
          >
            Fazer novo agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="h-20 object-contain mx-auto mb-4 rounded-lg" />
          ) : (
            <div className="w-20 h-20 bg-[#1c1c1c] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#333]">
              <Scissors className="w-8 h-8 text-[#c9a84c]" />
            </div>
          )}
          <h1 className="text-2xl font-serif text-[#c9a84c]">{config.nome || 'Barbearia'}</h1>
          <p className="text-gray-400 text-sm mt-1">Agende seu horário online</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#1c1c1c] p-6 rounded-2xl border border-[#333]">
          {/* Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">1. Escolha o Serviço</label>
            <div className="grid grid-cols-1 gap-2">
              {servicosList.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServico(s)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    servico === s 
                      ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]' 
                      : 'border-[#333] bg-[#252525] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">2. Escolha a Data</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="date" 
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-[#252525] border border-[#333] text-white pl-10 pr-4 py-3 rounded-lg focus:border-[#c9a84c] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Horário */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">3. Escolha o Horário</label>
            {availableSlots.length === 0 ? (
              <div className="text-center p-4 bg-[#252525] rounded-lg border border-[#333] text-gray-400 text-sm">
                Nenhum horário disponível nesta data.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      selectedSlot === slot 
                        ? 'border-[#c9a84c] bg-[#c9a84c] text-black font-semibold' 
                        : 'border-[#333] bg-[#252525] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dados do Cliente */}
          <div className="space-y-4 pt-4 border-t border-[#333]">
            <label className="block text-sm font-medium text-gray-300">4. Seus Dados</label>
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                placeholder="Seu nome completo"
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                className="w-full bg-[#252525] border border-[#333] text-white pl-10 pr-4 py-3 rounded-lg focus:border-[#c9a84c] outline-none transition-colors"
              />
            </div>

            <input 
              type="tel" 
              placeholder="Seu WhatsApp (opcional)"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              className="w-full bg-[#252525] border border-[#333] text-white px-4 py-3 rounded-lg focus:border-[#c9a84c] outline-none transition-colors"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !cliente || !servico || !selectedDate || !selectedSlot}
            className="w-full bg-gradient-to-r from-[#c9a84c] to-[#b39543] text-black font-bold py-4 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
