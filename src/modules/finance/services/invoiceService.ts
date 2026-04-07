import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { BillingDocument } from '../types';

const COLLECTION_NAME = 'invoices';

export const invoiceService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BillingDocument[];
  },

  async getByCounterpartyId(counterpartyId: string) {
    const q = query(collection(db, COLLECTION_NAME), where('counterpartyId', '==', counterpartyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BillingDocument[];
  },

  async add(invoice: Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...invoice,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  },

  async update(id: string, invoice: Partial<BillingDocument>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...invoice,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
