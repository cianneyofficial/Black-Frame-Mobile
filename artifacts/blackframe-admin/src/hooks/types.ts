export type PhoneStatus = "Disponible" | "Réservé" | "Vendu";

export interface Phone {
  id: string;
  model: string;
  purchasePrice: number;
  repairCost: number;
  salePrice: number;
  minPrice: number;
  status: PhoneStatus;
  purchaseDate: string;
  notes: string;
}
