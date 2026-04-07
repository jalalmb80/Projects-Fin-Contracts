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
import { Subscription } from '../types';

const COLLECTION_NAME = 'subscriptions';

export const subscriptionService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  },

  async getByCounterpartyId(counterpartyId: string) {
    const q = query(collection(db, COLLECTION_NAME), where('counterpartyId', '==', counterpartyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscription[];
  },

  async add(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...subscription,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  },

  async update(id: string, subscription: Partial<Subscription>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...subscription,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
