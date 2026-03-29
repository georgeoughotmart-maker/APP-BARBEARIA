import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type Agendamento = {
  id: string;
  cliente: string;
  servico: string;
  valor: number;
  data: string;
  hora: string;
  obs: string;
  status: 'pendente' | 'concluido' | 'cancelado';
  createdAt?: string;
};

export type Transacao = {
  id: string;
  desc: string;
  valor: number;
  createdAt?: string;
};

export type Config = {
  nome: string;
  cor: string;
  servicos: string;
  logo?: string;
  updatedAt?: string;
};

export function useAppStore() {
  const [agendamentos, setAgendamentosState] = useState<Agendamento[]>([]);
  const [ganhos, setGanhosState] = useState<Transacao[]>([]);
  const [custos, setCustosState] = useState<Transacao[]>([]);
  const [config, setConfigState] = useState<Config>({ nome: '', cor: '#c9a84c', servicos: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      
      if (user) {
        // Create user doc if it doesn't exist
        setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName || '',
          createdAt: new Date().toISOString()
        }, { merge: true }).catch(console.error);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAgendamentosState([]);
      setGanhosState([]);
      setCustosState([]);
      setConfigState({ nome: '', cor: '#c9a84c', servicos: '' });
      return;
    }

    const uid = currentUser.uid;

    const unsubAg = onSnapshot(collection(db, `users/${uid}/agendamentos`), (snap) => {
      setAgendamentosState(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agendamento)));
    }, console.error);

    const unsubGanhos = onSnapshot(collection(db, `users/${uid}/ganhos`), (snap) => {
      setGanhosState(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao)));
    }, console.error);

    const unsubCustos = onSnapshot(collection(db, `users/${uid}/custos`), (snap) => {
      setCustosState(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao)));
    }, console.error);

    const unsubConfig = onSnapshot(doc(db, `users/${uid}/config/main`), (docSnap) => {
      if (docSnap.exists()) {
        setConfigState(docSnap.data() as Config);
      }
    }, console.error);

    return () => {
      unsubAg();
      unsubGanhos();
      unsubCustos();
      unsubConfig();
    };
  }, [currentUser]);

  // Firebase Mutators
  const setAgendamentos = async (newAgendamentos: Agendamento[] | ((prev: Agendamento[]) => Agendamento[])) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const resolved = typeof newAgendamentos === 'function' ? newAgendamentos(agendamentos) : newAgendamentos;
    
    // Find what to add/update/delete
    const currentIds = new Set<string>(agendamentos.map(a => a.id));
    const newIds = new Set<string>(resolved.map(a => a.id));

    for (const ag of resolved) {
      const docRef = doc(db, `users/${uid}/agendamentos/${ag.id}`);
      const { id, ...data } = ag;
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      await setDoc(docRef, data, { merge: true }).catch(console.error);
    }

    for (const id of Array.from(currentIds)) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, `users/${uid}/agendamentos/${id}`)).catch(console.error);
      }
    }
  };

  const setGanhos = async (newGanhos: Transacao[] | ((prev: Transacao[]) => Transacao[])) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const resolved = typeof newGanhos === 'function' ? newGanhos(ganhos) : newGanhos;
    
    const currentIds = new Set<string>(ganhos.map(a => a.id));
    const newIds = new Set<string>(resolved.map(a => a.id));

    for (const g of resolved) {
      const docRef = doc(db, `users/${uid}/ganhos/${g.id}`);
      const { id, ...data } = g;
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      await setDoc(docRef, data, { merge: true }).catch(console.error);
    }

    for (const id of Array.from(currentIds)) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, `users/${uid}/ganhos/${id}`)).catch(console.error);
      }
    }
  };

  const setCustos = async (newCustos: Transacao[] | ((prev: Transacao[]) => Transacao[])) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const resolved = typeof newCustos === 'function' ? newCustos(custos) : newCustos;
    
    const currentIds = new Set<string>(custos.map(a => a.id));
    const newIds = new Set<string>(resolved.map(a => a.id));

    for (const c of resolved) {
      const docRef = doc(db, `users/${uid}/custos/${c.id}`);
      const { id, ...data } = c;
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      await setDoc(docRef, data, { merge: true }).catch(console.error);
    }

    for (const id of Array.from(currentIds)) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, `users/${uid}/custos/${id}`)).catch(console.error);
      }
    }
  };

  const setConfig = async (newConfig: Config) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const data = { ...newConfig, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, `users/${uid}/config/main`), data, { merge: true }).catch(console.error);
  };

  return {
    agendamentos, setAgendamentos,
    ganhos, setGanhos,
    custos, setCustos,
    config, setConfig,
    currentUser, isAuthReady
  };
}
