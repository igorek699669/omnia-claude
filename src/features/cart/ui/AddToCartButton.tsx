"use client";

import { useCart } from "../model/store";
import type { Product } from "@/entities/product";

export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  return (
    <button
      onClick={() => add(product)}
      aria-label={`Добавить «${product.name}» в корзину`}
      className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
    >
      <CartIcon />
    </button>
  );
}

export function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
