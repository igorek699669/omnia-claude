"use client";

import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import type { Pvz } from "../model/types";

const MOSCOW_CENTER: [number, number] = [55.751244, 37.618423];

export function PvzMap({
  points,
  onSelect,
}: {
  points: Pvz[];
  onSelect: (point: Pvz) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-input bg-paper-200 text-center text-sm text-ink-600">
        Яндекс.Карты: NEXT_PUBLIC_YANDEX_MAPS_API_KEY не задан в .env.local
      </div>
    );
  }

  const center: [number, number] = points[0] ? [points[0].lat, points[0].lon] : MOSCOW_CENTER;

  return (
    <YMaps query={{ apikey: apiKey, lang: "ru_RU" }}>
      <Map defaultState={{ center, zoom: 11 }} className="aspect-[4/3] overflow-hidden rounded-input">
        {points.map((point) => (
          <Placemark
            key={point.code}
            geometry={[point.lat, point.lon]}
            properties={{ hintContent: point.address }}
            options={{ preset: "islands#orangeDotIcon" }}
            onClick={() => onSelect(point)}
          />
        ))}
      </Map>
    </YMaps>
  );
}
