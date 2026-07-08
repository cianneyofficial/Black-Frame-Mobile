import { Phone } from "@/hooks/types";

export function totalCost(p: Phone): number {
  return p.purchasePrice + p.repairCost;
}

export function profit(p: Phone): number {
  return p.salePrice - totalCost(p);
}

export function marginPct(p: Phone): number {
  const cost = totalCost(p);
  if (cost === 0) return 0;
  return (profit(p) / cost) * 100;
}

export function roiPct(p: Phone): number {
  if (p.purchasePrice === 0) return 0;
  return (profit(p) / p.purchasePrice) * 100;
}

export function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr + "T00:00:00").getTime()) / 86_400_000,
  );
}

export type Reco = "Très rentable" | "À vendre vite" | "Marge faible" | "OK";

export function getReco(p: Phone): Reco {
  const prof = profit(p);
  const marg = marginPct(p);
  const days = daysSince(p.purchaseDate);
  if (prof < 20_000) return "Marge faible";
  if (days > 7) return "À vendre vite";
  if (marg >= 40) return "Très rentable";
  return "OK";
}

export function profitAtPrice(p: Phone, targetPrice: number): number {
  return targetPrice - totalCost(p);
}

export function marginAtPrice(p: Phone, targetPrice: number): number {
  const cost = totalCost(p);
  if (cost === 0) return 0;
  return (profitAtPrice(p, targetPrice) / cost) * 100;
}
