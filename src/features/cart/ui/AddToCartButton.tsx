"use client";

import toast from "react-hot-toast";
import { useCart } from "../model/store";
import type { Product } from "@/entities/product";
import { CartIcon } from "@/shared/ui";

export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  return (
    <button
      onClick={() => {
        add(product);
        toast.success(`«${product.name}» добавлен в корзину`);
      }}
      aria-label={`Добавить «${product.name}» в корзину`}
      className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
    >
      <CartIcon size={18} />
    </button>
  );
}
