import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, PhoneStatus } from "@/hooks/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

const formSchema = z.object({
  model: z.string().min(1, "Requis"),
  purchasePrice: z.coerce.number().min(0, "Doit être positif"),
  repairCost: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0),
  minPrice: z.coerce.number().min(0).default(0),
  status: z.enum(["Disponible", "Réservé", "Vendu"]),
  purchaseDate: z.string().min(1, "Requis"),
  notes: z.string().optional().default(""),
});

interface PhoneFormProps {
  initialData?: Phone | null;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

export function PhoneForm({ initialData, onSubmit, onCancel }: PhoneFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      model: "",
      purchasePrice: 0,
      repairCost: 0,
      salePrice: 0,
      minPrice: 0,
      status: "Disponible",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const { watch } = form;
  const purchasePrice = watch("purchasePrice") || 0;
  const repairCost = watch("repairCost") || 0;
  const salePrice = watch("salePrice") || 0;

  const totalCost = Number(purchasePrice) + Number(repairCost);
  const profit = Number(salePrice) - totalCost;

  return (
    <div className="flex flex-col max-w-md mx-auto w-full px-4 pt-6 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{initialData ? "Modifier" : "Ajouter"} un téléphone</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Modèle</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: iPhone 14 Pro 128GB" className="h-12 bg-white/5 border-white/10 text-base focus-visible:ring-primary" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Prix Achat (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" className="h-12 bg-white/5 border-white/10 text-base font-medium" {...field} />
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
                    <Input type="number" step="1" className="h-12 bg-white/5 border-white/10 text-base font-medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs text-primary font-bold">Prix Vente (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" className="h-12 bg-primary/10 border-primary/20 text-primary text-base font-bold focus-visible:ring-primary" {...field} />
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
                    <Input type="number" step="1" className="h-12 bg-white/5 border-white/10 text-base font-medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Coût total (Achat + Rép.)</span>
              <span className="font-medium">{formatCurrency(totalCost)}</span>
            </div>
            <div className="h-px bg-white/5 w-full my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Bénéfice estimé</span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Statut</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white/5 border-white/10 text-base font-medium">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#18181b] border-white/10">
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

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase tracking-wider text-xs">Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Accessoires inclus, état de la batterie, etc." className="min-h-[100px] bg-white/5 border-white/10 text-base resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
              {initialData ? "Enregistrer les modifications" : "Ajouter à l'inventaire"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="w-full h-14 text-base font-medium bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl">
              Annuler
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
