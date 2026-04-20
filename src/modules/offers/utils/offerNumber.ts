export function generateOfferNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OFF-${year}-${suffix}`;
}
