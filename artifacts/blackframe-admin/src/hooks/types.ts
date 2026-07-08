export type PhoneStatus = "Disponible" | "Réservé" | "Vendu";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  name?: string;
}

export interface Phone {
  id: string;
  model: string;
  purchasePrice: number;
  repairCost: number;
  salePrice: number;
  minPrice: number;
  status: PhoneStatus;
  purchaseDate: string;
  saleDate?: string;
  notes: string;
  media: MediaItem[];
}
