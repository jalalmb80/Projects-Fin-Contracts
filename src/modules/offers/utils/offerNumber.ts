import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../../../core/firebase';

/**
 * Atomically generates the next offer number using a Firestore transaction.
 * Reads appSettings/offerCounter, increments lastSequence, writes back.
 * Format: OFF-{year}-{sequence padded to 4 digits}  e.g. OFF-2026-0001
 *
 * Eliminates the birthday-collision risk of the previous Math.random() approach.
 * Follows the same pattern as Finance invoice number generation (appSettings/invoiceCounter).
 */
export async function generateOfferNumber(): Promise<string> {
  const year       = new Date().getFullYear();
  const counterRef = doc(db, 'appSettings', 'offerCounter');
  let   sequence   = 0;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    sequence   = ((snap.exists() ? (snap.data().lastSequence as number) : 0) ?? 0) + 1;
    tx.set(counterRef, { lastSequence: sequence }, { merge: true });
  });

  return `OFF-${year}-${String(sequence).padStart(4, '0')}`;
}
