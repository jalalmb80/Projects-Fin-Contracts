import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, arrayUnion,
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

// Uses arrayUnion instead of the previous getDoc + read-then-write pattern.
// The old code was vulnerable to lost updates when two workflow events or
// two notes were added concurrently. arrayUnion is atomic on the server.
//
// NOTE: the previous implementation prepended entries to workflow_log so the
// newest was at index 0. arrayUnion cannot guarantee a specific position;
// it appends. Consumers that render workflow_log should sort by created_at
// descending at read time instead of relying on stored order.
export async function addWorkflowLogEntry(
  offerId: string,
  entry: WorkflowLogEntry,
  newStatus?: OfferStatus,
): Promise<void> {
  const patch: Record<string, unknown> = {
    workflow_log: arrayUnion(entry),
    updated_at: new Date().toISOString(),
  };
  if (newStatus !== undefined) patch.status = newStatus;
  await updateDoc(doc(db, 'offers', offerId), patch as any);
}

export async function addNote(
  offerId: string,
  note: OfferNote,
): Promise<void> {
  await updateDoc(doc(db, 'offers', offerId), {
    notes: arrayUnion(note),
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
