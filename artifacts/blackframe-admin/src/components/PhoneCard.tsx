import { formatCurrency } from "@/lib/format";
import { Phone } from "@/hooks/types";
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
  onMarkSold: (id: string) => void;
}

export function PhoneCard({ phone, onEdit, onDelete, onMarkSold }: PhoneCardProps) {
  const totalCost = phone.purchasePrice + phone.repairCost;
  const profit = phone.salePrice - totalCost;

  const statusColors: Record<string, string> = {
    Disponible: "bg-green-500/15 text-green-400 border-green-500/20",
    Réservé: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Vendu: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      data-testid={`card-phone-${phone.id}`}
    >
      <Card className="p-4 flex flex-col gap-3 border-white/5 bg-white/5 shadow-none">
        <div className="flex justify-between items-start gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight tracking-tight truncate">{phone.model}</h3>
            <div className="text-xs text-muted-foreground">
              {new Date(phone.purchaseDate + "T00:00:00").toLocaleDateString("fr-FR")}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 rounded-full font-medium text-xs px-3 py-1 border ${statusColors[phone.status]}`}
          >
            {phone.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm bg-black/30 p-3 rounded-lg border border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Prix Vente</span>
            <span className="font-semibold text-base">{formatCurrency(phone.salePrice)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Bénéfice</span>
            <span className={`font-semibold text-base ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Coût total</span>
            <span className="font-medium text-sm text-muted-foreground">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Prix min</span>
            <span className="font-medium text-sm text-muted-foreground">{formatCurrency(phone.minPrice)}</span>
          </div>
        </div>

        {phone.notes ? (
          <p className="text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2 border border-white/5 line-clamp-2">
            {phone.notes}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white border border-white/5"
            onClick={() => onEdit(phone)}
            data-testid={`button-edit-${phone.id}`}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>

          {phone.status !== "Vendu" && (
            <Button
              variant="default"
              className="flex-1 h-11 font-semibold"
              onClick={() => onMarkSold(phone.id)}
              data-testid={`button-sold-${phone.id}`}
            >
              <Check className="w-4 h-4 mr-2" />
              Vendu
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                data-testid={`button-delete-${phone.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90vw] max-w-sm rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce téléphone ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. "{phone.model}" sera retiré de l'inventaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-col mt-2">
                <AlertDialogAction
                  onClick={() => onDelete(phone.id)}
                  className="h-12 w-full bg-red-500 text-white hover:bg-red-600"
                >
                  Supprimer
                </AlertDialogAction>
                <AlertDialogCancel className="mt-0 h-12 w-full border-white/10">
                  Annuler
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </motion.div>
  );
}
