"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { useCart } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { ArrowButton, MessengerLinks } from "@/shared/ui";
import type { Product } from "@/entities/product";

export function AddToCartSection({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.some((i) => i.productId === product.id));

  return (
    <div className="mt-6 flex flex-wrap items-center gap-5">
      {!product.inStock ? (
        <NotifyMeButton product={product} variant="pill" />
      ) : inCart ? (
        <Link
          href="/cart"
          className="inline-flex items-center gap-3 rounded-full border border-brand px-7 py-4 font-medium text-brand-dark transition-colors hover:bg-brand hover:text-white"
        >
          В корзине — оформить заказ
        </Link>
      ) : (
        <ArrowButton
          onClick={() => {
            add(product);
            toast.success(`«${product.name}» добавлен в корзину`);
          }}
        >
          Добавить в корзину
        </ArrowButton>
      )}
      {product.inStock && <MessengerLinks size="lg" />}
    </div>
  );
}
