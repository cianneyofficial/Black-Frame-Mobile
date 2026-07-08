import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, MediaItem } from "@/hooks/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "@/components/MediaPicker";
import { useCurrency } from "@/contexts/currency-context";
import { profitAtPrice, marginAtPrice } from "@/lib/calc";

const formSchema = z.object({
  model: z.string().min(1, "Le modèle est requis"),
  purchasePrice: z.coerce.number().min(0, "Doit être positif"),
  repairCost: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0),
  minPrice: z.coerce.number().min(0).default(0),
  status: z.enum(["Disponible", "Réservé", "Vendu"]),
  purchaseDate: z.string().min(1, "La date est requise"),
  notes: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;
export type FormSubmitData = FormValues & { media: MediaItem[] };

const defaultValues: FormValues = {
  model: "",
  purchasePrice: 0,
  repairCost: 0,
  salePrice: 0,
  minPrice: 0,
  status: "Disponible",
  purchaseDate: new Date().toISOString().split("T")[0],
  notes: "",
};

interface PhoneFormProps {
  initialData?: Phone | null;
  onSubmit: (data: FormSubmitData) => void;
  onCancel: () => void;
}

export function PhoneForm({ initialData, onSubmit, onCancel }: PhoneFormProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialData?.media ?? []);
  const [simPrice, setSimPrice] = useState<number>(0);
  const { fmt, fmtUSD, rate } = useCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          model: initialData.model,
          purchasePrice: initialData.purchasePrice,
          repairCost: initialData.repairCost,
          salePrice: initialData.salePrice,
          minPrice: initialData.minPrice,
          status: initialData.status,
          purchaseDate: initialData.purchaseDate,
          notes: initialData.notes ?? "",
        }
      : defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        model: initialData.model,
        purchasePrice: initialData.purchasePrice,
        repairCost: initialData.repairCost,
        salePrice: initialData.salePrice,
        minPrice: initialData.minPrice,
        status: initialData.status,
        purchaseDate: initialData.purchaseDate,
        notes: initialData.notes ?? "",
      });
      setMedia(initialData.media ?? []);
      setSimPrice(initialData.salePrice);
    } else {
      form.reset(defaultValues);
      setMedia([]);
      setSimPrice(0);
    }
  }, [initialData]);

  const { watch } = form;
  const purchasePrice = Number(watch("purchasePrice")) || 0;
  const repairCost = Number(watch("repairCost")) || 0;
  const salePrice = Number(watch("salePrice")) || 0;

  const totalCost = purchasePrice + repairCost;
  const profit = salePrice - totalCost;
  const marginPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const roiPct = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;

  const mockPhone = { purchasePrice, repairCost, salePrice, minPrice: 0 } as Phone;
  const simProfit = profitAtPrice(mockPhone, simPrice);
  const simMargin = marginAtPrice(mockPhone, simPrice);

  const handleSubmit = (values: FormValues) => {
    onSubmit({ ...values, media });
  };

  const inputCls = "h-12 bg-white/5 border-white/10 text-base font-medium focus-visible:ring-primary";

  return (
    <div className="flex flex-col max-w-md mx-auto w-full px-4 pt-6 pb-40">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{initialData ? "Modifier" : "Ajouter"} un téléphone</h2>
        <p className="text-xs text-muted-foreground mt-1">Tous les prix en Francs Congolais (CDF) · 1 $ = {rate.toLocaleString("fr-FR")} CDF</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

          {/* Médias */}
          <div className="flex flex-col gap-2">
            <label className="text-muted-foreground uppercase tracking-wider text-xs font-medium">
              Photos &amp; Vidéos
            </label>
            <MediaPicker value={media} onChange={setMedia} />
          </div>

          {/* Modèle */}
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Modèle</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: iPhone 14 Pro 128GB"
                    className={`${inputCls} text-base`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prix achat + réparation */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Prix Achat (CDF)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" step="100" className={inputCls} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="repairCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Réparation (CDF)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" step="100" className={inputCls} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Prix vente + min */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary uppercase tracking-wider text-xs font-bold">Prix Vente (CDF)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="100"
                      className="h-12 bg-primary/10 border-primary/30 text-primary text-base font-bold focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Prix Min (CDF)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" step="100" className={inputCls} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Live calculation panel */}
          <div className="bg-black/40 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Calcul automatique</p>
            <div className="grid grid-cols-2 gap-3">
              <CalcRow label="Coût total" value={fmt(totalCost)} sub={fmtUSD(totalCost)} />
              <CalcRow
                label="Bénéfice"
                value={(profit >= 0 ? "+" : "") + fmt(profit)}
                sub={fmtUSD(Math.abs(profit))}
                className={profit >= 0 ? "text-green-400" : "text-red-400"}
              />
              <CalcRow
                label="Marge"
                value={marginPct.toFixed(1) + "%"}
                className={marginPct >= 30 ? "text-green-400" : marginPct >= 15 ? "text-yellow-400" : "text-red-400"}
              />
              <CalcRow
                label="ROI"
                value={roiPct.toFixed(1) + "%"}
                className="text-primary"
              />
            </div>
            {profit < 20_000 && salePrice > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/15">
                <span className="text-xs text-red-400 font-medium">⚠️ Bénéfice &lt; 20 000 CDF — vérifiez le prix</span>
              </div>
            )}
          </div>

          {/* Price Simulator */}
          <div className="bg-black/40 border border-primary/15 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">🔮 Simulateur de prix</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Si je vends à (CDF)</label>
              <Input
                type="number"
                inputMode="numeric"
                step="100"
                value={simPrice || ""}
                onChange={e => setSimPrice(Number(e.target.value))}
                placeholder="Ex: 350 000"
                className="h-12 bg-white/5 border-primary/20 text-primary text-base font-bold focus-visible:ring-primary"
              />
            </div>
            {simPrice > 0 && totalCost > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <SimResult
                  label="Bénéfice"
                  value={(simProfit >= 0 ? "+" : "") + fmt(simProfit)}
                  sub={fmtUSD(Math.abs(simProfit))}
                  className={simProfit >= 0 ? "text-green-400" : "text-red-400"}
                />
                <SimResult
                  label="Marge"
                  value={simMargin.toFixed(1) + "%"}
                  className={simMargin >= 30 ? "text-green-400" : simMargin >= 15 ? "text-yellow-400" : "text-red-400"}
                />
                <SimResult
                  label="ROI"
                  value={purchasePrice > 0 ? (simProfit / purchasePrice * 100).toFixed(1) + "%" : "—"}
                  className="text-primary"
                />
              </div>
            )}
          </div>

          {/* Statut + date */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white/5 border-white/10 text-base font-medium">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="Réservé">Réservé</SelectItem>
                      <SelectItem value="Vendu">Vendu</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Date d'achat</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-12 bg-white/5 border-white/10 text-base block w-full" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Accessoires inclus, état de la batterie, etc."
                    className="min-h-[90px] bg-white/5 border-white/10 text-base resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full h-14 text-base font-bold rounded-xl">
              {initialData ? "Enregistrer les modifications" : "Ajouter à l'inventaire"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full h-14 text-base font-medium bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl"
            >
              Annuler
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function CalcRow({
  label,
  value,
  sub,
  className = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      <span className={`text-sm font-black ${className}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
    </div>
  );
}

function SimResult({
  label,
  value,
  sub,
  className = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2.5 flex flex-col gap-0.5">
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-black ${className}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/60">{sub}</span>}
    </div>
  );
}
