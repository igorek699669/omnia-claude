export function HandpanArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Ханг из нержавеющей стали">
      <defs>
        <radialGradient id="pan-body" cx="42%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#DCC9B6" />
          <stop offset="38%" stopColor="#A98F76" />
          <stop offset="72%" stopColor="#5E4936" />
          <stop offset="100%" stopColor="#2E2117" />
        </radialGradient>
        <radialGradient id="pan-dimple" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#2E2117" />
          <stop offset="55%" stopColor="#6B543E" />
          <stop offset="100%" stopColor="#8F775F" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#pan-body)" />
      <circle cx="100" cy="100" r="24" fill="url(#pan-dimple)" stroke="#2E2117" strokeOpacity=".35" />
      <g fill="url(#pan-dimple)" stroke="#2E2117" strokeOpacity=".25">
        <ellipse cx="100" cy="34" rx="13" ry="10" />
        <ellipse cx="147" cy="53" rx="13" ry="10" transform="rotate(45 147 53)" />
        <ellipse cx="166" cy="100" rx="10" ry="13" />
        <ellipse cx="147" cy="147" rx="13" ry="10" transform="rotate(-45 147 147)" />
        <ellipse cx="100" cy="166" rx="13" ry="10" />
        <ellipse cx="53" cy="147" rx="13" ry="10" transform="rotate(45 53 147)" />
        <ellipse cx="34" cy="100" rx="10" ry="13" />
        <ellipse cx="53" cy="53" rx="13" ry="10" transform="rotate(-45 53 53)" />
      </g>
      <ellipse cx="76" cy="62" rx="46" ry="30" fill="#FFF" opacity=".1" transform="rotate(-28 76 62)" />
    </svg>
  );
}
