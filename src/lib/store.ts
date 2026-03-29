import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

export type DiaFuncionamento = {
  ativo: boolean;
  inicio: string;
  fim: string;
};

export type Config = {
  nome: string;
  cor: string;
  servicos: string;
  logo?: string;
  funcionamento?: Record<number, DiaFuncionamento>;
  intervaloMinutos?: number;
  updatedAt?: string;
};

const DEFAULT_FUNCIONAMENTO: Record<number, DiaFuncionamento> = {
  0: { ativo: false, inicio: '09:00', fim: '18:00' }, // Dom
  1: { ativo: true, inicio: '09:00', fim: '18:00' },  // Seg
  2: { ativo: true, inicio: '09:00', fim: '18:00' },  // Ter
  3: { ativo: true, inicio: '09:00', fim: '18:00' },  // Qua
  4: { ativo: true, inicio: '09:00', fim: '18:00' },  // Qui
  5: { ativo: true, inicio: '09:00', fim: '19:00' },  // Sex
  6: { ativo: true, inicio: '09:00', fim: '14:00' },  // Sab
};

export function useAppStore() {
  const [agendamentos, setAgendamentosState] = useState<Agendamento[]>([]);
  const [ganhos, setGanhosState] = useState<Transacao[]>([]);
  const [custos, setCustosState] = useState<Transacao[]>([]);
  const [config, setConfigState] = useState<Config>({ 
    nome: '', 
    cor: '#c9a84c', 
    servicos: '',
    funcionamento: DEFAULT_FUNCIONAMENTO,
    intervaloMinutos: 30
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      
      if (user) {
        // Create user doc if it doesn't exist
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then(docSnap => {
          if (!docSnap.exists()) {
            setDoc(userRef, {
              email: user.email,
              name: user.displayName || '',
              createdAt: new Date().toISOString()
            }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
          }
        }).catch(e => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAgendamentosState([]);
      setGanhosState([]);
      setCustosState([]);
      setConfigState({ 
        nome: '', 
        cor: '#c9a84c', 
        servicos: '',
        funcionamento: DEFAULT_FUNCIONAMENTO,
        intervaloMinutos: 30
      });
      return;
    }

    const uid = currentUser.uid;

    const unsubAg = onSnapshot(collection(db, `users/${uid}/agendamentos`), (snap) => {
      setAgendamentosState(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agendamento)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/agendamentos`));

    const unsubGanhos = onSnapshot(collection(db, `users/${uid}/ganhos`), (snap) => {
      setGanhosState(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/ganhos`));

    const unsubCustos = onSnapshot(collection(db, `users/${uid}/custos`), (snap) => {
      setCustosState(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/custos`));

    const unsubConfig = onSnapshot(doc(db, `users/${uid}/config/main`), (docSnap) => {
      if (docSnap.exists()) {
        setConfigState(docSnap.data() as Config);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}/config/main`));

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
      
      // Check if time changed to delete old slot
      const oldAg = agendamentos.find(a => a.id === ag.id);
      if (oldAg && (oldAg.data !== data.data || oldAg.hora !== data.hora || data.status === 'cancelado')) {
        if (oldAg.data && oldAg.hora) {
          const oldSlotId = `${oldAg.data}_${oldAg.hora}`;
          await deleteDoc(doc(db, `users/${uid}/public_slots/${oldSlotId}`)).catch(e => handleFirestoreError(e, OperationType.DELETE, `users/${uid}/public_slots/${oldSlotId}`));
        }
      }

      await setDoc(docRef, data, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${uid}/agendamentos/${ag.id}`));

      // Sync public slot if it has a valid date and time and is not canceled
      if (data.data && data.hora && data.status !== 'cancelado') {
        const slotId = `${data.data}_${data.hora}`;
        await setDoc(doc(db, `users/${uid}/public_slots/${slotId}`), {
          data: data.data,
          hora: data.hora
        }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${uid}/public_slots/${slotId}`));
      }
    }

    for (const id of Array.from(currentIds)) {
      if (!newIds.has(id)) {
        const oldAg = agendamentos.find(a => a.id === id);
        if (oldAg && oldAg.data && oldAg.hora) {
          const slotId = `${oldAg.data}_${oldAg.hora}`;
          await deleteDoc(doc(db, `users/${uid}/public_slots/${slotId}`)).catch(e => handleFirestoreError(e, OperationType.DELETE, `users/${uid}/public_slots/${slotId}`));
        }
        await deleteDoc(doc(db, `users/${uid}/agendamentos/${id}`)).catch(e => handleFirestoreError(e, OperationType.DELETE, `users/${uid}/agendamentos/${id}`));
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
      await setDoc(docRef, data, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${uid}/ganhos/${g.id}`));
    }

    for (const id of Array.from(currentIds)) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, `users/${uid}/ganhos/${id}`)).catch(e => handleFirestoreError(e, OperationType.DELETE, `users/${uid}/ganhos/${id}`));
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
      await setDoc(docRef, data, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${uid}/custos/${c.id}`));
    }

    for (const id of Array.from(currentIds)) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, `users/${uid}/custos/${id}`)).catch(e => handleFirestoreError(e, OperationType.DELETE, `users/${uid}/custos/${id}`));
      }
    }
  };

  const setConfig = async (newConfig: Config) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const data = { ...newConfig, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, `users/${uid}/config/main`), data, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${uid}/config/main`));
  };

  return {
    agendamentos, setAgendamentos,
    ganhos, setGanhos,
    custos, setCustos,
    config, setConfig,
    currentUser, isAuthReady
  };
}
