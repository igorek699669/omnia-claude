/**
 * Мостик «кнопка на странице → плавающий виджет связи»: виджет живёт в layout, кнопки — в
 * секциях страниц, общего родителя нет. Стор ради одного мигания избыточен — событие на window.
 */
const ATTENTION_EVENT = "omnia:contact-widget-attention";

/** Заставить виджет связи ярко мигнуть — чтобы пользователь заметил, куда писать. */
export function pingContactWidget() {
  window.dispatchEvent(new Event(ATTENTION_EVENT));
}

export function onContactWidgetPing(handler: () => void) {
  window.addEventListener(ATTENTION_EVENT, handler);
  return () => window.removeEventListener(ATTENTION_EVENT, handler);
}
