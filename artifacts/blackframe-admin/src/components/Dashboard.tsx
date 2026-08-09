import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Phone, PhoneStatus } from "@/hooks/types";
import { PhoneCard } from "./PhoneCard";
import { StatsPanel } from "./StatsPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/currency-context";
import { profit, totalCost } from "@/lib/calc";

interface DashboardProps {
  phones: Phone[];
  onEdit: (phone: Phone) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
}

export function Dashboard({ phones, onEdit, onDelete, onMarkSold }: DashboardProps) {
  const [filter, setFilter] = useState<PhoneStatus | "Tous">("Tous");
  const { fmt, fmtUSD } = useCurrency();

  const available = phones.filter(p => p.status === "Disponible");
  const inStock = phones.filter(p => p.status === "Disponible" || p.status === "Réservé");
  const sold = phones.filter(p => p.status === "Vendu");

  const totalProfit = sold.reduce((s, p) => s + profit(p), 0);
  const investedCapital = inStock.reduce((s, p) => s + totalCost(p), 0);
  const avgProfit = sold.length > 0 ? totalProfit / sold.length : 0;

  const filteredPhones = phones
    .filter(p => filter === "Tous" || p.status === filter)
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  const filters: Array<PhoneStatus | "Tous"> = ["Tous", "Disponible", "Réservé", "Vendu"];

  return (
    <div className="flex flex-col gap-5 pb-28 pt-5 max-w-md mx-auto w-full">

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <KPICard
          title="Capital investi"
          value={fmt(investedCapital)}
          sub={fmtUSD(investedCapital)}
        />
        <KPICard
          title="Bénéfice total"
          value={(totalProfit >= 0 ? "+" : "") + fmt(totalProfit)}
          sub={fmtUSD(Math.abs(totalProfit))}
          highlight={totalProfit >= 0}
          warn={totalProfit < 0}
        />
        <KPICard
          title="En stock"
          value={String(available.length)}
          sub={`${inStock.length} au total (+ réservés)`}
        />
        <KPICard
          title="Vendus"
          value={String(sold.length)}
          sub={sold.length > 0 ? `Moy. ${fmt(avgProfit)} · ${fmtUSD(avgProfit)}` : "Aucune vente"}
        />
      </div>

      {/* Smart stats */}
      <div className="px-4">
        <StatsPanel phones={phones} />
      </div>

      {/* Filter bar */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 pl-4 pr-2 pb-1" style={{ width: "max-content", minWidth: "100%" }}>
          {filters.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-9 px-3 rounded-full whitespace-nowrap text-sm font-medium shrink-0 transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground border border-white/10 active:bg-white/10"
              }`}
            >
              {f}
              {f !== "Tous" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {phones.filter(p => p.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Phone list */}
      <div className="flex flex-col gap-3 px-4">
        {filteredPhones.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-xl text-white/20 font-light">—</span>
            </div>
            <p className="text-sm">Aucun téléphone trouvé</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredPhones.map(phone => (
              <PhoneCard
                key={phone.id}
                phone={phone}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkSold={onMarkSold}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  warn?: boolean;
}

function KPICard({ title, value, sub, highlight = false, warn = false }: KPICardProps) {
  return (
    <Card className="p-4 border-white/5 bg-white/5 flex flex-col justify-between min-h-[90px] shadow-none gap-1">
      <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{title}</h4>
      <div className={`text-lg font-black tracking-tight leading-tight ${
        highlight ? "text-green-400" : warn ? "text-red-400" : "text-white"
      }`}>
        {value}
      </div>
      {sub && <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>}
    </Card>
  );
}
