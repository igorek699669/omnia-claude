export interface Product {
  id: string;
  slug: string;
  name: string;
  soundCharacter: string;
  scale: string;
  scaleNotes: string;
  price: number;
  oldPrice?: number;
  notesCount: number;
  weightGrams: number;
  diameterCm: number;
  material: string;
  inStock: boolean;
}
