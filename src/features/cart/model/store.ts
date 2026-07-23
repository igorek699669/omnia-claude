"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/entities/product";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (product: Product) => void;
  remove: (productId: string) => void;
  removeMany: (productIds: string[]) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id ? { ...i, qty: i.qty + 1 } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                oldPrice: product.oldPrice,
                qty: 1,
              },
            ],
          };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      removeMany: (productIds) =>
        set((state) => ({ items: state.items.filter((i) => !productIds.includes(i.productId)) })),
      setQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "omnia-cart" },
  ),
);

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty, 0);
