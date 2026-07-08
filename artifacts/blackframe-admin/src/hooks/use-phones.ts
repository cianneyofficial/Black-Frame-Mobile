import { useState, useEffect } from "react";
import { Phone } from "./types";
import { toast } from "sonner";

const STORAGE_KEY = "blackframe_phones";

export function usePhones() {
  const [phones, setPhones] = useState<Phone[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Phone[] = JSON.parse(stored);
        setPhones(parsed.map(p => ({ ...p, media: p.media ?? [] })));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const save = (newPhones: Phone[]) => {
    setPhones(newPhones);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPhones));
    } catch {
      toast.error("Stockage plein — supprimez des médias pour libérer de l'espace");
    }
  };

  const addPhone = (phone: Omit<Phone, "id">) => {
    const newPhone: Phone = {
      ...phone,
      id: Date.now().toString(),
      media: phone.media ?? [],
    };
    save([...phones, newPhone]);
    toast.success("Téléphone ajouté ✓");
  };

  const updatePhone = (id: string, updates: Partial<Phone>) => {
    save(phones.map(p => (p.id === id ? { ...p, ...updates } : p)));
    toast.success("Téléphone mis à jour ✓");
  };

  const deletePhone = (id: string) => {
    save(phones.filter(p => p.id !== id));
    toast.success("Téléphone supprimé");
  };

  const markAsSold = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    save(
      phones.map(p =>
        p.id === id ? { ...p, status: "Vendu", saleDate: today } : p,
      ),
    );
    toast.success("Marqué comme vendu ✓");
  };

  return { phones, addPhone, updatePhone, deletePhone, markAsSold };
}
