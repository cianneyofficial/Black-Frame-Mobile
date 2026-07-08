import { useMemo } from "react";
import { Phone } from "@/hooks/types";
import { useCurrency } from "@/contexts/currency-context";
import { profit, marginPct, totalCost, daysSince, getReco } from "@/lib/calc";
import { TrendingUp, BarChart2, Award, AlertTriangle, Clock, Zap } from "lucide-react";

const STALE_DAYS = 7;
const LOW_PROFIT_THRESHOLD = 20_000;

interface StatsPanelProps {
  phones: Phone[];
}

export function StatsPanel({ phones }: StatsPanelProps) {
  const { fmt, fmtUSD } = useCurrency();

  const stats = useMemo(() => {
    const sold = phones.filter(p => p.status === "Vendu");
    const inStock = phones.filter(p => p.status === "Disponible" || p.status === "Réservé");

    const profits = sold.map(p => profit(p));
    const totalProfit = profits.reduce((s, v) => s + v, 0);
    const avgProfit = sold.length > 0 ? totalProfit / sold.length : null;

    const bestPhone = sold.length > 0
      ? sold.reduce((best, p) => profit(p) > profit(best) ? p : best)
      : null;

    // Most profitable available phone
    const mostProfitableInStock = inStock.length > 0
      ? inStock.reduce((best, p) => profit(p) > profit(best) ? p : best)
      : null;

    // Low margin available phones
    const lowProfitPhones = inStock.filter(p => profit(p) < LOW_PROFIT_THRESHOLD);

    // Stale stock
    const stalePhones = inStock
      .map(p => ({ ...p, days: daysSince(p.purchaseDate) }))
      .filter(p => p.days >= STALE_DAYS)
      .sort((a, b) => b.days - a.days);

    return { sold, totalProfit, avgProfit, bestPhone, mostProfitableInStock, lowProfitPhones, stalePhones };
  }, [phones]);

  const { sold, totalProfit, avgProfit, bestPhone, mostProfitableInStock, lowProfitPhones, stalePhones } = stats;

  if (phones.length === 0) return null;

  const profitDisplay = profit({ purchasePrice: 0, repairCost: 0, salePrice: totalProfit } as Phone);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <BarChart2 className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Statistiques
        </h2>
      </div>

      {/* Sales stats */}
      <div className="bg-white/5 border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
        <StatRow
          icon={<TrendingUp className="w-4 h-4 text-green-400" />}
          label="Bénéfice total"
          value={
            <div className="text-right">
              <p className={`text-base font-black ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
              </p>
              <p className="text-[11px] text-muted-foreground">{fmtUSD(Math.abs(totalProfit))}</p>
            </div>
          }
          sub={sold.length > 0 ? `sur ${sold.length} vente${sold.length > 1 ? "s" : ""}` : "Aucune vente"}
        />

        <StatRow
          icon={<BarChart2 className="w-4 h-4 text-primary" />}
          label="Bénéfice moyen"
          value={
            avgProfit !== null
              ? <div className="text-right">
                  <p className={`text-base font-black ${avgProfit >= 0 ? "text-primary" : "text-red-400"}`}>
                    {avgProfit >= 0 ? "+" : ""}{fmt(avgProfit)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{fmtUSD(Math.abs(avgProfit))}</p>
                </div>
              : <span className="text-muted-foreground text-sm">—</span>
          }
          sub="par téléphone vendu"
        />

        <StatRow
          icon={<Award className="w-4 h-4 text-yellow-400" />}
          label="Modèle le + rentable"
          value={
            bestPhone
              ? <div className="text-right">
                  <p className="text-white font-bold truncate max-w-[130px]">{bestPhone.model}</p>
                  <p className="text-[11px] text-green-400">+{fmt(profit(bestPhone))}</p>
                </div>
              : <span className="text-muted-foreground text-sm">—</span>
          }
        />

        {/* Most profitable in stock */}
        {mostProfitableInStock && (
          <StatRow
            icon={<Zap className="w-4 h-4 text-primary" />}
            label="🔥 Meilleur stock actuel"
            value={
              <div className="text-right">
                <p className="text-white font-bold truncate max-w-[130px]">{mostProfitableInStock.model}</p>
                <p className="text-[11px] text-primary">
                  +{fmt(profit(mostProfitableInStock))} · {marginPct(mostProfitableInStock).toFixed(0)}%
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* Low profit alert */}
      {lowProfitPhones.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-red-500/10">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">
                ⚠️ {lowProfitPhones.length} téléphone{lowProfitPhones.length > 1 ? "s" : ""} avec bénéfice &lt; 20 000 CDF
              </p>
              <p className="text-[10px] text-red-400/70 mt-0.5">Vérifiez le prix de vente</p>
            </div>
          </div>
          <div className="divide-y divide-red-500/10">
            {lowProfitPhones.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm font-medium text-white truncate flex-1">{p.model}</p>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-400">{fmt(profit(p))}</p>
                  <p className="text-[10px] text-red-400/60">{marginPct(p).toFixed(0)}% marge</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stale stock alert */}
      {stalePhones.length > 0 && (
        <div className="bg-orange-500/8 border border-orange-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-orange-500/10">
            <Clock className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-300">
                🕒 {stalePhones.length} téléphone{stalePhones.length > 1 ? "s" : ""} en stock depuis + de {STALE_DAYS} jours
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
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{fmt(p.salePrice)}</p>
                  <p className="text-[10px] text-orange-400/60">{fmtUSD(p.salePrice)}</p>
                </div>
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
      <div className="shrink-0">{value}</div>
    </div>
  );
}
