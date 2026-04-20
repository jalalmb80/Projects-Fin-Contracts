import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { OfferTemplate } from '../types';

export function subscribeTemplates(
  onData: (templates: OfferTemplate[]) => void,
  onError: (err: { code: string }) => void,
): () => void {
  return onSnapshot(
    query(collection(db, 'offer_templates'), orderBy('created_at', 'desc')),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as OfferTemplate))),
    err => onError({ code: (err as any).code ?? 'unknown' }),
  );
}

export async function createTemplate(template: OfferTemplate): Promise<void> {
  await setDoc(doc(db, 'offer_templates', template.id), template);
}

export async function updateTemplate(id: string, data: Partial<OfferTemplate>): Promise<void> {
  await updateDoc(doc(db, 'offer_templates', id), {
    ...data,
    updated_at: new Date().toISOString(),
  } as any);
}

export async function archiveTemplate(id: string): Promise<void> {
  await updateDoc(doc(db, 'offer_templates', id), {
    status: 'archived',
    updated_at: new Date().toISOString(),
  } as any);
}
