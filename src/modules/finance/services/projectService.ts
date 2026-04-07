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
import { Project } from '../types';

const COLLECTION_NAME = 'projects';

export const projectService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  },

  async getByClientId(clientId: string) {
    const q = query(collection(db, COLLECTION_NAME), where('clientId', '==', clientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  },

  async add(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...project,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  },

  async update(id: string, project: Partial<Project>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...project,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
