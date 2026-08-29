"use client";

import type { AnchorHTMLAttributes } from "react";
import { reachGoal } from "@/shared/lib";

/**
 * Обычная ссылка, которая отмечается целью в Метрике. Нужна там, где сама страница серверная:
 * клиентской становится только ссылка, а не весь подвал ради одной строки.
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
