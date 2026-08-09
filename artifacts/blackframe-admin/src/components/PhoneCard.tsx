import { useState } from "react";
import { Phone } from "@/hooks/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Check, Trash2, Copy, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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
import { motion, AnimatePresence } from "framer-motion";
import { MediaSlider } from "@/components/MediaSlider";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/currency-context";
import { totalCost, profit, marginPct, roiPct, getReco, daysSince } from "@/lib/calc";

const WHATSAPP_NUMBER = "33850406200";

function buildBuyerMessage(model: string, priceStr: string): string {
  return `Bonjour, je suis intéressé par ${model} à ${priceStr}, est-il disponible ?`;
}

function buildShareText(phone: Phone, priceStr: string): string {
  const lines: string[] = [
    `📱 ${phone.model}`,
    `💰 Prix : ${priceStr}`,
    `✅ ${phone.status}`,
  ];
  if (phone.notes) lines.push(`\n${phone.notes}`);
  lines.push(`\nContactez-nous sur WhatsApp :\nhttps://wa.me/${WHATSAPP_NUMBER}`);
  return lines.join("\n");
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to execCommand
    }
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(el);
  }
}

const RECO_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "Très rentable": { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  "À vendre rapidement": { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  "À éviter": { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  "OK": { bg: "bg-white/5", text: "text-muted-foreground", dot: "bg-white/30" },
};

interface PhoneCardProps {
  phone: Phone;
  onEdit: (phone: Phone) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
}

export function PhoneCard({ phone, onEdit, onDelete, onMarkSold }: PhoneCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { fmt, fmtUSD } = useCurrency();

  const cost = totalCost(phone);
  const prof = profit(phone);
  const marg = marginPct(phone);
  const roi = roiPct(phone);
  const reco = phone.status !== "Vendu" ? getReco(phone) : null;
  const days = daysSince(phone.purchaseDate);
  const priceStr = fmt(phone.salePrice);
  const isForSale = phone.status !== "Vendu";
  const hasMedia = phone.media && phone.media.length > 0;
  const belowMin = phone.minPrice > 0 && phone.salePrice < phone.minPrice;

  const statusColors: Record<string, string> = {
    Disponible: "bg-green-500/15 text-green-400 border-green-500/20",
    Réservé: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Vendu: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(buildBuyerMessage(phone.model, priceStr));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(buildShareText(phone, priceStr));
      toast.success("Texte copié !");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleShare = async () => {
    const text = buildShareText(phone, priceStr);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${phone.model} — ${priceStr}`, text });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    handleCopy();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="flex flex-col border-white/5 bg-white/5 shadow-none overflow-hidden">

        {hasMedia && <MediaSlider media={phone.media} />}

        <div className="p-4 flex flex-col gap-3">

          {/* Recommendation badge (available phones only) */}
          {reco && reco !== "OK" && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${RECO_STYLE[reco].bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${RECO_STYLE[reco].dot}`} />
              <span className={`text-xs font-semibold ${RECO_STYLE[reco].text}`}>
                {reco === "Très rentable" && "🔥 "}
                {reco === "À vendre rapidement" && "🕒 "}
                {reco === "À éviter" && "⚠️ "}
                {reco} · {days} jours en stock
              </span>
            </div>
          )}

          {/* Below min price alert */}
          {belowMin && (
            <div className="flex items-center gap-2 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              <span className="text-xs font-semibold text-red-400">
                ⚠️ Prix vente &lt; prix minimum ({fmt(phone.minPrice)} · {fmtUSD(phone.minPrice)})
              </span>
            </div>
          )}

          {/* Model + status */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <h3 className="font-bold text-lg leading-tight tracking-tight">{phone.model}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(phone.purchaseDate + "T00:00:00").toLocaleDateString("fr-FR")}
                {phone.saleDate && ` · Vendu le ${new Date(phone.saleDate + "T00:00:00").toLocaleDateString("fr-FR")}`}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 rounded-full font-medium text-xs px-3 py-1 border ${statusColors[phone.status]}`}
            >
              {phone.status}
            </Badge>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black tracking-tight text-white">{priceStr}</span>
              <span className="text-sm text-muted-foreground font-medium">{fmtUSD(phone.salePrice)}</span>
            </div>
            {phone.minPrice > 0 && phone.minPrice !== phone.salePrice && (
              <span className="text-xs text-muted-foreground">min. {fmt(phone.minPrice)} · {fmtUSD(phone.minPrice)}</span>
            )}
          </div>

          {phone.notes && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{phone.notes}</p>
          )}

          {/* Admin details toggle */}
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground transition-colors w-fit py-1"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Détails financiers
          </button>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
              >
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-3">
                  <AdminStat label="Prix achat" value={fmt(phone.purchasePrice)} sub={fmtUSD(phone.purchasePrice)} muted />
                  <AdminStat label="Réparation" value={fmt(phone.repairCost)} sub={fmtUSD(phone.repairCost)} muted />
                  <AdminStat label="Coût total" value={fmt(cost)} sub={fmtUSD(cost)} />
                  <AdminStat
                    label="Bénéfice"
                    value={(prof >= 0 ? "+" : "") + fmt(prof)}
                    sub={fmtUSD(Math.abs(prof))}
                    className={prof >= 0 ? "text-green-400" : "text-red-400"}
                  />
                  <AdminStat
                    label="Marge"
                    value={marg.toFixed(1) + "%"}
                    className={marg >= 30 ? "text-green-400" : marg >= 15 ? "text-yellow-400" : "text-red-400"}
                  />
                  <AdminStat
                    label="ROI"
                    value={roi.toFixed(1) + "%"}
                    className="text-primary"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isForSale && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            <div className="h-px bg-white/5 mb-1" />
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 text-white active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.25)" }}
            >
              <FaWhatsapp className="w-5 h-5" />
              Contacter sur WhatsApp
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="h-11 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.97] transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier texte
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="h-11 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.97] transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>
        )}

        <div className="px-4 pb-4 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm"
            onClick={() => onEdit(phone)}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Modifier
          </Button>

          {isForSale && (
            <Button
              variant="default"
              className="flex-1 h-11 font-semibold text-sm"
              onClick={() => onMarkSold(phone.id)}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Vendu
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90vw] max-w-sm rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce téléphone ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Action irréversible. "{phone.model}" sera retiré de l'inventaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-col mt-2">
                <AlertDialogAction
                  onClick={() => onDelete(phone.id)}
                  className="h-12 w-full bg-red-500 text-white hover:bg-red-600"
                >
                  Supprimer
                </AlertDialogAction>
                <AlertDialogCancel className="mt-0 h-12 w-full border-white/10">Annuler</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </motion.div>
  );
}

function AdminStat({
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
      <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      <span className={`font-bold text-sm ${muted ? "text-muted-foreground" : className}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
    </div>
  );
}
