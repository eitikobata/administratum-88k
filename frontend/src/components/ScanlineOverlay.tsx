// Pure decoration: a fixed, pointer-events-none layer that paints faint
// horizontal scanlines and a soft vignette over the whole viewport. Sits
// once in the root layout so every page gets the CRT feel without each
// page having to remember to add it.
export function ScanlineOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 animate-flicker"
      style={{
        background:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
        mixBlendMode: 'multiply',
      }}
    />
  );
}
