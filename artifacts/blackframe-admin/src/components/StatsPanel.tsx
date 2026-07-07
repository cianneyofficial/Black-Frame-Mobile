import { useMemo } from "react";
import { Phone } from "@/hooks/types";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, BarChart2, Award, AlertTriangle, Clock } from "lucide-react";

const STALE_DAYS = 30;

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

interface StatsPanelProps {
  phones: Phone[];
}

export function StatsPanel({ phones }: StatsPanelProps) {
  const stats = useMemo(() => {
    const sold = phones.filter(p => p.status === "Vendu");
    const inStock = phones.filter(p => p.status === "Disponible" || p.status === "Réservé");

    const profits = sold.map(p => p.salePrice - (p.purchasePrice + p.repairCost));
    const totalProfit = profits.reduce((s, v) => s + v, 0);
    const avgProfit = sold.length > 0 ? totalProfit / sold.length : null;

    const bestPhone = sold.length > 0
      ? sold.reduce((best, p) => {
          const profit = p.salePrice - (p.purchasePrice + p.repairCost);
          const bestProfit = best.salePrice - (best.purchasePrice + best.repairCost);
          return profit > bestProfit ? p : best;
        })
      : null;

    const stalePhones = inStock
      .map(p => ({ ...p, days: daysSince(p.purchaseDate) }))
      .filter(p => p.days >= STALE_DAYS)
      .sort((a, b) => b.days - a.days);

    return { sold, totalProfit, avgProfit, bestPhone, stalePhones };
  }, [phones]);

  const { sold, totalProfit, avgProfit, bestPhone, stalePhones } = stats;

  if (phones.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <BarChart2 className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Statistiques
        </h2>
      </div>

      {/* Main stat rows */}
      <div className="bg-white/5 border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">

        <StatRow
          icon={<TrendingUp className="w-4 h-4 text-green-400" />}
          label="Bénéfice total"
          value={
            <span className={totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
              {totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}
            </span>
          }
          sub={sold.length > 0 ? `sur ${sold.length} vente${sold.length > 1 ? "s" : ""}` : "Aucune vente"}
        />

        <StatRow
          icon={<BarChart2 className="w-4 h-4 text-primary" />}
          label="Bénéfice moyen"
          value={
            avgProfit !== null
              ? <span className={avgProfit >= 0 ? "text-primary" : "text-red-400"}>
                  {avgProfit >= 0 ? "+" : ""}{formatCurrency(avgProfit)}
                </span>
              : <span className="text-muted-foreground text-sm">—</span>
          }
          sub="par téléphone vendu"
        />

        <StatRow
          icon={<Award className="w-4 h-4 text-yellow-400" />}
          label="Modèle le + rentable"
          value={
            bestPhone
              ? <span className="text-white font-bold truncate max-w-[140px] block text-right">
                  {bestPhone.model}
                </span>
              : <span className="text-muted-foreground text-sm">—</span>
          }
          sub={
            bestPhone
              ? `+${formatCurrency(bestPhone.salePrice - (bestPhone.purchasePrice + bestPhone.repairCost))} de bénéfice`
              : undefined
          }
        />
      </div>

      {/* Stale stock alert */}
      {stalePhones.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-orange-500/10">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-300">
                {stalePhones.length} téléphone{stalePhones.length > 1 ? "s" : ""} en stock depuis + de {STALE_DAYS} jours
              </p>
              <p className="text-[10px] text-orange-400/70 mt-0.5">À vendre en priorité</p>
            </div>
          </div>
          <div className="divide-y divide-orange-500/10">
            {stalePhones.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{p.model}</p>
                  <p className="text-xs text-orange-400/80 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    {p.days} jours en stock
                  </p>
                </div>
                <span className="text-sm font-bold text-white shrink-0">
                  {formatCurrency(p.salePrice)}
                </span>
              </div>
            ))}
            {stalePhones.length > 5 && (
              <div className="px-4 py-2 text-xs text-orange-400/60 text-center">
                + {stalePhones.length - 5} autres
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
      <div className="text-base font-bold shrink-0">{value}</div>
    </div>
  );
}
