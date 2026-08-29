"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/entities/product";
import { reachGoal, GOALS } from "@/shared/lib";

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
  /**
   * Что покупатель отметил перед оформлением. Здесь, а не в sessionStorage: это состояние
   * корзины, а стор и так переживает и переходы, и перезагрузку.
   */
  selectedIds: string[] | null;
  select: (productIds: string[]) => void;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  removeMany: (productIds: string[]) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

/**
 * Выбранное всегда должно быть подмножеством корзины: выбор переживает перезагрузку вместе
 * со стором, и товар, удалённый после отметки, остался бы в нём навсегда — заказ из таких
 * «призраков» показал бы на чекауте пустой состав при непустой корзине.
 */
function withoutId(selectedIds: string[] | null, productId: string): string[] | null {
  if (!selectedIds) return null;
  const next = selectedIds.filter((id) => id !== productId);
  return next.length > 0 ? next : null;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      selectedIds: null,
      select: (productIds) => set({ selectedIds: productIds }),
      // Цель шлём здесь, а не в кнопках: путей добавления два, и новый получит счёт сам.
      add: (product) => {
        reachGoal(GOALS.addToCart, { product: product.slug });
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
        });
      },
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          selectedIds: withoutId(state.selectedIds, productId),
        })),
      // Выбор сбрасываем: сюда приходят по факту оплаты, старые отметки только путали бы.
      removeMany: (productIds) =>
        set((state) => ({
          items: state.items.filter((i) => !productIds.includes(i.productId)),
          selectedIds: null,
        })),
      setQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
          // Ноль — это удаление, значит и из выбранного товар должен уйти.
          selectedIds: qty <= 0 ? withoutId(state.selectedIds, productId) : state.selectedIds,
        })),
      clear: () => set({ items: [], selectedIds: null }),
    }),
    { name: "omnia-cart" },
  ),
);

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty, 0);
