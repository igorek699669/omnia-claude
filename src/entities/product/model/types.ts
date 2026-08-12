export interface Product {
  id: string;
  slug: string;
  name: string;
  scaleNotes: string;
  price: number;
  oldPrice?: number;
  notesCount: number;
  tuningHz: "440" | "432";
  stockQty: number;
  inStock: boolean;
  audioSample?: string;
}
