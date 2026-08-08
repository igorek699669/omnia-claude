"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/shared/ui";

const OPTIONS = [
  { value: "all", label: "Любая герцовка" },
  { value: "440", label: "440 Hz" },
  { value: "432", label: "432 Hz" },
] as const;

export function TuningFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("tuningHz") ?? "all";

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("tuningHz");
    else params.set("tuningHz", next);
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-ink-600">
        Строй, Hz
      </label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="max-w-[220px]" />
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}