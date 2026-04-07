import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { Counterparty, CounterpartyType, Currency } from '../types';

const COLLECTION_NAME = 'counterparties';

export const counterpartyService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Counterparty[];
  },

  async add(counterparty: Omit<Counterparty, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...counterparty,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async update(id: string, counterparty: Partial<Counterparty>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, counterparty);
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
