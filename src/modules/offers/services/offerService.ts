import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import {
  Offer, OfferNote, WorkflowLogEntry, LineItem,
  OfferSection, OfferStatus,
} from '../types';
import { calculateTotals } from '../utils/pricing';

// ── Offers collection ─────────────────────────────────────────────────────────

export function subscribeOffers(
  onData:  (offers: Offer[]) => void,
  onError: (err: { code: string }) => void,
): () => void {
  return onSnapshot(
    query(collection(db, 'offers'), orderBy('created_at', 'desc')),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer))),
    err  => onError({ code: (err as any).code ?? 'unknown' }),
  );
}

/**
 * createOffer — batch write that atomically creates the offer document
 * and its first workflow_log subcollection entry.
 *
 * The offer object must NOT include notes or workflow_log fields;
 * those live exclusively in subcollections.
 */
export async function createOffer(
  offer:                Omit<Offer, 'notes' | 'workflow_log'>,
  initialWorkflowEntry: WorkflowLogEntry,
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'offers', offer.id), offer);
  batch.set(
    doc(db, 'offers', offer.id, 'workflow_log', initialWorkflowEntry.id),
    initialWorkflowEntry,
  );
  await batch.commit();
}

export async function updateOffer(
  id:   string,
  data: Partial<Omit<Offer, 'notes' | 'workflow_log'>>,
): Promise<void> {
  await updateDoc(doc(db, 'offers', id), {
    ...data,
    updated_at: new Date().toISOString(),
  } as any);
}

// ── workflow_log subcollection ────────────────────────────────────────────────

/**
 * subscribeWorkflowLog — real-time listener on offers/{offerId}/workflow_log.
 * Entries are returned newest-first (orderBy created_at desc).
 * Use this instead of reading offer.workflow_log (now @deprecated).
 */
export function subscribeWorkflowLog(
  offerId: string,
  onData:  (entries: WorkflowLogEntry[]) => void,
  onError: (err: { code: string }) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, 'offers', offerId, 'workflow_log'),
      orderBy('created_at', 'desc'),
    ),
    snap => onData(snap.docs.map(d => d.data() as WorkflowLogEntry)),
    err  => onError({ code: (err as any).code ?? 'unknown' }),
  );
}

/**
 * addWorkflowLogEntry — batch write:
 *   1. Writes the log entry to offers/{offerId}/workflow_log/{entry.id}
 *   2. Updates offers/{offerId}.status (if newStatus provided) + updated_at
 *
 * Atomic — either both writes succeed or neither does.
 * Note: B2 (system-note atomicity with addNote) is tracked for Phase 1.
 */
export async function addWorkflowLogEntry(
  offerId:   string,
  entry:     WorkflowLogEntry,
  newStatus?: OfferStatus,
): Promise<void> {
  const batch   = writeBatch(db);
  const logRef  = doc(db, 'offers', offerId, 'workflow_log', entry.id);
  const offerRef = doc(db, 'offers', offerId);

  batch.set(logRef, entry);

  const offerPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (newStatus !== undefined) offerPatch.status = newStatus;
  batch.update(offerRef, offerPatch);

  await batch.commit();
}

// ── notes subcollection ───────────────────────────────────────────────────────

/**
 * subscribeNotes — real-time listener on offers/{offerId}/notes.
 * Entries are returned newest-first (orderBy created_at desc).
 * Use this instead of reading offer.notes (now @deprecated).
 */
export function subscribeNotes(
  offerId: string,
  onData:  (notes: OfferNote[]) => void,
  onError: (err: { code: string }) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, 'offers', offerId, 'notes'),
      orderBy('created_at', 'desc'),
    ),
    snap => onData(snap.docs.map(d => d.data() as OfferNote)),
    err  => onError({ code: (err as any).code ?? 'unknown' }),
  );
}

export async function addNote(
  offerId: string,
  note:    OfferNote,
): Promise<void> {
  await setDoc(doc(db, 'offers', offerId, 'notes', note.id), note);
}

// ── Sections & line items ─────────────────────────────────────────────────────

export async function updateSections(
  offerId:  string,
  sections: OfferSection[],
): Promise<void> {
  await updateDoc(doc(db, 'offers', offerId), {
    sections,
    updated_at: new Date().toISOString(),
  } as any);
}

export async function updateLineItems(
  offerId:          string,
  lineItems:        LineItem[],
  globalDiscountPct: number,
  vatRate:          number,
): Promise<void> {
  const totals = calculateTotals(lineItems, globalDiscountPct, vatRate);
  await updateDoc(doc(db, 'offers', offerId), {
    line_items: lineItems,
    ...totals,
    updated_at: new Date().toISOString(),
  } as any);
}
