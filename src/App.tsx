import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Home, ArrowLeftRight, TrendingUp, Users, Briefcase, LogOut, Info, Sparkles } from 'lucide-react';
import logo from './assets/player-finance-logo.png';
// Models
import {
  Player,
  Transaction,
  Account,
  PaymentAccount,
  PrivateAccount,
  PrivateTransaction,
} from './types';
import { App as CapacitorApp } from "@capacitor/app";

// Initial Seed Data & Math Helpers
import {
  INITIAL_PLAYERS,
  INITIAL_TRANSACTIONS,
  normalizeTransaction,
} from './data';

// Custom Tab Views
import HomeTab from './components/HomeTab';
import ExchangeTab from './components/ExchangeTab';
import AnalyticsTab from './components/AnalyticsTab';
import PlayersTab from './components/PlayersTab';
import AgencyTab from './components/AgencyTab';
import AboutTab from './components/AboutTab';

// Custom Modal Components
import AddEditPlayerModal from './components/AddEditPlayerModal';
import AddEditTransactionModal from './components/AddEditTransactionModal';
import AddEditPaymentAccountModal from './components/AddEditPaymentAccountModal';
import PlayerDetailsModal from './components/PlayerDetailsModal';
import AccountManagementModal from './components/AccountManagementModal';
import OwnerPasscodeModal from './components/OwnerPasscodeModal';
import OwnerPrivatePage from './components/OwnerPrivateModal';
import { encryptJson, decryptJson } from './crypto';

// Firebase Services
import { auth, db, googleProvider } from './firebase';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  loadOfflineState,
  saveOfflineState,
  loadPendingQueue,
  addPendingOperation,
  removePendingOperation,
  clearPendingQueue,
  OfflineOperation,
  loadLocalObject,
  saveLocalArray,
  saveLocalObject,
} from './offlineStore';

import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs, query, getDoc } from 'firebase/firestore';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'Cash', name: 'Cash', icon: 'Wallet', color: 'bg-emerald-500', baseBalance: 500000 },
  { id: 'Bank account', name: 'Bank account', icon: 'Landmark', color: 'bg-blue-600', baseBalance: 1500000 },
  { id: 'Kbz', name: 'Kbz', icon: 'Landmark', color: 'bg-indigo-600', baseBalance: 2000000 },
  { id: 'Wave', name: 'Wave', icon: 'PhoneCall', color: 'bg-sky-500', baseBalance: 1000000 },
  { id: 'Cb', name: 'Cb', icon: 'Landmark', color: 'bg-violet-600', baseBalance: 1200000 }
];

// Firestore path for owner private encrypted payload: users/{uid}/private/encrypted
const PRIVATE_DOC_ID = 'private';
const PRIVATE_SUBDOC = 'encrypted';

export default function App() {
  // 1. Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 2. Core State
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('Home');

  const agencies = useMemo(
    () => Array.from(new Set(players.map((p) => p.agency).filter(Boolean))),
    [players]
  );

  // 3. Modal Controls State
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isPaymentAccountModalOpen, setIsPaymentAccountModalOpen] = useState(false);

  // Owner private finance controls (hidden area)
  const [isOwnerPassOpen, setIsOwnerPassOpen] = useState(false);
  const [ownerPassMode, setOwnerPassMode] = useState<'unlock' | 'set'>('unlock');
  const [isOwnerPrivateOpen, setIsOwnerPrivateOpen] = useState(false);
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [ownerPrivateData, setOwnerPrivateData] = useState<{ accounts: any[]; transactions: any[] } | null>(null);
  const ownerUnlockTimer = useRef<number | null>(null);
  const [ownerPasscode, setOwnerPasscode] = useState<string | null>(null);
  const [pendingRecoveredData, setPendingRecoveredData] = useState<{ accounts: any[]; transactions: any[] } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'pending' | 'synced'>('offline');
  const [pendingQueue, setPendingQueue] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const pendingQueueRef = useRef<OfflineOperation[]>([]);

  const updatePendingQueue = (nextQueue: OfflineOperation[]) => {
    pendingQueueRef.current = nextQueue;
    setPendingQueue(nextQueue);
  };

  const updateSyncStatus = (online: boolean, queueLength: number) => {
    if (!online) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus(queueLength > 0 ? 'pending' : 'synced');
  };

  const saveLocalPlayers = (uid: string, next: Player[]) => {
    saveLocalArray<Player>(uid, 'players', next);
    setPlayers(next);
  };

  const saveLocalAccounts = (uid: string, next: Account[]) => {
    saveLocalArray<Account>(uid, 'accounts', next);
    setAccounts(next);
  };

  const saveLocalTransactions = (uid: string, next: Transaction[]) => {
    saveLocalArray<Transaction>(uid, 'transactions', next);
    setTransactions(next);
  };

  const saveLocalPaymentAccounts = (uid: string, next: PaymentAccount[]) => {
    saveLocalArray<PaymentAccount>(uid, 'paymentAccounts', next);
    setPaymentAccounts(next);
  };

  const saveLocalOwnerEncrypted = (uid: string, payload: any) => {
    saveLocalObject(uid, 'ownerPrivateEncrypted', payload);
  };

  const saveLocalOwnerMeta = (uid: string, payload: any) => {
    saveLocalObject(uid, 'ownerPrivateMeta', payload);
  };

  const enqueueOrSync = async (operation: OfflineOperation) => {
    if (!user) {
      throw new Error('User must be signed in to sync');
    }

    if (!navigator.onLine) {
      const nextQueue = addPendingOperation(user.uid, operation);
      updatePendingQueue(nextQueue);
      updateSyncStatus(false, nextQueue.length);
      return { offline: true, message: 'Saved locally. Will sync when online.' };
    }

    try {
      await syncOperation(operation);
      return { offline: false };
    } catch (err: any) {
      console.error('Sync operation failed, queuing instead', err);
      const nextQueue = addPendingOperation(user.uid, operation);
      updatePendingQueue(nextQueue);
      updateSyncStatus(false, nextQueue.length);
      return { offline: true, message: 'Saved locally. Will sync when online.' };
    }
  };

  const syncOperation = async (operation: OfflineOperation) => {
    if (!user) {
      throw new Error('No authenticated user available for sync');
    }

    const { collection: col, type, docId, data } = operation;
    if (col === 'private') {
      const ref = doc(db, 'users', user.uid, PRIVATE_DOC_ID, PRIVATE_SUBDOC);
      if (type === 'set') {
        await setDoc(ref, data);
      } else {
        await deleteDoc(ref);
      }
      return;
    }

    if (col === 'privateMeta') {
      const ref = doc(db, 'users', user.uid, PRIVATE_DOC_ID, 'meta');
      if (type === 'set') {
        await setDoc(ref, data);
      } else {
        await deleteDoc(ref);
      }
      return;
    }

    const ref = doc(db, 'users', user.uid, col, docId);
    if (type === 'set') {
      await setDoc(ref, data);
    } else {
      await deleteDoc(ref);
    }
  };

  const processPendingQueue = async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    let queue = loadPendingQueue(user.uid);

    for (const operation of queue) {
      if (!navigator.onLine) {
        break;
      }
      try {
        await syncOperation(operation);
        queue = removePendingOperation(user.uid, operation.id);
      } catch (err) {
        if (!navigator.onLine) {
          break;
        }
        console.error('Failed to sync pending operation', err);
      }
    }

    updatePendingQueue(queue);
    updateSyncStatus(navigator.onLine, queue.length);
    setIsSyncing(false);
  };

  const loadOfflineUserState = (uid: string) => {
    const localState = loadOfflineState(uid);
    if (localState.players.length > 0) setPlayers(localState.players);
    if (localState.accounts.length > 0) setAccounts(localState.accounts);
    if (localState.transactions.length > 0) setTransactions(localState.transactions);
    if (localState.paymentAccounts.length > 0) setPaymentAccounts(localState.paymentAccounts);
    if (localState.pendingQueue.length > 0) updatePendingQueue(localState.pendingQueue);
    setSyncStatus(navigator.onLine ? (localState.pendingQueue.length > 0 ? 'pending' : 'synced') : 'offline');
  };

  const loadOfflineOwnerEncryptedState = (uid: string) => {
    const localState = loadOfflineState(uid);
    return {
      encrypted: localState.ownerPrivateEncrypted,
      meta: localState.ownerPrivateMeta,
    };
  };

  const loadLatestOwnerPrivateData = async (passcode: string): Promise<{ accounts: PrivateAccount[]; transactions: PrivateTransaction[] }> => {
    if (!user) return { accounts: [], transactions: [] };
    if (ownerPrivateData) return ownerPrivateData;
 
    const offlineState = loadOfflineOwnerEncryptedState(user.uid);
    const encrypted = offlineState.encrypted;
 
    if (!encrypted) {
      return { accounts: [], transactions: [] };
    }
 
    try {
      const decrypted = await decryptJson(passcode, encrypted);
      return {
        accounts: (decrypted.accounts || []) as PrivateAccount[],
        transactions: (decrypted.transactions || []) as PrivateTransaction[],
      };
    } catch (err) {
      console.warn('Unable to decrypt owner private data with current passcode', err);
      return { accounts: [], transactions: [] };
    }
  };
 
  // 4. Entity State for Modals
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [paymentAccountPlayerId, setPaymentAccountPlayerId] =
  useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>(undefined);
  const [editingPaymentAccount, setEditingPaymentAccount] = useState<PaymentAccount | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [preselectedPlayerIdForTx, setPreselectedPlayerIdForTx] = useState<string | undefined>(undefined);
  const [defaultAccountIdForTx, setDefaultAccountIdForTx] = useState<string | undefined>(undefined);
  const [quickActionPreset, setQuickActionPreset] = useState<'deposit' | 'withdraw' | 'exchange' | 'transfer' | undefined>(undefined);

  // 5. Auth State change handler & real-time sync with migration
  const skipAuth = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('skipAuth') === '1';

  useEffect(() => {
    if (skipAuth) {
      const devUser = { uid: 'dev-user', email: 'dev@example.com', displayName: 'Dev' } as User;
      setUser(devUser);
      setLoading(false);
      loadOfflineUserState(devUser.uid);
      return;
    }

    let cleanupSnapshots: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setAuthError(null);

      if (cleanupSnapshots) {
        cleanupSnapshots();
        cleanupSnapshots = null;
      }

      if (currentUser) {
        loadOfflineUserState(currentUser.uid);
        // Set up document references
        const playersRef = collection(db, 'users', currentUser.uid, 'players');
        const txsRef = collection(db, 'users', currentUser.uid, 'transactions');
        const accountsRef = collection(db, 'users', currentUser.uid, 'accounts');
        const paymentAccountsRef = collection(db, 'users', currentUser.uid, 'paymentAccounts');

        // Check if LocalStorage data needs to be migrated
        const savedPlayers = localStorage.getItem('player_finance_players');
        const savedTxs = localStorage.getItem('player_finance_transactions');
        const savedAccounts = localStorage.getItem('player_finance_accounts');

        if (savedPlayers || savedTxs || savedAccounts) {
          try {
            const batch = writeBatch(db);

            let localPlayers: Player[] = [];
            if (savedPlayers) {
              try { localPlayers = JSON.parse(savedPlayers); } catch (e) { console.error(e); }
            }

            let localTxs: Transaction[] = [];
            if (savedTxs) {
              try { localTxs = JSON.parse(savedTxs); } catch (e) { console.error(e); }
            }

            let localAccounts: Account[] = [];
            if (savedAccounts) {
              try { localAccounts = JSON.parse(savedAccounts); } catch (e) { console.error(e); }
            }

            // Determine what to write
            const playersToMigrate = localPlayers.length > 0 ? localPlayers : INITIAL_PLAYERS;
            const txsToMigrate = (localTxs.length > 0 ? localTxs : INITIAL_TRANSACTIONS).map((t) => normalizeTransaction(t));
            const accountsToMigrate = localAccounts.length > 0 ? localAccounts : DEFAULT_ACCOUNTS;

            // Add batch write commands
            playersToMigrate.forEach((p) => {
              batch.set(doc(db, 'users', currentUser.uid, 'players', p.id), p);
            });

            txsToMigrate.forEach((t) => {
              batch.set(doc(db, 'users', currentUser.uid, 'transactions', t.id), t);
            });

            accountsToMigrate.forEach((a) => {
              batch.set(doc(db, 'users', currentUser.uid, 'accounts', a.id), a);
            });

            await batch.commit();

            // Success, remove localStorage variables
            localStorage.removeItem('player_finance_players');
            localStorage.removeItem('player_finance_transactions');
            localStorage.removeItem('player_finance_accounts');
          } catch (err) {
            console.error('Migration failed:', err);
          }
        } else {
          // If no local data exists, verify if Firestore has records
          const playersSnap = await getDocs(query(playersRef));
          if (playersSnap.empty) {
            try {
              const batch = writeBatch(db);
              INITIAL_PLAYERS.forEach((p) => {
                batch.set(doc(db, 'users', currentUser.uid, 'players', p.id), p);
              });
              INITIAL_TRANSACTIONS.forEach((t) => {
                batch.set(doc(db, 'users', currentUser.uid, 'transactions', t.id), t);
              });
              DEFAULT_ACCOUNTS.forEach((a) => {
                batch.set(doc(db, 'users', currentUser.uid, 'accounts', a.id), a);
              });
              await batch.commit();
            } catch (err) {
              console.error('Seeding Firestore failed:', err);
            }
          }
        }

        // Configure real-time listeners
        const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
          const list: Player[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Player);
          });
          setPlayers(list);
          if (pendingQueueRef.current.length === 0) {
            saveLocalArray<Player>(currentUser.uid, 'players', list);
          }
        });
 
        const unsubTxs = onSnapshot(txsRef, (snapshot) => {
          const list: Transaction[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Transaction;
            // ensure the document id field matches the Firestore doc id
            data.id = doc.id;
            list.push(normalizeTransaction(data));
          });
          setTransactions(list);
          if (pendingQueueRef.current.length === 0) {
            saveLocalArray<Transaction>(currentUser.uid, 'transactions', list);
          }
        });
 
        const unsubAccounts = onSnapshot(accountsRef, (snapshot) => {
          const list: Account[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Account);
          });
          setAccounts(list);
          if (pendingQueueRef.current.length === 0) {
            saveLocalArray<Account>(currentUser.uid, 'accounts', list);
          }
        });
 
        const unsubPaymentAccounts = onSnapshot(paymentAccountsRef, (snapshot) => {
          const list: PaymentAccount[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as PaymentAccount);
          });
          setPaymentAccounts(list);
          if (pendingQueueRef.current.length === 0) {
            saveLocalArray<PaymentAccount>(currentUser.uid, 'paymentAccounts', list);
          }
        });
 
        cleanupSnapshots = () => {
          unsubPlayers();
          unsubTxs();
          unsubAccounts();
          unsubPaymentAccounts();
        };
      } else {
        // Clear all state on sign out
        setPlayers([]);
        setTransactions([]);
        setAccounts([]);
        setPaymentAccounts([]);
      }
    });
 
    return () => {
      unsubscribe();
      if (cleanupSnapshots) cleanupSnapshots();
    };
  }, []);
 
  useEffect(() => {
    pendingQueueRef.current = pendingQueue;
    updateSyncStatus(isOnline, pendingQueue.length);
  }, [pendingQueue, isOnline]);
 
  useEffect(() => {
    const updateStatus = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);
 
  useEffect(() => {
    if (user && isOnline) {
      processPendingQueue();
    }
  }, [user, isOnline]);
 
  useEffect(() => {
    const listener = CapacitorApp.addListener("backButton", () => {

    if (isPlayerModalOpen) {
      setIsPlayerModalOpen(false);
      return;
    }

    if (isTxModalOpen) {
      setIsTxModalOpen(false);
      return;
    }

    if (isDetailsModalOpen) {
      setIsDetailsModalOpen(false);
      return;
    }

    if (isAccountManagementOpen) {
      setIsAccountManagementOpen(false);
      return;
    }

    if (isPaymentAccountModalOpen) {
      setIsPaymentAccountModalOpen(false);
      return;
    }

    if (isOwnerPrivateOpen) {
      lockOwnerPrivatePage();
      return;
    }

    if (currentTab !== "Home") {
      setCurrentTab("Home");
      return;
    }

    CapacitorApp.exitApp();
  });

  return () => {
    listener.then(l => l.remove());
  };
}, [
  currentTab,
  isPlayerModalOpen,
  isTxModalOpen,
  isDetailsModalOpen,
  isAccountManagementOpen,
  isPaymentAccountModalOpen,
  isOwnerPrivateOpen
]);

useEffect(() => {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && isOwnerPrivateOpen) {
      lockOwnerPrivatePage();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  const appStateListener = CapacitorApp.addListener('appStateChange', (state) => {
    if (!state.isActive && isOwnerPrivateOpen) {
      lockOwnerPrivatePage();
    }
  });

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    appStateListener.then((l) => l.remove());
  };
}, [isOwnerPrivateOpen]);

// 6. Google Login Actions
  const handleLogin = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    setAuthError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle({
          scopes: ["email", "profile"],
          useCredentialManager: false,
        });

        const credential = GoogleAuthProvider.credential(
          result.credential?.idToken
        );

        await signInWithCredential(auth, credential);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: any) {
      console.error(err);
      console.error("Google Login Error:", err);
      setAuthError('Unable to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setAuthError(null);

    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out failed:', err);
      setAuthError('Unable to sign out right now.');
    } finally {
      setIsSigningOut(false);
    }
  };

  // 7. Account CRUD Actions
  const handleSaveAccount = async (accountData: Omit<Account, 'id'>, editId?: string) => {
    if (!user) return;
    const id = editId || 'acc_' + Date.now().toString();
    const nextAccounts = editId
      ? accounts.map((a) => (a.id === editId ? { ...a, ...accountData } : a))
      : [...accounts, { ...accountData, id }];

    saveLocalAccounts(user.uid, nextAccounts);

    const op: OfflineOperation = {
      id: `op_${Date.now()}`,
      collection: 'accounts',
      type: 'set',
      docId: id,
      data: { ...accountData, id },
      createdAt: new Date().toISOString(),
    };

    const result = await enqueueOrSync(op);
    if (result?.offline) {
      window.alert(result.message);
    }
  };

  const handleSavePaymentAccount = async (
    accountData: Omit<PaymentAccount, 'id'>,
    editId?: string
  ) => {
    if (!user) return;

    const id = editId || 'pay_' + Date.now().toString();
    const nextPaymentAccounts = editId
      ? paymentAccounts.map((a) => (a.id === editId ? { ...a, ...accountData } : a))
      : [...paymentAccounts, { ...accountData, id }];

    saveLocalPaymentAccounts(user.uid, nextPaymentAccounts);

    const op: OfflineOperation = {
      id: `op_${Date.now()}`,
      collection: 'paymentAccounts',
      type: 'set',
      docId: id,
      data: { ...accountData, id },
      createdAt: new Date().toISOString(),
    };

    const result = await enqueueOrSync(op);
    if (result?.offline) {
      window.alert(result.message);
    }
  };

  const handleDeleteAccount = async (idToRemove: string) => {
    if (!user) return;

    const updatedAccounts = accounts.filter((a) => a.id !== idToRemove);
    const fallbackId = updatedAccounts[0]?.id || '';
    const nextTransactions = transactions.map((t) =>
      t.account === idToRemove ? { ...t, account: fallbackId } : t
    );

    saveLocalAccounts(user.uid, updatedAccounts);
    saveLocalTransactions(user.uid, nextTransactions);

    const deleteOp: OfflineOperation = {
      id: `op_${Date.now()}_del_acc`,
      collection: 'accounts',
      type: 'delete',
      docId: idToRemove,
      createdAt: new Date().toISOString(),
    };
    await enqueueOrSync(deleteOp);

    for (const tx of nextTransactions.filter((t) => t.account === fallbackId && t.account !== idToRemove)) {
      const op: OfflineOperation = {
        id: `op_${Date.now()}_tx_${tx.id}`,
        collection: 'transactions',
        type: 'set',
        docId: tx.id,
        data: tx,
        createdAt: new Date().toISOString(),
      };
      await enqueueOrSync(op);
    }
  };

  // 8. Player CRUD Actions
  const handleOpenAddPlayer = () => {
    setEditingPlayer(undefined);
    setIsPlayerModalOpen(true);
  };

  const handleOpenEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = async (playerData: Omit<Player, 'id'>, editId?: string) => {
    if (!user) return;
    const id = editId || 'player_' + Date.now().toString();
    const nextPlayers = editId
      ? players.map((p) => (p.id === editId ? { ...p, ...playerData } : p))
      : [...players, { ...playerData, id }];

    saveLocalPlayers(user.uid, nextPlayers);

    const op: OfflineOperation = {
      id: `op_${Date.now()}`,
      collection: 'players',
      type: 'set',
      docId: id,
      data: { ...playerData, id },
      createdAt: new Date().toISOString(),
    };

    const result = await enqueueOrSync(op);
    if (result?.offline) {
      window.alert(result.message);
    }

    if (selectedPlayer && selectedPlayer.id === editId) {
      setSelectedPlayer({ ...selectedPlayer, ...playerData });
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!user) return;
    const nextPlayers = players.filter((p) => p.id !== playerId);
    const nextTransactions = transactions.filter((t) => t.playerId !== playerId);

    saveLocalPlayers(user.uid, nextPlayers);
    saveLocalTransactions(user.uid, nextTransactions);

    const deletePlayerOp: OfflineOperation = {
      id: `op_${Date.now()}_del_player`,
      collection: 'players',
      type: 'delete',
      docId: playerId,
      createdAt: new Date().toISOString(),
    };
    await enqueueOrSync(deletePlayerOp);

    for (const tx of transactions.filter((t) => t.playerId === playerId)) {
      const op: OfflineOperation = {
        id: `op_${Date.now()}_del_tx_${tx.id}`,
        collection: 'transactions',
        type: 'delete',
        docId: tx.id,
        createdAt: new Date().toISOString(),
      };
      await enqueueOrSync(op);
    }

    if (selectedPlayer && selectedPlayer.id === playerId) {
      setSelectedPlayer(null);
    }
  };

  

  // 9. Transaction CRUD Actions
  const handleOpenAddTransaction = useCallback((playerId?: string, preset?: 'deposit' | 'withdraw' | 'exchange' | 'transfer', accountId?: string) => {
    setEditingTransaction(undefined);
    setPreselectedPlayerIdForTx(playerId);
    setDefaultAccountIdForTx(accountId);
    setQuickActionPreset(preset);
    setIsTxModalOpen(true);
  }, []);

  const handleOpenEditTransaction = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTxModalOpen(true);
  }, []);

  const handleSaveTransaction = useCallback(async (txData: Omit<Transaction, 'id'>, editId?: string) => {
    if (!user) throw new Error('User is not authenticated');

    const previousTransactions = transactions;
    const previousPaymentAccounts = paymentAccounts;

    let paymentAccountId = txData.paymentAccountId;
    const pendingAccountOps: OfflineOperation[] = [];

    if (
      txData.transactionType === 'player' &&
      !paymentAccountId &&
      txData.paymentAccountNumber?.trim() &&
      txData.paymentAccountType?.trim()
    ) {
      const existing = paymentAccounts.find(
        (pa) =>
          pa.playerId === txData.playerId &&
          pa.type === txData.paymentAccountType &&
          pa.accountNumber === txData.paymentAccountNumber
      );

      if (existing) {
        paymentAccountId = existing.id;
      } else {
        const newPayId = 'pay_' + Date.now().toString();
        const newPaymentAccount: PaymentAccount = {
          id: newPayId,
          playerId: txData.playerId,
          type: txData.paymentAccountType,
          accountName: '',
          accountNumber: txData.paymentAccountNumber,
          note: 'Created from transaction',
        };
        const nextPaymentAccounts = [...paymentAccounts, newPaymentAccount];
        saveLocalPaymentAccounts(user.uid, nextPaymentAccounts);
        paymentAccountId = newPayId;
        pendingAccountOps.push({
          id: `op_payment_${newPayId}_${Date.now()}`,
          collection: 'paymentAccounts',
          type: 'set',
          docId: newPayId,
          data: newPaymentAccount,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const id = editId || 'tx_' + Date.now().toString();
    const normalizedTransaction = normalizeTransaction({
      ...txData,
      id,
      transactionType: txData.transactionType || 'player',
      playerId: txData.transactionType === 'transfer' ? '' : txData.playerId || '',
      playerName: txData.transactionType === 'transfer' ? '' : txData.playerName || '',
      category: txData.transactionType === 'transfer' ? 'Transfer' : txData.category,
      paymentAccountId: txData.transactionType === 'transfer' ? undefined : paymentAccountId,
      paymentAccountType: txData.transactionType === 'transfer' ? undefined : txData.paymentAccountType,
      paymentAccountNumber: txData.transactionType === 'transfer' ? undefined : txData.paymentAccountNumber,
      toAccount: txData.transactionType === 'transfer' ? txData.toAccount || '' : undefined,
    });

    const nextTransactions = editId
      ? transactions.map((t) => (t.id === id ? normalizedTransaction : t))
      : [...transactions, normalizedTransaction];

    saveLocalTransactions(user.uid, nextTransactions);

    const transactionOp: OfflineOperation = {
      id: `op_tx_${id}_${Date.now()}`,
      collection: 'transactions',
      type: 'set',
      docId: id,
      data: normalizedTransaction,
      createdAt: new Date().toISOString(),
    };

    try {
      const transactionResult = await enqueueOrSync(transactionOp);
      for (const op of pendingAccountOps) {
        await enqueueOrSync(op);
      }

      if (normalizedTransaction.transactionType === 'owner' && normalizedTransaction.ownerCategory === 'transfer') {
        const passcode = ownerPasscode;
        if (passcode) {
          try {
            const ownerData = await loadLatestOwnerPrivateData(passcode);
            const accountName = normalizedTransaction.account || 'Unknown';
            const accountKey = accountName.toLowerCase();
            let ownerAccount = ownerData.accounts.find((acc) => {
              const name = acc.name?.toString().toLowerCase() || '';
              const type = acc.type?.toString().toLowerCase() || '';
              return name === accountKey || type === accountKey;
            });
            const nextAccounts = [...ownerData.accounts];

            if (!ownerAccount) {
              ownerAccount = {
                id: `priv_acc_${Date.now()}`,
                name: accountName,
                type: accountName,
                baseBalance: 0,
              };
              nextAccounts.push(ownerAccount);
            }

            const privateTx = {
              id: `priv_tx_${Date.now()}`,
              date: normalizedTransaction.date,
              type: normalizedTransaction.ownerTransferDirection === 'business_to_owner' ? 'Income' : 'Expense',
              amount: normalizedTransaction.amount,
              accountId: ownerAccount.id,
              remark:
                normalizedTransaction.ownerTransferDirection === 'business_to_owner'
                  ? 'Received from Business'
                  : 'Sent to Business',
            };

            const nextOwnerData = {
              accounts: nextAccounts,
              transactions: [privateTx, ...(ownerData.transactions || [])],
            };

            setOwnerPrivateData(nextOwnerData);
            await saveOwnerPrivateData(nextOwnerData, passcode);
          } catch (err) {
            console.error('Failed to update owner private data from business transaction', err);
          }
        }
      }

      return transactionResult;
    } catch (err) {
      saveLocalTransactions(user.uid, previousTransactions);
      if (pendingAccountOps.length > 0) {
        saveLocalPaymentAccounts(user.uid, previousPaymentAccounts);
      }
      throw err;
    }
  }, [user, transactions, paymentAccounts, ownerPasscode, enqueueOrSync, saveLocalPaymentAccounts, saveLocalTransactions, loadLatestOwnerPrivateData, saveOwnerPrivateData]);

  const handleDeletePaymentAccount = async (idToRemove: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'paymentAccounts', idToRemove));
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!user) return;

    const previousTransactions = transactions;
    const nextTransactions = transactions.filter((tx) => tx.id !== txId);
    saveLocalTransactions(user.uid, nextTransactions);

    const deleteOp: OfflineOperation = {
      id: `op_tx_del_${txId}_${Date.now()}`,
      collection: 'transactions',
      type: 'delete',
      docId: txId,
      createdAt: new Date().toISOString(),
    };

    try {
      await enqueueOrSync(deleteOp);
    } catch (err) {
      saveLocalTransactions(user.uid, previousTransactions);
      throw err;
    }
  };

  const hideOwnerPrivatePage = () => {
    setIsOwnerPrivateOpen(false);
  };

  const lockOwnerPrivatePage = () => {
    setIsOwnerPrivateOpen(false);
    setIsOwnerUnlocked(false);
    setOwnerPrivateData(null);
    setOwnerPasscode(null);
    setIsOwnerPassOpen(false);
  };

  // Owner private finance helpers (encrypted storage)
  const recoveryPasswordFor = (uid: string) => `recovery-${uid}-v1`;

  const handleForgotPasscodeStart = async () => {
    if (!user) return alert('Not authenticated');
    try {
      // Re-authenticate the Firebase user to verify ownership
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle({ scopes: ['email', 'profile'], useCredentialManager: false });
        const credential = GoogleAuthProvider.credential(result.credential?.idToken);
        if (!auth.currentUser) throw new Error('No authenticated user');
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else {
        if (!auth.currentUser) throw new Error('No authenticated user');
        await reauthenticateWithPopup(auth.currentUser, googleProvider);
      }

      const localState = loadOfflineOwnerEncryptedState(user.uid);
      let recoveryEnc: any = localState.meta?.recoveryEncrypted;

      if (!recoveryEnc && navigator.onLine) {
        const metaRef = doc(db, 'users', user.uid, PRIVATE_DOC_ID, 'meta');
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
          const meta = metaSnap.data() as any;
          recoveryEnc = meta?.recoveryEncrypted;
        }
      }

      if (!recoveryEnc) {
        if (ownerPrivateData) {
          // Create a recovery backup from existing unlocked data
          const recoveryPass = recoveryPasswordFor(user.uid);
          const recoveryEncrypted = await encryptJson(recoveryPass, { ...ownerPrivateData, updatedAt: new Date().toISOString() });
          saveLocalOwnerMeta(user.uid, { recoveryEncrypted });
          if (navigator.onLine) {
            await enqueueOrSync({
              id: `op_private_meta_${Date.now()}`,
              collection: 'privateMeta',
              type: 'set',
              docId: 'meta',
              data: { recoveryEncrypted },
              createdAt: new Date().toISOString(),
            });
          }
          recoveryEnc = recoveryEncrypted;
        }
      }

      if (!recoveryEnc) {
        return alert('No recovery information available for this account.');
      }

      const recPass = recoveryPasswordFor(user.uid);
      const recovered = await decryptJson(recPass, recoveryEnc);
      setPendingRecoveredData({ accounts: recovered.accounts || [], transactions: recovered.transactions || [] });
      setOwnerPassMode('set');
      setIsOwnerPassOpen(true);
    } catch (err) {
      console.error('Forgot passcode flow failed', err);
      alert('Forgot passcode flow failed: re-authentication or recovery failed');
    }
  };

  const handleOwnerPassSubmit = async (passcode: string) => {
    if (!user) return;

    const offlineState = loadOfflineOwnerEncryptedState(user.uid);

    // If we're in 'set' mode and have pending recovered data, use passcode as new pass
    if (ownerPassMode === 'set' && pendingRecoveredData) {
      try {
        await saveOwnerPrivateData(pendingRecoveredData, passcode);
        setOwnerPrivateData(pendingRecoveredData);
        setPendingRecoveredData(null);
        setOwnerPasscode(passcode);
        setOwnerPassMode('unlock');
        setIsOwnerUnlocked(true);
        setIsOwnerPassOpen(false);
        setIsOwnerPrivateOpen(true);
      } catch (err) {
        console.error('Failed to set new passcode', err);
        alert('Failed to set new passcode');
      }
      return;
    }

    try {
      const ref = doc(db, 'users', user.uid, PRIVATE_DOC_ID, PRIVATE_SUBDOC);
      let encrypted: any = null;
      let snap = null;

      if (navigator.onLine) {
        try {
          snap = await getDoc(ref);
        } catch (err) {
          console.warn('Unable to fetch private doc from Firestore, will try local cache', err);
        }
      }

      if (snap && snap.exists()) {
        encrypted = snap.data();
      } else if (offlineState.encrypted) {
        encrypted = offlineState.encrypted;
      }

      if (!encrypted) {
        const empty = { accounts: [], transactions: [], createdAt: new Date().toISOString() };
        await saveOwnerPrivateData(empty, passcode);
        setOwnerPrivateData(empty);
        setOwnerPasscode(passcode);
        setOwnerPassMode('unlock');
        setIsOwnerUnlocked(true);
        setIsOwnerPassOpen(false);
        setIsOwnerPrivateOpen(true);
        return;
      }

      const decrypted = await decryptJson(passcode, encrypted);
      const ownerData = { accounts: decrypted.accounts || [], transactions: decrypted.transactions || [] };
      setOwnerPrivateData(ownerData);
      setOwnerPasscode(passcode);
      setOwnerPassMode('unlock');
      setIsOwnerUnlocked(true);
      setIsOwnerPassOpen(false);
      setIsOwnerPrivateOpen(true);

      // If recovery backup is missing, ensure it's created for future recovery.
      const metaRef = doc(db, 'users', user.uid, PRIVATE_DOC_ID, 'meta');
      let recoveryMeta: any = offlineState.meta;
      if (navigator.onLine) {
        try {
          const metaSnap = await getDoc(metaRef);
          if (metaSnap.exists()) recoveryMeta = metaSnap.data();
        } catch (err) {
          console.warn('Unable to fetch recovery meta from Firestore', err);
        }
      }

      if (!recoveryMeta?.recoveryEncrypted) {
        await saveOwnerPrivateData(ownerData, passcode);
      }
    } catch (err) {
      console.error('Owner unlock failed', err);
      alert('Unlock failed: incorrect passcode or decryption error');
    }
  };

  async function saveOwnerPrivateData(data: { accounts: any[]; transactions: any[] }, passcode: string) {
    if (!user) return;

    const payload = { ...data, updatedAt: new Date().toISOString() };
    const enc = await encryptJson(passcode, payload);
    const recoveryPass = recoveryPasswordFor(user.uid);
    const recoveryEnc = await encryptJson(recoveryPass, payload);

    saveLocalOwnerEncrypted(user.uid, enc);
    saveLocalOwnerMeta(user.uid, { recoveryEncrypted: recoveryEnc });
    setOwnerPrivateData(data);

    const privateOp: OfflineOperation = {
      id: `op_private_${Date.now()}`,
      collection: 'private',
      type: 'set',
      docId: PRIVATE_SUBDOC,
      data: enc,
      createdAt: new Date().toISOString(),
    };
    const metaOp: OfflineOperation = {
      id: `op_private_meta_${Date.now()}`,
      collection: 'privateMeta',
      type: 'set',
      docId: 'meta',
      data: { recoveryEncrypted: recoveryEnc },
      createdAt: new Date().toISOString(),
    };

    const result = await enqueueOrSync(privateOp);
    await enqueueOrSync(metaOp);
    return result;
  };

  const openOwnerPrivatePage = () => {
    if (isOwnerUnlocked) {
      setIsOwnerPrivateOpen(true);
    } else {
      setIsOwnerPassOpen(true);
    }
  };

  const handleChangeOwnerPasscode = async (currentPass: string, newPass: string) => {
    if (!user) return false;
    try {
      const localState = loadOfflineOwnerEncryptedState(user.uid);
      let encrypted: any = null;
      let snap: any = null;
      const ref = doc(db, 'users', user.uid, PRIVATE_DOC_ID, PRIVATE_SUBDOC);

      if (navigator.onLine) {
        try {
          snap = await getDoc(ref);
        } catch (err) {
          console.warn('Unable to fetch private data from Firestore, using local cache', err);
        }
      }

      if (snap && snap.exists()) {
        encrypted = snap.data();
      } else if (localState.encrypted) {
        encrypted = localState.encrypted;
      }

      if (!encrypted) return false;

      const decrypted = await decryptJson(currentPass, encrypted);
      const dataToUse = ownerPrivateData || { accounts: decrypted.accounts || [], transactions: decrypted.transactions || [] };
      await saveOwnerPrivateData({ accounts: dataToUse.accounts || [], transactions: dataToUse.transactions || [] }, newPass);
      setOwnerPasscode(newPass);
      return true;
    } catch (err) {
      console.error('Change passcode failed', err);
      return false;
    }
  };

  const handleLockOwner = () => {
    lockOwnerPrivatePage();
  };

  // 10. Player Details Modal
  const handleOpenPlayerDetails = (player: Player) => {
    setSelectedPlayer(player);
    setIsDetailsModalOpen(true);
  };

  const handleNavigateToTab = (tab: string) => {
    setCurrentTab(tab);
  };

  // 11. Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Player Finance...</p>
        </div>
      </div>
    );
  }

  // 12. Login Screen (Unauthenticated state)
  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 flex items-center justify-center font-sans px-4 antialiased">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-md bg-white/85 backdrop-blur-lg border border-slate-100/80 rounded-3xl p-8 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          
          <div className="mb-8">
          <img
  src={logo}
  alt="Player Finance"
  className="w-24 h-24 mx-auto mb-4 rounded-3xl shadow-xl"
/>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Player Finance</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Manage players, transactions, and balances in real time.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold shadow-lg hover:shadow-slate-900/10 transition-all duration-200 cursor-pointer active:scale-98 group disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningIn ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span className="group-hover:translate-x-0.5 transition-transform">{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
            {authError && (
              <p className="text-sm font-medium text-rose-600">{authError}</p>
            )}
            <p className="text-xs text-slate-400 mt-4 leading-normal">
              By signing in, you agree to store your data securely in Cloud Firestore with multi-device offline synchronization.
            </p>
          </div>

          <div className="mt-10 pt-5 border-t border-slate-200/60">
            <p className="text-[11px] text-slate-400 font-medium">Developed by</p>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Ye Htun Naing</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">
              AI Assisted Development • OpenAI ChatGPT
            </p>
            <p className="text-[10px] text-slate-400 mt-1">© 2026 Player Finance</p>
          </div>
        </div>
      </div>
    );
  }

  if (isOwnerPrivateOpen) {
    return (
      <OwnerPrivatePage
        isOpen={true}
        onClose={hideOwnerPrivatePage}
        data={ownerPrivateData}
        businessTransactions={transactions}
        onSave={async (d) => {
          const pass = ownerPasscode;
          if (!pass) return alert('Owner locked. Please unlock with passcode first.');
          await saveOwnerPrivateData(d, pass);
        }}
        onChangePasscode={handleChangeOwnerPasscode}
        onLockNow={handleLockOwner}
      />
    );
  }

  // 13. Authenticated dashboard view
  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans select-none antialiased">
      {/* Main Container */}
      <main className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#f8fafc] min-h-screen shadow-xs relative flex flex-col px-4 sm:px-5 md:px-6 pt-8 pb-20">
        
        {/* User Profile Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100/80">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-9 w-9 rounded-full ring-2 ring-blue-500/10"
                onMouseDown={() => {
                  ownerUnlockTimer.current = window.setTimeout(openOwnerPrivatePage, 800);
                }}
                onMouseUp={() => {
                  if (ownerUnlockTimer.current) { window.clearTimeout(ownerUnlockTimer.current); ownerUnlockTimer.current = null; }
                }}
                onMouseLeave={() => {
                  if (ownerUnlockTimer.current) { window.clearTimeout(ownerUnlockTimer.current); ownerUnlockTimer.current = null; }
                }}
                onTouchStart={() => {
                  ownerUnlockTimer.current = window.setTimeout(openOwnerPrivatePage, 900);
                }}
                onTouchEnd={() => {
                  if (ownerUnlockTimer.current) { window.clearTimeout(ownerUnlockTimer.current); ownerUnlockTimer.current = null; }
                }}
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm"
                onMouseDown={() => {
                  ownerUnlockTimer.current = window.setTimeout(openOwnerPrivatePage, 800);
                }}
                onMouseUp={() => {
                  if (ownerUnlockTimer.current) { window.clearTimeout(ownerUnlockTimer.current); ownerUnlockTimer.current = null; }
                }}
                onMouseLeave={() => {
                  if (ownerUnlockTimer.current) { window.clearTimeout(ownerUnlockTimer.current); ownerUnlockTimer.current = null; }
                }}
                onTouchStart={() => {
                  ownerUnlockTimer.current = window.setTimeout(openOwnerPrivatePage, 900);
                }}
                onTouchEnd={() => {
                  if (ownerUnlockTimer.current) { window.clearTimeout(ownerUnlockTimer.current); ownerUnlockTimer.current = null; }
                }}
              >
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Operator</p>
              <h4 className="text-sm font-semibold text-slate-800 leading-tight">{user.displayName || user.email}</h4>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-slate-100 hover:border-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Dynamic Tab Render */}
        <div className="flex-1">
          {currentTab === 'Home' && (
            <HomeTab
              players={players}
              transactions={transactions}
              accounts={accounts}
              onNavigateToTab={handleNavigateToTab}
              onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
            />
          )}

          {currentTab === 'Exchange' && (
            <ExchangeTab
              transactions={transactions}
              players={players}
              accounts={accounts}
              paymentAccounts={paymentAccounts}
              onAddTransaction={(preset, accountId) => handleOpenAddTransaction(undefined, preset, accountId)}
              onEditTransaction={handleOpenEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentTab === 'Analytics' && (
            <AnalyticsTab transactions={transactions} players={players} accounts={accounts} />
          )}

          {currentTab === 'Players' && (
            <PlayersTab
              players={players}
              transactions={transactions}
              onAddPlayer={handleOpenAddPlayer}
              onOpenPlayerDetails={handleOpenPlayerDetails}
            />
          )}

          {currentTab === 'Agency' && (
            <AgencyTab players={players} transactions={transactions} />
          )}

          {currentTab === 'Settings' && (
            <AboutTab onLogout={handleLogout} />
          )}
        </div>

        {/* BOTTOM TAB NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur-md border-t border-slate-100/80 px-4 py-2.5 flex items-center justify-between shadow-[0_-8px_20px_-8px_rgba(15,23,42,0.06)] z-30 rounded-t-2xl">
          {[
            { id: 'Home', icon: Home, label: 'Home' },
            { id: 'Exchange', icon: ArrowLeftRight, label: 'Exchange' },
            { id: 'Players', icon: Users, label: 'Players' },
            { id: 'Agency', icon: Briefcase, label: 'Agency' },
            { id: 'Analytics', icon: TrendingUp, label: 'Analytics' },
            { id: 'Settings', icon: Info, label: 'Settings' },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className="flex flex-col items-center flex-1 justify-center relative py-1 cursor-pointer transition-all focus:outline-hidden"
              >
                {/* Active Highlight Circle Pill background */}
                {isActive && (
                  <span className="absolute inset-0 mx-auto w-12 h-12 bg-blue-50 rounded-full -top-1.5 -z-10 animate-fade-in" />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'text-blue-600 scale-110 stroke-[2.5]' : 'text-slate-400 group-hover:text-slate-600 stroke-[2]'
                  }`}
                />
                <span
                  className={`text-[9px] font-bold mt-1 tracking-wider ${
                    isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* MODAL WINDOWS OVERLAYS */}

      {/* 1. Player Creator / Editor Modal */}
      <AddEditPlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => {
          setIsPlayerModalOpen(false);
          setEditingPlayer(undefined);
        }}
        onSave={handleSavePlayer}
        editPlayer={editingPlayer || undefined}
        existingPlayerIds={players.map((p) => p.playerId)}
        agencies={agencies}
      />

      {/* 2. Transaction Creator / Editor Modal */}
      <AddEditTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(undefined);
          setPreselectedPlayerIdForTx(undefined);
          setDefaultAccountIdForTx(undefined);
          setQuickActionPreset(undefined);
        }}
        onSave={handleSaveTransaction}
        editTransaction={editingTransaction || undefined}
        players={players}
        defaultPlayerId={preselectedPlayerIdForTx}
        defaultAccountId={defaultAccountIdForTx}
        accounts={accounts}
        paymentAccounts={paymentAccounts}
        initialQuickAction={quickActionPreset}
      />

      {/* 3. Player Details Modal */}
      <PlayerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPlayer(null);
        }}
        player={selectedPlayer}
        transactions={transactions}
        accounts={accounts}
        paymentAccounts={paymentAccounts}
        onEditPlayer={(player) => {
          handleOpenEditPlayer(player);
        }}
        onDeletePlayer={handleDeletePlayer}
        onAddTransaction={(pId) => {
          handleOpenAddTransaction(pId);
        }}
        onAddPaymentAccount={(playerId) => {
          setPaymentAccountPlayerId(playerId);
          setEditingPaymentAccount(undefined);
          setIsPaymentAccountModalOpen(true);
        }}
        onEditPaymentAccount={(account) => {
          setEditingPaymentAccount(account);
          setPaymentAccountPlayerId(account.playerId);
          setIsPaymentAccountModalOpen(true);
        }}
        onDeletePaymentAccount={handleDeletePaymentAccount}
        onEditTransaction={(tx) => {
          handleOpenEditTransaction(tx);
        }}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <AddEditPaymentAccountModal
  isOpen={isPaymentAccountModalOpen}
  onClose={() => {
    setIsPaymentAccountModalOpen(false);
    setEditingPaymentAccount(undefined);
    setPaymentAccountPlayerId('');
  }}
  onSave={(data, editId) => {
    handleSavePaymentAccount(
      {
        ...data,
        playerId: paymentAccountPlayerId!,
      },
      editId
    );

    setIsPaymentAccountModalOpen(false);
    setEditingPaymentAccount(undefined);
    setPaymentAccountPlayerId('');
  }}
  editAccount={editingPaymentAccount}
  playerId={paymentAccountPlayerId ?? ''}
/>

      {/* Owner Private Finance (hidden) */}
      <OwnerPasscodeModal
        isOpen={isOwnerPassOpen}
        onClose={() => { setIsOwnerPassOpen(false); setOwnerPassMode('unlock'); setPendingRecoveredData(null); }}
        onSubmit={(pass) => handleOwnerPassSubmit(pass)}
        onForgot={() => handleForgotPasscodeStart()}
        allowSet={ownerPassMode === 'set'}
      />

      {/* 4. Account Management Modal */}
      <AccountManagementModal
        isOpen={isAccountManagementOpen}
        onClose={() => setIsAccountManagementOpen(false)}
        accounts={accounts}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
        transactions={transactions}
      />
    </div>
  );
}
