import { Product } from '@/services/product.service';

export interface ScentDNAResult {
  score: number;
  matchingNotes: string[];
  avoidedNotesFound: string[];
  color: 'gold' | 'amber' | 'red';
  status: 'excellent' | 'caution' | 'warning';
}

export function calculateScentDNA(
  product: Product,
  preferredNotes: string[] = [],
  avoidedNotes: string[] = []
): ScentDNAResult | null {
  if (preferredNotes.length === 0 && avoidedNotes.length === 0) return null;

  const productNotes = (product.notes || []).map((n) => n.note.name.toLowerCase().trim());
  const matched: string[] = [];
  const avoided: string[] = [];

  // Helper to clean note names (remove bracketed info like "Chanh (Citrus)")
  const clean = (s: string) => s.split(' (')[0].toLowerCase().trim();

  // Count matches
  for (const prefNote of preferredNotes) {
    const cleanPref = clean(prefNote);
    const match = product.notes?.find((pn) => {
      const cleanPn = clean(pn.note.name);
      return cleanPn.includes(cleanPref) || cleanPref.includes(cleanPn);
    });
    if (match) matched.push(match.note.name);
  }

  // Count penalties
  for (const avoidNote of avoidedNotes) {
    const cleanAvoid = clean(avoidNote);
    const match = product.notes?.find((pn) => {
      const cleanPn = clean(pn.note.name);
      return cleanPn.includes(cleanAvoid) || cleanAvoid.includes(cleanPn);
    });
    if (match) avoided.push(match.note.name);
  }

  if (matched.length === 0 && avoided.length === 0) return null;

  let score = 0;
  if (matched.length === 0 && avoided.length > 0) {
    score = 10; // Explicitly low if only penalties found
  } else {
    // Base 70% for first match, +10% for others
    score = 70 + (matched.length - 1) * 10;
    // Penalty: -40% for each avoided note
    score -= avoided.length * 40;
  }

  // Clamp
  score = Math.max(5, Math.min(99, score));

  let color: 'gold' | 'amber' | 'red' = 'gold';
  let status: 'excellent' | 'caution' | 'warning' = 'excellent';

  if (score > 70) {
    color = 'gold';
    status = 'excellent';
  } else if (score >= 50) {
    color = 'amber';
    status = 'caution';
  } else {
    color = 'red';
    status = 'warning';
  }

  return {
    score,
    matchingNotes: matched,
    avoidedNotesFound: avoided,
    color,
    status,
  };
}
