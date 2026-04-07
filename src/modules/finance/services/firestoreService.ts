import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDoc
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
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
  DocumentStatus,
  Currency
} from '../types';

// Helper for error handling
const handleFirestoreError = (error: unknown, operation: string) => {
  console.error(`Firestore Error [${operation}]:`, error);
  throw error;
};

// --- Projects ---
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'projects'));
    return querySnapshot.docs.map(doc => doc.data() as Project);
  } catch (error) {
    return handleFirestoreError(error, 'fetchProjects') as never;
  }
};

export const addProjectToDb = async (project: Project): Promise<void> => {
  try {
    await setDoc(doc(db, 'projects', project.id), project);
  } catch (error) {
    handleFirestoreError(error, 'addProjectToDb');
  }
};

export const updateProjectInDb = async (id: string, data: Partial<Project>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'projects', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateProjectInDb');
  }
};

export const deleteProjectFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteProjectFromDb');
  }
};

// --- Billing Documents ---
export const fetchBillingDocuments = async (): Promise<BillingDocument[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'billingDocuments'));
    return querySnapshot.docs.map(doc => doc.data() as BillingDocument);
  } catch (error) {
    return handleFirestoreError(error, 'fetchBillingDocuments') as never;
  }
};

export const addBillingDocumentToDb = async (document: BillingDocument): Promise<void> => {
  try {
    await setDoc(doc(db, 'billingDocuments', document.id), document);
  } catch (error) {
    handleFirestoreError(error, 'addBillingDocumentToDb');
  }
};

export const updateBillingDocumentInDb = async (id: string, data: Partial<BillingDocument>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'billingDocuments', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateBillingDocumentInDb');
  }
};

export const deleteBillingDocumentFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'billingDocuments', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteBillingDocumentFromDb');
  }
};

// --- Payments ---
export const fetchPayments = async (): Promise<Payment[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'payments'));
    return querySnapshot.docs.map(doc => doc.data() as Payment);
  } catch (error) {
    return handleFirestoreError(error, 'fetchPayments') as never;
  }
};

export const addPaymentToDb = async (payment: Payment): Promise<void> => {
  try {
    await setDoc(doc(db, 'payments', payment.id), payment);
  } catch (error) {
    handleFirestoreError(error, 'addPaymentToDb');
  }
};

export const updatePaymentInDb = async (id: string, data: Partial<Payment>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'payments', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updatePaymentInDb');
  }
};

export const deletePaymentFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'payments', id));
  } catch (error) {
    handleFirestoreError(error, 'deletePaymentFromDb');
  }
};

// --- Subscriptions ---
export const fetchSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'subscriptions'));
    return querySnapshot.docs.map(doc => doc.data() as Subscription);
  } catch (error) {
    return handleFirestoreError(error, 'fetchSubscriptions') as never;
  }
};

export const addSubscriptionToDb = async (subscription: Subscription): Promise<void> => {
  try {
    await setDoc(doc(db, 'subscriptions', subscription.id), subscription);
  } catch (error) {
    handleFirestoreError(error, 'addSubscriptionToDb');
  }
};

export const updateSubscriptionInDb = async (id: string, data: Partial<Subscription>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'subscriptions', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateSubscriptionInDb');
  }
};

export const deleteSubscriptionFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'subscriptions', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteSubscriptionFromDb');
  }
};

// --- Counterparties ---
export const fetchCounterparties = async (): Promise<Counterparty[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'counterparties'));
    return querySnapshot.docs.map(doc => doc.data() as Counterparty);
  } catch (error) {
    return handleFirestoreError(error, 'fetchCounterparties') as never;
  }
};

export const addCounterpartyToDb = async (counterparty: Counterparty): Promise<void> => {
  try {
    await setDoc(doc(db, 'counterparties', counterparty.id), counterparty);
  } catch (error) {
    handleFirestoreError(error, 'addCounterpartyToDb');
  }
};

export const updateCounterpartyInDb = async (id: string, data: Partial<Counterparty>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'counterparties', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateCounterpartyInDb');
  }
};

export const deleteCounterpartyFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'counterparties', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteCounterpartyFromDb');
  }
};

// --- Products ---
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => doc.data() as Product);
  } catch (error) {
    return handleFirestoreError(error, 'fetchProducts') as never;
  }
};

export const addProductToDb = async (product: Product): Promise<void> => {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (error) {
    handleFirestoreError(error, 'addProductToDb');
  }
};

export const updateProductInDb = async (id: string, data: Partial<Product>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'products', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateProductInDb');
  }
};

export const deleteProductFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteProductFromDb');
  }
};

// --- Legal Entities ---
export const fetchLegalEntities = async (): Promise<LegalEntity[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'legalEntities'));
    return querySnapshot.docs.map(doc => doc.data() as LegalEntity);
  } catch (error) {
    return handleFirestoreError(error, 'fetchLegalEntities') as never;
  }
};

export const addLegalEntityToDb = async (entity: LegalEntity): Promise<void> => {
  try {
    await setDoc(doc(db, 'legalEntities', entity.id), entity);
  } catch (error) {
    handleFirestoreError(error, 'addLegalEntityToDb');
  }
};

export const updateLegalEntityInDb = async (id: string, data: Partial<LegalEntity>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'legalEntities', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateLegalEntityInDb');
  }
};

export const deleteLegalEntityFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'legalEntities', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteLegalEntityFromDb');
  }
};

// --- Budget Categories ---
export const fetchBudgetCategories = async (): Promise<BudgetCategory[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'budgetCategories'));
    return querySnapshot.docs.map(doc => doc.data() as BudgetCategory);
  } catch (error) {
    return handleFirestoreError(error, 'fetchBudgetCategories') as never;
  }
};

export const addBudgetCategoryToDb = async (category: BudgetCategory): Promise<void> => {
  try {
    await setDoc(doc(db, 'budgetCategories', category.id), category);
  } catch (error) {
    handleFirestoreError(error, 'addBudgetCategoryToDb');
  }
};

export const updateBudgetCategoryInDb = async (id: string, data: Partial<BudgetCategory>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'budgetCategories', id), data);
  } catch (error) {
    handleFirestoreError(error, 'updateBudgetCategoryInDb');
  }
};

export const deleteBudgetCategoryFromDb = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'budgetCategories', id));
  } catch (error) {
    handleFirestoreError(error, 'deleteBudgetCategoryFromDb');
  }
};

// --- App Settings ---
export const fetchAppSettings = async (): Promise<AppSettings | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'appSettings', 'config'));
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
    return null;
  } catch (error) {
    return handleFirestoreError(error, 'fetchAppSettings') as never;
  }
};

export const updateAppSettingsInDb = async (settings: AppSettings): Promise<void> => {
  try {
    await setDoc(doc(db, 'appSettings', 'config'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'updateAppSettingsInDb');
  }
};

export const initializeAppSettings = async (): Promise<void> => {
  try {
    const docRef = doc(db, 'appSettings', 'config');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const defaultSettings: AppSettings = {
        sarToUsdRate: 0.2666,
        usdToSarRate: 3.75,
        defaultWBSCategories: ['Labor', 'Materials', 'Subcontractors', 'Equipment', 'Overhead'],
        companyName: 'FinArchiTec',
        defaultCurrency: Currency.USD,
        invoicePrefix: 'INV-',
        defaultPaymentTermsDays: 30
      };
      await setDoc(docRef, defaultSettings);
    }
  } catch (error) {
    handleFirestoreError(error, 'initializeAppSettings');
  }
};

// --- Specialized Queries ---

export const fetchBillingDocumentsByProject = async (projectId: string): Promise<BillingDocument[]> => {
  try {
    const q = query(collection(db, 'billingDocuments'), where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as BillingDocument);
  } catch (error) {
    return handleFirestoreError(error, 'fetchBillingDocumentsByProject') as never;
  }
};

export const fetchBillingDocumentsByCounterparty = async (counterpartyId: string): Promise<BillingDocument[]> => {
  try {
    const q = query(collection(db, 'billingDocuments'), where('counterpartyId', '==', counterpartyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as BillingDocument);
  } catch (error) {
    return handleFirestoreError(error, 'fetchBillingDocumentsByCounterparty') as never;
  }
};

export const fetchOverdueBillingDocuments = async (): Promise<BillingDocument[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'billingDocuments'),
      where('dueDate', '<', today),
      where('status', 'not-in', [DocumentStatus.Paid, DocumentStatus.Void])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as BillingDocument);
  } catch (error) {
    return handleFirestoreError(error, 'fetchOverdueBillingDocuments') as never;
  }
};

export const fetchPaymentsByCounterparty = async (counterpartyId: string): Promise<Payment[]> => {
  try {
    const q = query(collection(db, 'payments'), where('counterpartyId', '==', counterpartyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Payment);
  } catch (error) {
    return handleFirestoreError(error, 'fetchPaymentsByCounterparty') as never;
  }
};
