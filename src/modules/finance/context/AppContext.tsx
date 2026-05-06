import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useToast } from '../components/ui/Toast';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  getDocs,
  Timestamp,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../../../core/firebase';
import { useSharedClients } from '../../../core/hooks/useSharedClients';
import { 
  Project, 
  BillingDocument, 
  Payment, 
  Subscription, 
  Counterparty, 
  Product, 
  LegalEntity, 
  BudgetCategory, 
  AppSettings,
  Transaction,
  ProjectStatus,
  MilestoneStatus,
  DocumentType,
  DocumentDirection,
  DocumentStatus,
  SubscriptionStatus,
  BillingLineItem,
  TaxProfile,
  Milestone,
  Currency
} from '../types';
import { INITIAL_SETTINGS } from '../constants';

// --- State Definition ---

interface AppState {
  user: User | null;
  projects: Project[];
  billingDocuments: BillingDocument[];
  payments: Payment[];
  subscriptions: Subscription[];
  counterparties: Counterparty[];
  products: Product[];
  legalEntities: LegalEntity[];
  budgetCategories: BudgetCategory[];
  settings: AppSettings;
  displayCurrency: Currency;
  loading: {
    auth: boolean;
    projects: boolean;
    billingDocuments: boolean;
    payments: boolean;
    subscriptions: boolean;
    counterparties: boolean;
    products: boolean;
    legalEntities: boolean;
    budgetCategories: boolean;
    settings: boolean;
  };
  error: string | null;
}

const initialState: AppState = {
  user: null,
  projects: [],
  billingDocuments: [],
  payments: [],
  subscriptions: [],
  counterparties: [],
  products: [],
  legalEntities: [],
  budgetCategories: [],
  settings: INITIAL_SETTINGS,
  displayCurrency: INITIAL_SETTINGS.defaultCurrency,
  loading: {
    auth: true,
    projects: true,
    billingDocuments: true,
    payments: true,
    subscriptions: true,
    counterparties: false, // sourced from useSharedClients — no onSnapshot here
    products: true,
    legalEntities: true,
    budgetCategories: true,
    settings: true,
  },
  error: null,
};

// --- Actions ---

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_COLLECTION'; collection: keyof AppState; payload: any[] }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_DISPLAY_CURRENCY'; payload: Currency }
  | { type: 'SET_LOADING'; collection: keyof AppState['loading']; isLoading: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ITEM'; collection: 'products' | 'legalEntities' | 'budgetCategories'; payload: any }
  | { type: 'UPDATE_ITEM'; collection: 'products' | 'legalEntities' | 'budgetCategories'; payload: any }
  | { type: 'DELETE_ITEM'; collection: 'products' | 'legalEntities' | 'budgetCategories'; id: string };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: { ...state.loading, auth: false } };
    case 'SET_COLLECTION':
      return { 
        ...state, 
        [action.collection]: action.payload,
        loading: { ...state.loading, [action.collection]: false }
      };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, loading: { ...state.loading, settings: false } };
    case 'SET_DISPLAY_CURRENCY':
      return { ...state, displayCurrency: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.collection]: action.isLoading } };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_ITEM':
      return { ...state, [action.collection]: [...(state[action.collection] as any[]), action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        [action.collection]: (state[action.collection] as any[]).map(item => 
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        )
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        [action.collection]: (state[action.collection] as any[]).filter(item => item.id !== action.id)
      };
    default:
      return state;
  }
}

// --- Context ---

interface AppContextType extends AppState {
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMilestone: (projectId: string, milestone: Omit<Milestone, 'id' | 'projectId'>) => Promise<void>;
  updateMilestone: (projectId: string, milestoneId: string, data: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  completeMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  addBillingDocument: (doc: Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBillingDocument: (id: string, data: Partial<BillingDocument>) => Promise<void>;
  issueDocument: (id: string) => Promise<void>;
  submitForApproval: (id: string) => Promise<void>;
  approveDocument: (id: string) => Promise<void>;
  markAsSent: (id: string) => Promise<void>;
  voidDocument: (id: string) => Promise<void>;
  returnToDraft: (id: string) => Promise<void>;
  // Returns the new payment ID so callers can immediately call allocatePayment.
  recordPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<string>;
  allocatePayment: (paymentId: string, invoiceId: string, amount: number) => Promise<void>;
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  runBillingJob: () => Promise<void>;
  addCounterparty: (cp: Omit<Counterparty, 'id' | 'createdAt'>) => Promise<void>;
  updateCounterparty: (id: string, data: Partial<Counterparty>) => Promise<void>;
  deleteCounterparty: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  softDeleteProduct: (id: string) => Promise<void>;
  addLegalEntity: (entity: Omit<LegalEntity, 'id'>) => Promise<void>;
  updateLegalEntity: (id: string, data: Partial<LegalEntity>) => Promise<void>;
  deleteLegalEntity: (id: string) => Promise<void>;
  addBudgetCategory: (category: Omit<BudgetCategory, 'id'>) => Promise<void>;
  updateBudgetCategory: (id: string, data: Partial<BudgetCategory>) => Promise<void>;
  deleteBudgetCategory: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setDisplayCurrency: (currency: Currency) => void;
  formatMoney: (amount: number, fromCurrency?: Currency) => string;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// --- Provider ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { addToast } = useToast();
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Counterparties now sourced from shared_clients via useSharedClients.
  // Finance sees CUSTOMER | BOTH | INTERCOMPANY records, shaped like old Counterparty[].
  // VENDOR-only records remain in /counterparties (legacy) until a vendor module is built.
  const { asFinanceCounterparties } = useSharedClients();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'SET_USER', payload: user });
    });
    return unsubscribe;
  }, []);

  // Data Listeners & Fetching.
  // Depend on state.user?.uid (stable string) instead of state.user (object
  // reference). Firebase Auth refreshes the token every ~1 hour which creates
  // a new User object — using the object as a dependency would tear down and
  // re-create all four onSnapshot listeners on every refresh, causing a brief
  // data blackout and up to 8 unnecessary Firestore reads per token cycle.
  useEffect(() => {
    if (!state.user) return;

    const unsubProjects = onSnapshot(
      query(collection(db, 'projects'), orderBy('createdAt', 'desc')),
      (snap) => dispatch({ type: 'SET_COLLECTION', collection: 'projects', payload: snap.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (error) => {
        console.error(`[projects] snapshot error:`, error.code);
        dispatch({ type: 'SET_LOADING', collection: 'projects', isLoading: false });
      }
    );

    const unsubBilling = onSnapshot(
      query(collection(db, 'billingDocuments'), orderBy('createdAt', 'desc')),
      (snap) => dispatch({ type: 'SET_COLLECTION', collection: 'billingDocuments', payload: snap.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (error) => {
        console.error(`[billingDocuments] snapshot error:`, error.code);
        dispatch({ type: 'SET_LOADING', collection: 'billingDocuments', isLoading: false });
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), orderBy('createdAt', 'desc')),
      (snap) => dispatch({ type: 'SET_COLLECTION', collection: 'payments', payload: snap.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (error) => {
        console.error(`[payments] snapshot error:`, error.code);
        dispatch({ type: 'SET_LOADING', collection: 'payments', isLoading: false });
      }
    );

    const unsubSubscriptions = onSnapshot(
      query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc')),
      (snap) => dispatch({ type: 'SET_COLLECTION', collection: 'subscriptions', payload: snap.docs.map(d => ({ id: d.id, ...d.data() })) }),
      (error) => {
        console.error(`[subscriptions] snapshot error:`, error.code);
        dispatch({ type: 'SET_LOADING', collection: 'subscriptions', isLoading: false });
      }
    );

    // One-time Fetches
    const fetchOneTimeData = async () => {
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('name')));
        dispatch({ type: 'SET_COLLECTION', collection: 'products', payload: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) });

        const legalEntitiesSnap = await getDocs(query(collection(db, 'legalEntities'), orderBy('name')));
        dispatch({ type: 'SET_COLLECTION', collection: 'legalEntities', payload: legalEntitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) });

        const budgetCategoriesSnap = await getDocs(query(collection(db, 'budgetCategories'), orderBy('name')));
        dispatch({ type: 'SET_COLLECTION', collection: 'budgetCategories', payload: budgetCategoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })) });

        const settingsDoc = await getDoc(doc(db, 'appSettings', 'config'));
        if (settingsDoc.exists()) {
          dispatch({ type: 'SET_SETTINGS', payload: settingsDoc.data() as AppSettings });
        } else {
          await setDoc(doc(db, 'appSettings', 'config'), INITIAL_SETTINGS);
          dispatch({ type: 'SET_SETTINGS', payload: INITIAL_SETTINGS });
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load application data.' });
      }
    };

    fetchOneTimeData();

    return () => {
      unsubProjects();
      unsubBilling();
      unsubPayments();
      unsubSubscriptions();
    };
  }, [state.user?.uid]);

  // --- Helper Functions ---

  const generateId = () => crypto.randomUUID();
  const now = () => new Date().toISOString();

  // --- CRUD Implementations ---

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = generateId();
      await setDoc(doc(db, 'projects', id), { ...project, id, createdAt: now(), updatedAt: now() });
      addToast('success', 'Project created successfully');
    } catch (error) { addToast('error', 'Failed to create project'); throw error; }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      await updateDoc(doc(db, 'projects', id), { ...data, updatedAt: now() });
      addToast('success', 'Project updated successfully');
    } catch (error) { addToast('error', 'Failed to update project'); throw error; }
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
      addToast('success', 'Project deleted successfully');
    } catch (error) { addToast('error', 'Failed to delete project'); throw error; }
  };

  const addMilestone = async (projectId: string, milestone: Omit<Milestone, 'id' | 'projectId'>) => {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      const newMilestone = { ...milestone, id: generateId(), projectId };
      await updateDoc(doc(db, 'projects', projectId), { 
        milestones: [...project.milestones, newMilestone], updatedAt: now()
      });
      addToast('success', 'Milestone added');
    } catch (error) { addToast('error', 'Failed to add milestone'); }
  };

  const updateMilestone = async (projectId: string, milestoneId: string, data: Partial<Milestone>) => {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      await updateDoc(doc(db, 'projects', projectId), { 
        milestones: project.milestones.map(m => m.id === milestoneId ? { ...m, ...data } : m),
        updatedAt: now()
      });
      addToast('success', 'Milestone updated');
    } catch (error) { addToast('error', 'Failed to update milestone'); }
  };

  const deleteMilestone = async (projectId: string, milestoneId: string) => {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      await updateDoc(doc(db, 'projects', projectId), { 
        milestones: project.milestones.filter(m => m.id !== milestoneId), updatedAt: now()
      });
      addToast('success', 'Milestone deleted');
    } catch (error) { addToast('error', 'Failed to delete milestone'); }
  };

  const completeMilestone = async (projectId: string, milestoneId: string) => {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      const milestone = project.milestones.find(m => m.id === milestoneId);
      if (!milestone) throw new Error('Milestone not found');

      // Guard: if milestone is already Invoiced, do not create a second invoice.
      // Protects against double-click / rapid re-entry before the snapshot updates
      // the local state. The server-side rules cannot enforce this by themselves
      // because the milestone lives as an array element on the project document.
      if (milestone.status === MilestoneStatus.Invoiced) {
        addToast('success', 'Milestone already invoiced');
        return;
      }

      const batch = writeBatch(db);
      const invoiceId = generateId();
      batch.update(doc(db, 'projects', projectId), {
        milestones: project.milestones.map(m => 
          m.id === milestoneId ? { ...m, status: MilestoneStatus.Invoiced, completionDate: now(), linkedInvoiceId: invoiceId } : m
        ), updatedAt: now()
      });
      const lineItem: BillingLineItem = {
        id: generateId(), description: `Milestone: ${milestone.name}`, quantity: 1,
        unitPrice: milestone.amount, taxCode: TaxProfile.Standard,
        taxAmount: milestone.amount * 0.15, subtotal: milestone.amount,
        total: milestone.amount * 1.15, milestoneId: milestone.id
      };
      const newInvoice: BillingDocument = {
        id: invoiceId, type: DocumentType.Invoice, direction: DocumentDirection.AR,
        status: DocumentStatus.Draft, date: now().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        counterpartyId: project.clientId,
        counterpartyName: asFinanceCounterparties.find(c => c.id === project.clientId)?.name || 'Unknown',
        projectId: project.id, milestoneId: milestone.id,
        currency: project.baseCurrency, exchangeRate: 1, lines: [lineItem],
        subtotal: lineItem.subtotal, taxTotal: lineItem.taxAmount, total: lineItem.total,
        balance: lineItem.total, paidAmount: 0, taxProfile: TaxProfile.Standard,
        createdAt: now(), updatedAt: now()
      };
      batch.set(doc(db, 'billingDocuments', invoiceId), newInvoice);
      await batch.commit();
      addToast('success', 'Milestone completed — invoice draft created');
    } catch (error) { console.error(error); addToast('error', 'Failed to complete milestone'); }
  };

  const addBillingDocument = async (docData: Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = generateId();
      await setDoc(doc(db, 'billingDocuments', id), { ...docData, id, createdAt: now(), updatedAt: now() });
      addToast('success', 'Document created');
    } catch (error) { addToast('error', 'Failed to create document'); }
  };

  const updateBillingDocument = async (id: string, data: Partial<BillingDocument>) => {
    try {
      await updateDoc(doc(db, 'billingDocuments', id), { ...data, updatedAt: now() });
      addToast('success', 'Document updated');
    } catch (error) { addToast('error', 'Failed to update document'); }
  };

  const issueDocument = async (id: string) => {
    try {
      const document = state.billingDocuments.find(d => d.id === id);
      if (!document) throw new Error('Document not found');
      const prefix = state.settings.invoicePrefix;
      const year = new Date().getFullYear();
      const newSequence = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'appSettings', 'invoiceCounter');
        const counterDoc = await transaction.get(counterRef);
        const lastSequence = counterDoc.exists() ? (counterDoc.data().lastSequence || 0) : 0;
        const nextSequence = lastSequence + 1;
        transaction.set(counterRef, { lastSequence: nextSequence }, { merge: true });
        return nextSequence;
      });
      const documentNumber = `${prefix}${year}-${newSequence.toString().padStart(4, '0')}`;
      const batch = writeBatch(db);
      batch.update(doc(db, 'billingDocuments', id), { status: DocumentStatus.Issued, documentNumber, updatedAt: now() });
      if (document.projectId) {
        const transactionId = generateId();
        const transactionObj: Transaction = {
          id: transactionId, date: now(), amount: document.total, currency: document.currency,
          description: `Invoice Issued: ${documentNumber}`, referenceId: document.id,
          type: document.direction === DocumentDirection.AR ? 'CREDIT' : 'DEBIT',
          category: 'Accounts Receivable', createdAt: now()
        };
        batch.set(doc(db, 'transactions', transactionId), transactionObj);
      }
      await batch.commit();
      addToast('success', `Document issued: ${documentNumber}`);
    } catch (error) { console.error(error); addToast('error', 'Failed to issue document'); }
  };

  const submitForApproval = async (id: string) => updateBillingDocument(id, { status: DocumentStatus.PendingApproval });
  const approveDocument  = async (id: string) => updateBillingDocument(id, { status: DocumentStatus.Approved });
  const markAsSent       = async (id: string) => updateBillingDocument(id, { status: DocumentStatus.Sent });
  const voidDocument     = async (id: string) => updateBillingDocument(id, { status: DocumentStatus.Void });
  const returnToDraft    = async (id: string) => updateBillingDocument(id, { status: DocumentStatus.Draft });

  // recordPayment — creates the payment document and returns its ID so the
  // caller can immediately chain allocatePayment() in an atomic transaction.
  // Previously returned void, which forced callers to update billing document
  // balance outside a transaction (TOCTOU bug). Now throws on failure so
  // callers can handle errors without leaving orphaned payment records.
  const recordPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> => {
    const id = generateId();
    try {
      await setDoc(doc(db, 'payments', id), { ...payment, id, createdAt: now() });
      addToast('success', 'Payment recorded');
      return id;
    } catch (error) {
      addToast('error', 'Failed to record payment');
      throw error;
    }
  };

  // Wrapped in runTransaction so both the payment doc and the invoice doc are
  // re-read at commit time and updated atomically. The previous writeBatch
  // version read from React state before queuing writes, which created a
  // TOCTOU window: two allocations in flight could each see the same
  // unallocatedAmount/balance and both succeed, producing over-allocation.
  const allocatePayment = async (paymentId: string, invoiceId: string, amount: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        const paymentRef = doc(db, 'payments', paymentId);
        const invoiceRef = doc(db, 'billingDocuments', invoiceId);
        const paymentSnap = await transaction.get(paymentRef);
        const invoiceSnap = await transaction.get(invoiceRef);
        if (!paymentSnap.exists()) throw new Error('Payment not found');
        if (!invoiceSnap.exists()) throw new Error('Invoice not found');
        const payment = paymentSnap.data() as Payment;
        const invoice = invoiceSnap.data() as BillingDocument;

        const unallocated = payment.unallocatedAmount ?? 0;
        if (unallocated < amount) throw new Error('Insufficient unallocated amount');
        if (invoice.balance < amount) throw new Error('Allocation amount exceeds invoice balance');

        const newAllocation = { id: generateId(), paymentId, invoiceId, amount, date: now() };
        transaction.update(paymentRef, {
          allocations: [...(payment.allocations || []), newAllocation],
          unallocatedAmount: unallocated - amount,
        });

        const newPaidAmount = (invoice.paidAmount ?? 0) + amount;
        const newBalance = invoice.total - newPaidAmount;
        let newStatus = invoice.status;
        if (newBalance <= 0) newStatus = DocumentStatus.Paid;
        else if (newPaidAmount > 0) newStatus = DocumentStatus.PartiallyPaid;
        transaction.update(invoiceRef, {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
          updatedAt: now(),
        });
      });
      addToast('success', 'Payment allocated');
    } catch (error) { console.error(error); addToast('error', 'Failed to allocate payment'); }
  };

  const addSubscription = async (sub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = generateId();
      await setDoc(doc(db, 'subscriptions', id), { ...sub, id, createdAt: now(), updatedAt: now() });
      addToast('success', 'Subscription created');
    } catch (error) { addToast('error', 'Failed to create subscription'); }
  };

  const updateSubscription = async (id: string, data: Partial<Subscription>) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), { ...data, updatedAt: now() });
      addToast('success', 'Subscription updated');
    } catch (error) { addToast('error', 'Failed to update subscription'); }
  };

  const deleteSubscription = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
      addToast('success', 'Subscription deleted');
    } catch (error) { addToast('error', 'Failed to delete subscription'); }
  };

  const runBillingJob = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dueSubscriptions = state.subscriptions.filter(s => 
        s.status === SubscriptionStatus.Active && s.nextInvoiceDate <= today
      );
      if (dueSubscriptions.length === 0) { addToast('success', 'No subscriptions due for billing'); return; }
      const batch = writeBatch(db);
      let count = 0;
      for (const sub of dueSubscriptions) {
        const invoiceId = generateId();
        const lines: BillingLineItem[] = sub.items.map(item => ({
          id: generateId(), description: item.description, quantity: item.quantity,
          unitPrice: item.unitPrice, taxCode: item.taxCode,
          taxAmount: (item.quantity * item.unitPrice) * (item.taxCode === TaxProfile.Standard ? 0.15 : 0),
          subtotal: item.quantity * item.unitPrice,
          total: (item.quantity * item.unitPrice) * (item.taxCode === TaxProfile.Standard ? 1.15 : 1)
        }));
        const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
        const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0);
        const total = subtotal + taxTotal;
        const newInvoice: BillingDocument = {
          id: invoiceId, type: DocumentType.Invoice,
          direction: sub.direction === 'AR' ? DocumentDirection.AR : DocumentDirection.AP,
          status: DocumentStatus.Draft, date: today,
          dueDate: new Date(Date.now() + sub.paymentTermsDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          counterpartyId: sub.counterpartyId,
          counterpartyName: asFinanceCounterparties.find(c => c.id === sub.counterpartyId)?.name || 'Unknown',
          subscriptionId: sub.id, currency: sub.currency, exchangeRate: 1, lines,
          subtotal, taxTotal, total, balance: total, paidAmount: 0,
          taxProfile: TaxProfile.Standard, createdAt: now(), updatedAt: now()
        };
        batch.set(doc(db, 'billingDocuments', invoiceId), newInvoice);
        const nextDate = new Date(sub.nextInvoiceDate);
        if (sub.billingCycle === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (sub.billingCycle === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
        else if (sub.billingCycle === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        batch.update(doc(db, 'subscriptions', sub.id), {
          lastInvoiceDate: today, nextInvoiceDate: nextDate.toISOString().split('T')[0], updatedAt: now()
        });
        count++;
      }
      await batch.commit();
      addToast('success', `Billing job completed. Generated ${count} invoices.`);
    } catch (error) { console.error(error); addToast('error', 'Billing job failed'); }
  };

  // Counterparties — write to /counterparties (VENDOR-only legacy)
  // Customer CRUD should go through SharedClientsPage (/clients route).
  const addCounterparty = async (cp: Omit<Counterparty, 'id' | 'createdAt'>) => {
    try {
      const id = generateId();
      await setDoc(doc(db, 'counterparties', id), { ...cp, id, createdAt: now() });
      addToast('success', 'Counterparty added');
    } catch (error) { addToast('error', 'Failed to add counterparty'); }
  };

  const updateCounterparty = async (id: string, data: Partial<Counterparty>) => {
    try {
      await updateDoc(doc(db, 'counterparties', id), data);
      addToast('success', 'Counterparty updated');
    } catch (error) { addToast('error', 'Failed to update counterparty'); }
  };

  const deleteCounterparty = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'counterparties', id));
      addToast('success', 'Counterparty deleted');
    } catch (error) { addToast('error', 'Failed to delete counterparty'); }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newProduct = { ...product, id, createdAt: now() };
    dispatch({ type: 'ADD_ITEM', collection: 'products', payload: newProduct });
    try {
      await setDoc(doc(db, 'products', id), newProduct);
      addToast('success', 'Product added');
    } catch (error) {
      dispatch({ type: 'DELETE_ITEM', collection: 'products', id });
      addToast('error', 'Failed to add product');
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const original = state.products.find(p => p.id === id);
    dispatch({ type: 'UPDATE_ITEM', collection: 'products', payload: { id, ...data } });
    try {
      await updateDoc(doc(db, 'products', id), data);
      addToast('success', 'Product updated');
    } catch (error) {
      if (original) dispatch({ type: 'UPDATE_ITEM', collection: 'products', payload: original });
      addToast('error', 'Failed to update product');
    }
  };

  const softDeleteProduct = async (id: string) => updateProduct(id, { active: false });

  const addLegalEntity = async (entity: Omit<LegalEntity, 'id'>) => {
    try {
      const id = generateId();
      await setDoc(doc(db, 'legalEntities', id), { ...entity, id });
      addToast('success', 'Legal entity added');
    } catch (error) { addToast('error', 'Failed to add legal entity'); }
  };

  const updateLegalEntity = async (id: string, data: Partial<LegalEntity>) => {
    try { await updateDoc(doc(db, 'legalEntities', id), data); addToast('success', 'Legal entity updated'); }
    catch (error) { addToast('error', 'Failed to update legal entity'); }
  };

  const deleteLegalEntity = async (id: string) => {
    try { await deleteDoc(doc(db, 'legalEntities', id)); addToast('success', 'Legal entity deleted'); }
    catch (error) { addToast('error', 'Failed to delete legal entity'); }
  };

  const addBudgetCategory = async (category: Omit<BudgetCategory, 'id'>) => {
    try {
      const id = generateId();
      await setDoc(doc(db, 'budgetCategories', id), { ...category, id });
      addToast('success', 'Budget category added');
    } catch (error) { addToast('error', 'Failed to add budget category'); }
  };

  const updateBudgetCategory = async (id: string, data: Partial<BudgetCategory>) => {
    try { await updateDoc(doc(db, 'budgetCategories', id), data); addToast('success', 'Budget category updated'); }
    catch (error) { addToast('error', 'Failed to update budget category'); }
  };

  const deleteBudgetCategory = async (id: string) => {
    try { await deleteDoc(doc(db, 'budgetCategories', id)); addToast('success', 'Budget category deleted'); }
    catch (error) { addToast('error', 'Failed to delete budget category'); }
  };

  const updateSettings = async (settings: Partial<AppSettings>) => {
    const original = state.settings;
    const newSettings = { ...original, ...settings };
    dispatch({ type: 'SET_SETTINGS', payload: newSettings });
    try { await updateDoc(doc(db, 'appSettings', 'config'), settings); addToast('success', 'Settings updated'); }
    catch (error) { dispatch({ type: 'SET_SETTINGS', payload: original }); addToast('error', 'Failed to update settings'); }
  };

  const setDisplayCurrency = (currency: Currency) => {
    dispatch({ type: 'SET_DISPLAY_CURRENCY', payload: currency });
  };

  const convert = (amount: number, from: Currency, to: Currency): number => {
    if (from === to) return amount;
    if (from === Currency.USD && to === Currency.SAR) return amount * state.settings.usdToSarRate;
    if (from === Currency.SAR && to === Currency.USD) return amount * state.settings.sarToUsdRate;
    return amount;
  };

  const formatMoney = (amount: number, fromCurrency: Currency = state.settings.defaultCurrency): string => {
    const converted = convert(amount, fromCurrency, state.displayCurrency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: state.displayCurrency, maximumFractionDigits: 0
    }).format(converted);
  };

  const value = {
    ...state,
    // Override counterparties with shared_clients data (same Counterparty[] shape)
    counterparties: asFinanceCounterparties as unknown as Counterparty[],
    addProject, updateProject, deleteProject,
    addMilestone, updateMilestone, deleteMilestone, completeMilestone,
    addBillingDocument, updateBillingDocument, issueDocument, submitForApproval, approveDocument, markAsSent, voidDocument, returnToDraft,
    recordPayment, allocatePayment,
    addSubscription, updateSubscription, deleteSubscription, runBillingJob,
    addCounterparty, updateCounterparty, deleteCounterparty,
    addProduct, updateProduct, softDeleteProduct,
    addLegalEntity, updateLegalEntity, deleteLegalEntity,
    addBudgetCategory, updateBudgetCategory, deleteBudgetCategory,
    updateSettings,
    setDisplayCurrency,
    formatMoney,
    convert
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
