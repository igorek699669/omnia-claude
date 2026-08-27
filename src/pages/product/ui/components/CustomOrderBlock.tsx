import { MESSENGERS } from "@/shared/ui";

/**
 * Показывается только у товара не в наличии, сразу под «Уведомить о наличии»:
 * ждать поставку — не единственный вариант, тот же строй мастерская делает под заказ.
 * Сроки и цену намеренно не пишем — они зависят от строя, это тема для разговора в мессенджере.
 */
export function CustomOrderBlock() {
  return (
    <div className="mt-8 rounded-card bg-paper-100 p-6 md:p-7">
      <h2 className="font-display text-[22px] font-medium leading-snug">Инструмент под заказ</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
        Изготовим этот строй специально для вас. Напишите нам
        в удобный мессенджер.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {MESSENGERS.map(({ id, label, href, Icon }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Icon size={18} />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
