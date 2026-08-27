"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "./assets/icons";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Модульный синглтон: на странице одновременно играет только одна запись строя —
// начало воспроизведения одного плеера ставит на паузу все остальные.
let activeAudio: HTMLAudioElement | null = null;

function useAudioPlayer(src: string | undefined, preload: "none" | "metadata" = "none") {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Значение ref фиксируем при запуске эффекта: к моменту очистки audioRef.current уже
    // может указывать на другой узел, и тогда синглтон остался бы висеть на снятом плеере.
    const audio = audioRef.current;
    return () => {
      if (activeAudio === audio) activeAudio = null;
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  const audioEl = src ? (
    <audio
      ref={audioRef}
      src={src}
      // "metadata" на странице каталога означало бы десятки одновременных запросов
      // (по одному на карточку), упирающихся в лимит браузера на соединения к одному
      // origin — часть плееров зависала с length=0, потому что их запрос на метаданные
      // просто не успевал стартовать. Грузим только когда реально нажали play.
      preload={preload}
      onPlay={(e) => {
        if (activeAudio && activeAudio !== e.currentTarget) activeAudio.pause();
        activeAudio = e.currentTarget;
        setPlaying(true);
      }}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
    />
  ) : null;

  return { audioEl, playing, current, duration, toggle, seek };
}

/** Компактный плеер записи строя (кнопка + перемотка) — для карточки товара. */
export function AudioPlayerChip({
  src,
  label = "Поиграть на ханге",
  className = "",
}: {
  src?: string;
  label?: string;
  className?: string;
}) {
  if (!src) return null;

  // key={src} пересоздаёт внутренний компонент при смене записи, чтобы playing/current/duration
  // сбросились сами через начальное состояние — без useEffect, ставящего state синхронно.
  return <AudioPlayerChipInner key={src} src={src} label={label} className={className} />;
}

function AudioPlayerChipInner({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className: string;
}) {
  const { audioEl, playing, current, duration, toggle, seek } = useAudioPlayer(src);

  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors ${
        playing ? "bg-brand text-white" : "bg-paper-100"
      } ${className}`}
    >
      {audioEl}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle();
        }}
        aria-label={playing ? "Остановить воспроизведение строя" : label}
        title={label}
        className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-full transition-colors ${
          playing ? "bg-white text-brand" : "bg-white text-ink-900 hover:bg-brand hover:text-white"
        }`}
      >
        {playing ? <PauseIcon size={11} /> : <PlayIcon size={11} />}
      </button>
      <input
        type="range"
        aria-label="Перемотка записи строя"
        min={0}
        max={duration || 0}
        step={0.01}
        value={current}
        onClick={(e) => e.preventDefault()}
        onChange={(e) => seek(Number(e.target.value))}
        className={`h-1 min-w-0 flex-1 cursor-pointer ${playing ? "accent-white" : "accent-brand"}`}
      />
      <span className="w-8 shrink-0 text-[11px] tabular-nums">
        {formatTime(playing ? current : duration)}
      </span>
    </div>
  );
}

/** Полноразмерный плеер с прогресс-баром — для страницы товара. */
export function AudioPlayerBar({ src, className = "" }: { src?: string; className?: string }) {
  if (!src) return null;

  return <AudioPlayerBarInner key={src} src={src} className={className} />;
}

function AudioPlayerBarInner({ src, className }: { src: string; className: string }) {
  // Единственный плеер на странице товара — можно грузить метаданные сразу,
  // без риска забить лимит соединений (в отличие от карточек в каталоге).
  const { audioEl, playing, current, duration, toggle, seek } = useAudioPlayer(src, "metadata");

  return (
    <div className={`flex items-center gap-3 rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur ${className}`}>
      {audioEl}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Остановить воспроизведение строя" : "Поиграть на ханге"}
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
      >
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </button>
      <input
        type="range"
        aria-label="Перемотка записи строя"
        min={0}
        max={duration || 0}
        step={0.01}
        value={current}
        onChange={(e) => seek(Number(e.target.value))}
        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-brand"
      />
      <span className="w-20 shrink-0 text-right text-[13px] tabular-nums text-ink-600">
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  );
}
