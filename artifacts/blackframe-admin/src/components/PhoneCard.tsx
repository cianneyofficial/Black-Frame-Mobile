import React, { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Phone, PhoneStatus } from "@/hooks/types";
import { usePhones } from "@/hooks/use-phones";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Check, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

interface PhoneCardProps {
  phone: Phone;
  onEdit: (phone: Phone) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string, phone: Phone) => void;
}

export function PhoneCard({ phone, onEdit, onDelete, onMarkSold }: PhoneCardProps) {
  const totalCost = phone.purchasePrice + phone.repairCost;
  const profit = phone.salePrice - totalCost;

  const statusColors = {
    Disponible: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    Réservé: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    Vendu: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
      <Card className="p-4 flex flex-col gap-4 border-white/5 bg-white/5 shadow-none overflow-hidden">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1.5">
            <h3 className="font-bold text-lg leading-tight tracking-tight">{phone.model}</h3>
            <div className="text-xs text-muted-foreground">{new Date(phone.purchaseDate).toLocaleDateString('fr-FR')}</div>
          </div>
          <Badge variant="outline" className={`shrink-0 rounded-full font-medium ${statusColors[phone.status]}`}>
            {phone.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-black/40 p-3 rounded-lg border border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Prix Vente</span>
            <span className="font-semibold text-base">{formatCurrency(phone.salePrice)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Bénéfice</span>
            <span className={`font-semibold text-base ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white" 
            onClick={() => onEdit(phone)}
          >
            <Edit className="w-4 h-4 mr-2" /> Modifier
          </Button>
          
          {phone.status !== "Vendu" && (
            <Button 
              variant="default" 
              className="flex-1 h-11 font-semibold"
              onClick={() => onMarkSold(phone.id, phone)}
            >
              <Check className="w-4 h-4 mr-2" /> Vendu
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="w-11 h-11 shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90vw] max-w-sm rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce téléphone ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Êtes-vous sûr de vouloir supprimer "{phone.model}" de l'inventaire ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col gap-2 mt-4 sm:flex-col">
                <AlertDialogCancel className="mt-0 h-12 w-full border-white/10">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(phone.id)} className="h-12 w-full bg-red-500 text-white hover:bg-red-600">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </motion.div>
  );
}
