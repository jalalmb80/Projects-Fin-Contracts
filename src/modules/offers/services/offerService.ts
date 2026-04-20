import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import {
  Offer, OfferNote, WorkflowLogEntry, LineItem,
  OfferSection, OfferStatus,
} from '../types';
import { calculateTotals } from '../utils/pricing';

export function subscribeOffers(
  onData: (offers: Offer[]) => void,
  onError: (err: { code: string }) => void,
): () => void {
  return onSnapshot(
    query(collection(db, 'offers'), orderBy('created_at', 'desc')),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer))),
    err => onError({ code: (err as any).code ?? 'unknown' }),
  );
}

export async function createOffer(offer: Offer): Promise<void> {
  await setDoc(doc(db, 'offers', offer.id), offer);
}

export async function updateOffer(id: string, data: Partial<Offer>): Promise<void> {
  await updateDoc(doc(db, 'offers', id), {
    ...data,
    updated_at: new Date().toISOString(),
  } as any);
}

export async function addWorkflowLogEntry(
  offerId: string,
  entry: WorkflowLogEntry,
  newStatus?: OfferStatus,
): Promise<void> {
  const snap = await getDoc(doc(db, 'offers', offerId));
  const offer = snap.data() as Offer | undefined;
  const existing = offer?.workflow_log ?? [];
  const patch: Partial<Offer> = {
    workflow_log: [entry, ...existing],
    updated_at: new Date().toISOString(),
  };
  if (newStatus !== undefined) patch.status = newStatus;
  await updateDoc(doc(db, 'offers', offerId), patch as any);
}

export async function addNote(
  offerId: string,
  note: OfferNote,
): Promise<void> {
  const snap = await getDoc(doc(db, 'offers', offerId));
  const offer = snap.data() as Offer | undefined;
  const existing = offer?.notes ?? [];
  await updateDoc(doc(db, 'offers', offerId), {
    notes: [...existing, note],
    updated_at: new Date().toISOString(),
  } as any);
}

export async function updateSections(
  offerId: string,
  sections: OfferSection[],
): Promise<void> {
  await updateDoc(doc(db, 'offers', offerId), {
    sections,
    updated_at: new Date().toISOString(),
  } as any);
}

export async function updateLineItems(
  offerId: string,
  lineItems: LineItem[],
  globalDiscountPct: number,
  vatRate: number,
): Promise<void> {
  const totals = calculateTotals(lineItems, globalDiscountPct, vatRate);
  await updateDoc(doc(db, 'offers', offerId), {
    line_items: lineItems,
    ...totals,
    updated_at: new Date().toISOString(),
  } as any);
}
