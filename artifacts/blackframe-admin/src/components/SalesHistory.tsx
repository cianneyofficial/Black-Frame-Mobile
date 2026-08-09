import { useMemo } from "react";
import { Phone } from "@/hooks/types";
import { profit, marginPct, totalCost, daysSince } from "@/lib/calc";
import { useCurrency } from "@/contexts/currency-context";
import { TrendingUp, Package, Calendar, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SalesHistoryProps {
  phones: Phone[];
}

export function SalesHistory({ phones }: SalesHistoryProps) {
  const { fmt, fmtUSD } = useCurrency();

  const sold = useMemo(
    () =>
      phones
        .filter(p => p.status === "Vendu")
        .sort((a, b) => {
          const dA = a.saleDate ?? a.purchaseDate;
          const dB = b.saleDate ?? b.purchaseDate;
          return new Date(dB).getTime() - new Date(dA).getTime();
        }),
    [phones],
  );

  const totalProfit = sold.reduce((s, p) => s + profit(p), 0);
  const avgProfit = sold.length > 0 ? totalProfit / sold.length : 0;
  const bestSale = sold.length > 0
    ? sold.reduce((best, p) => profit(p) > profit(best) ? p : best)
    : null;

  if (sold.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <Package className="w-7 h-7 text-white/20" />
        </div>
        <p className="text-white/50 text-base font-semibold">Aucune vente enregistrée</p>
        <p className="text-white/25 text-sm max-w-[240px] leading-relaxed">
          Marquez des téléphones comme vendus pour voir l'historique et les statistiques ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-28 pt-5 max-w-md mx-auto w-full">

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3 px-4">
        <SummaryCard
          label="Ventes"
          value={String(sold.length)}
          icon={<Package className="w-4 h-4 text-primary" />}
        />
        <SummaryCard
          label="Bénéfice total"
          value={fmt(totalProfit)}
          sub={fmtUSD(totalProfit)}
          highlight
          icon={<TrendingUp className="w-4 h-4 text-green-400" />}
        />
        <SummaryCard
          label="Moy. / vente"
          value={fmt(avgProfit)}
          sub={fmtUSD(avgProfit)}
          icon={<Percent className="w-4 h-4 text-primary" />}
        />
      </div>

      {/* Best sale */}
      {bestSale && (
        <div className="px-4">
          <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-yellow-400/70 font-semibold uppercase tracking-wider">Meilleure vente</p>
              <p className="font-bold text-white truncate">{bestSale.model}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-yellow-400">{fmt(profit(bestSale))}</p>
              <p className="text-xs text-yellow-400/60">{fmtUSD(profit(bestSale))}</p>
            </div>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="px-4 flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Historique
        </h3>

        {sold.map(p => {
          const prof = profit(p);
          const marg = marginPct(p);
          const cost = totalCost(p);
          const displayDate = p.saleDate ?? p.purchaseDate;
          const daysInStock = p.saleDate
            ? Math.floor((new Date(p.saleDate).getTime() - new Date(p.purchaseDate + "T00:00:00").getTime()) / 86_400_000)
            : daysSince(p.purchaseDate);

          return (
            <Card
              key={p.id}
              className="border-white/5 bg-white/5 shadow-none overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base leading-tight truncate">{p.model}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vendu le {new Date(displayDate + "T00:00:00").toLocaleDateString("fr-FR")}
                      {daysInStock > 0 && ` · ${daysInStock}j en stock`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${prof >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {prof >= 0 ? "+" : ""}{fmt(prof)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{fmtUSD(Math.abs(prof))}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-4 gap-2 bg-black/30 rounded-xl p-3 border border-white/5">
                   <MiniStat label="Vendu" value={fmt(p.salePrice)} sub={fmtUSD(p.salePrice)} />
                   <MiniStat label="Coût" value={fmt(cost)} sub={fmtUSD(cost)} muted />
                  <MiniStat
                    label="Marge"
                    value={marg.toFixed(0) + "%"}
                    className={marg >= 30 ? "text-green-400" : marg >= 15 ? "text-yellow-400" : "text-red-400"}
                  />
                  <MiniStat
                    label="ROI"
                    value={(p.purchasePrice > 0 ? (prof / p.purchasePrice * 100).toFixed(0) : "—") + "%"}
                    className="text-primary"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  highlight = false,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-3 border-white/5 bg-white/5 shadow-none flex flex-col gap-1.5 min-h-[80px]">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">{label}</p>
      </div>
      <p className={`text-sm font-black leading-tight ${highlight ? "text-green-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  sub,
  className = "text-white",
  muted = false,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-[11px] font-bold leading-tight ${muted ? "text-muted-foreground" : className}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
    </div>
  );
}
