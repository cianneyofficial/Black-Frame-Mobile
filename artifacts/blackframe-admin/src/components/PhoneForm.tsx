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
import { formatCurrency } from "@/lib/format";
import { MediaPicker } from "@/components/MediaPicker";

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
    } else {
      form.reset(defaultValues);
      setMedia([]);
    }
  }, [initialData]);

  const { watch } = form;
  const purchasePrice = watch("purchasePrice") || 0;
  const repairCost = watch("repairCost") || 0;
  const salePrice = watch("salePrice") || 0;

  const totalCost = Number(purchasePrice) + Number(repairCost);
  const profit = Number(salePrice) - totalCost;

  const handleSubmit = (values: FormValues) => {
    onSubmit({ ...values, media });
  };

  return (
    <div className="flex flex-col max-w-md mx-auto w-full px-4 pt-6 pb-40">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{initialData ? "Modifier" : "Ajouter"} un téléphone</h2>
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

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Modèle</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: iPhone 14 Pro 128GB"
                    className="h-12 bg-white/5 border-white/10 text-base focus-visible:ring-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Prix Achat (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      className="h-12 bg-white/5 border-white/10 text-base font-medium"
                      {...field}
                    />
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
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Réparation (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      className="h-12 bg-white/5 border-white/10 text-base font-medium"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary uppercase tracking-wider text-xs font-bold">Prix Vente (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="1"
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
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Prix Min (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      className="h-12 bg-white/5 border-white/10 text-base font-medium"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Coût total (Achat + Rép.)</span>
              <span className="font-medium text-white">{formatCurrency(totalCost)}</span>
            </div>
            <div className="h-px bg-white/5 w-full" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold text-sm">Bénéfice estimé</span>
              <span className={`text-lg font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
              </span>
            </div>
          </div>

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
                    <Input
                      type="date"
                      className="h-12 bg-white/5 border-white/10 text-base block w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-xl"
              data-testid="button-submit"
            >
              {initialData ? "Enregistrer les modifications" : "Ajouter à l'inventaire"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full h-14 text-base font-medium bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl"
              data-testid="button-cancel"
            >
              Annuler
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
