import { useState, useEffect } from "react";
import { Phone, PhoneStatus } from "./types";
import { toast } from "sonner";

const STORAGE_KEY = "blackframe_phones";

export function usePhones() {
  const [phones, setPhones] = useState<Phone[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPhones(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse phones from localStorage", e);
    }
  }, []);

  const save = (newPhones: Phone[]) => {
    setPhones(newPhones);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPhones));
  };

  const addPhone = (phone: Omit<Phone, "id">) => {
    const newPhone: Phone = {
      ...phone,
      id: Date.now().toString(),
    };
    save([...phones, newPhone]);
    toast.success("Téléphone ajouté avec succès");
  };

  const updatePhone = (id: string, updates: Partial<Phone>) => {
    save(phones.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    toast.success("Téléphone mis à jour");
  };

  const deletePhone = (id: string) => {
    save(phones.filter((p) => p.id !== id));
    toast.success("Téléphone supprimé");
  };

  const markAsSold = (id: string, overrideSalePrice?: number) => {
    save(
      phones.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: "Vendu",
            ...(overrideSalePrice !== undefined && { salePrice: overrideSalePrice }),
          };
        }
        return p;
      })
    );
    toast.success("Marqué comme vendu");
  };

  return {
    phones,
    addPhone,
    updatePhone,
    deletePhone,
    markAsSold,
  };
}
