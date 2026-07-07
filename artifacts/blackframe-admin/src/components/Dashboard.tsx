import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Phone, PhoneStatus } from "@/hooks/types";
import { PhoneCard } from "./PhoneCard";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardProps {
  phones: Phone[];
  onEdit: (phone: Phone) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string, phone: Phone) => void;
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

  const filteredPhones = phones.filter(p => filter === "Tous" || p.status === filter).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  return (
    <div className="flex flex-col gap-6 pb-24 px-4 pt-6 max-w-md mx-auto w-full">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard title="En stock" value={totalInStock} />
        <KPICard title="Vendus" value={totalSold} />
        <KPICard title="Bénéfice net" value={formatCurrency(totalProfit)} highlight />
        <KPICard title="Capital immobilisé" value={formatCurrency(investedCapital)} />
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 snap-x hide-scrollbar">
        {["Tous", "Disponible", "Réservé", "Vendu"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "secondary"}
            className={`rounded-full snap-start whitespace-nowrap h-10 px-5 ${
              filter !== f ? "bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground" : "font-semibold"
            }`}
            onClick={() => setFilter(f as PhoneStatus | "Tous")}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {filteredPhones.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-2xl opacity-50">✕</span>
            </div>
            <p>Aucun téléphone trouvé</p>
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

function KPICard({ title, value, highlight = false }: { title: string, value: string | number, highlight?: boolean }) {
  return (
    <Card className="p-4 border-white/5 bg-white/5 flex flex-col justify-between min-h-[100px] shadow-none">
      <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{title}</h4>
      <div className={`text-2xl font-bold tracking-tight mt-2 ${highlight ? 'text-primary' : 'text-white'}`}>
        {value}
      </div>
    </Card>
  );
}
