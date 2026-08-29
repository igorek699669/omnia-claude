"use client";

import type { AnchorHTMLAttributes } from "react";
import { reachGoal } from "@/shared/lib";

/**
 * Обычная ссылка, которая отмечается целью в Метрике.
 *
 * Нужна там, где сама страница серверная: цель отправляется из браузера, и превращать
 * ради одной строки в клиентский компонент целый подвал незачем — клиентским становится
 * только сама ссылка, а иконка внутри приезжает готовой разметкой.
 */
export function GoalLink({
  goal,
  params,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  goal: string;
  params?: Record<string, unknown>;
}) {
  return (
    <a
      {...props}
      onClick={(event) => {
        reachGoal(goal, params);
        onClick?.(event);
      }}
    />
  );
}
