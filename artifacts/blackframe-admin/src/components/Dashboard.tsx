import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Phone, PhoneStatus } from "@/hooks/types";
import { PhoneCard } from "./PhoneCard";
import { StatsPanel } from "./StatsPanel";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardProps {
  phones: Phone[];
  onEdit: (phone: Phone) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
}

export function Dashboard({ phones, onEdit, onDelete, onMarkSold }: DashboardProps) {
  const [filter, setFilter] = useState<PhoneStatus | "Tous">("Tous");

  const totalInStock = phones.filter(p => p.status === "Disponible" || p.status === "Réservé").length;
  const totalSold = phones.filter(p => p.status === "Vendu").length;

  const totalProfit = phones
    .filter(p => p.status === "Vendu")
    .reduce((sum, p) => sum + (p.salePrice - (p.purchasePrice + p.repairCost)), 0);

  const investedCapital = phones
    .filter(p => p.status !== "Vendu")
    .reduce((sum, p) => sum + p.purchasePrice + p.repairCost, 0);

  const filteredPhones = phones
    .filter(p => filter === "Tous" || p.status === filter)
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  const filters: Array<PhoneStatus | "Tous"> = ["Tous", "Disponible", "Réservé", "Vendu"];

  return (
    <div className="flex flex-col gap-5 pb-28 pt-5 max-w-md mx-auto w-full">

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <KPICard title="En stock" value={totalInStock} data-testid="kpi-stock" />
        <KPICard title="Vendus" value={totalSold} data-testid="kpi-sold" />
        <KPICard title="Bénéfice net" value={formatCurrency(totalProfit)} highlight data-testid="kpi-profit" />
        <KPICard title="Capital investi" value={formatCurrency(investedCapital)} data-testid="kpi-capital" />
      </div>

      {/* Smart stats */}
      <div className="px-4">
        <StatsPanel phones={phones} />
      </div>

      {/* Filter bar */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 px-4 pb-1" style={{ width: "max-content", minWidth: "100%" }}>
          {filters.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-10 px-5 rounded-full whitespace-nowrap text-sm font-medium shrink-0 transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
              data-testid={`filter-${f.toLowerCase()}`}
            >
              {f}
            </button>
          ))}
          <div className="w-2 shrink-0" />
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
  value: string | number;
  highlight?: boolean;
  "data-testid"?: string;
}

function KPICard({ title, value, highlight = false, "data-testid": testId }: KPICardProps) {
  return (
    <Card
      className="p-4 border-white/5 bg-white/5 flex flex-col justify-between min-h-[90px] shadow-none"
      data-testid={testId}
    >
      <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{title}</h4>
      <div className={`text-2xl font-bold tracking-tight mt-2 ${highlight ? "text-primary" : "text-white"}`}>
        {value}
      </div>
    </Card>
  );
}
