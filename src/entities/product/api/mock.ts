import type { Product } from "../model/types";

export const products: Product[] = [
  {
    id: "1",
    slug: "dancing-waves",
    name: "Танцующие волны",
    soundCharacter: "Ритмичное, переливчатое звучание",
    scale: "D Kurd",
    scaleNotes: "D3 / A3 B3 C4 D4 E4 F4 A4",
    price: 32000,
    oldPrice: 36000,
    notesCount: 9,
    weightGrams: 2300,
    diameterCm: 53,
    material: "Нержавеющая сталь",
    inStock: true,
  },
  {
    id: "2",
    slug: "morning-mist",
    name: "Утренний туман",
    soundCharacter: "Глубокое, медитативное звучание",
    scale: "Celtic Minor",
    scaleNotes: "D3 / A3 C4 D4 E4 F4 G4 A4",
    price: 32000,
    oldPrice: 36000,
    notesCount: 9,
    weightGrams: 2300,
    diameterCm: 53,
    material: "Нержавеющая сталь",
    inStock: true,
  },
  {
    id: "3",
    slug: "warm-current",
    name: "Тёплое течение",
    soundCharacter: "Яркое, обертонное звучание",
    scale: "Hijaz",
    scaleNotes: "D3 / A3 Bb3 C#4 D4 E4 F4 A4",
    price: 32000,
    oldPrice: 36000,
    notesCount: 9,
    weightGrams: 2300,
    diameterCm: 53,
    material: "Нержавеющая сталь",
    inStock: true,
  },
];

export function getProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
