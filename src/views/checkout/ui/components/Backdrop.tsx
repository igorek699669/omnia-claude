export function Backdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-paper-100">
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 20% 25%, #cbb79a 0%, transparent 45%), radial-gradient(circle at 80% 20%, #4a3a2c 0%, transparent 40%), radial-gradient(circle at 60% 80%, #8f775f 0%, transparent 45%), radial-gradient(circle at 15% 85%, #2e2117 0%, transparent 40%), #d8c9b4",
        }}
      />
    </div>
  );
}
