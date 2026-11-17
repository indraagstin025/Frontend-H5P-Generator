import './FloatingShapes.css';

/** Decorative background, kept outside the accessible content and pointer flow. */
export function FloatingShapes() {
  return (
    <div className="floating-shapes" aria-hidden="true">
      <span className="floating-shape floating-shape--square" />
      <span className="floating-shape floating-shape--ring" />
      <span className="floating-shape floating-shape--triangle" />
      <span className="floating-shape floating-shape--small-square" />
      <span className="floating-shape floating-shape--circle" />
    </div>
  );
}
