// The loading-screen version of the BuilderDocs mark (see public/builderdocs-mark-transparent.svg):
// buildings rise into place, then the document appears and its lines draw themselves in —
// "we build it, then we document it," looping. Pure CSS (keyframes in index.css), so it
// degrades to the plain fully-built mark if animations aren't supported, and respects
// prefers-reduced-motion (see the dedicated override in index.css) by showing the same
// fully-built, static mark instead of animating.
//
// Every transform-origin below is an absolute point in this SVG's own 512x512 coordinate
// space (each building's horizontal center on the y=402 ground line; the document's
// approximate center), not transform-box:fill-box — fill-box's bounding-box computation
// on a <g> with multiple children is an inconsistently-supported corner of the CSS
// Transforms spec across browsers, and a plain absolute coordinate has no such dependency.
//
// This is ONLY used here, on the loading screen — the logo everywhere else in the app
// (header, sidebar, favicon) is untouched and still renders from the plain SVG file.
export default function AnimatedBrandMark({ className = 'h-14 w-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="BuilderDocs"
    >
      <rect width="512" height="512" rx="112" fill="#F5F7FA" />

      {/* Fades the whole built scene in, holds it, fades it out — the seam the loop resets
          on. Reduced-motion/no-animation fallback: opacity 1 (see base style + override). */}
      <g className="bd-mark-cycle" style={{ opacity: 1 }}>
        {/* Each building rises from the ground line (y=402) on its own staggered timing.
            transform-origin uses an absolute point in the SVG's own coordinate space
            (this building's horizontal center, on the ground line) rather than
            transform-box:fill-box — fill-box's bounding-box computation on a <g> with
            multiple children is inconsistently supported across browsers; a plain
            absolute coordinate has no such dependency and anchors reliably everywhere. */}
        <g
          className="bd-mark-building bd-mark-rise-1"
          style={{ transformOrigin: '105px 402px', transform: 'scaleY(1)' }}
        >
          <path d="M52 190 158 128v274H52V190Z" fill="#1D4ED8" />
          <path d="M205 145h20v24h-20z" fill="#FFFFFF" />
        </g>
        <g
          className="bd-mark-building bd-mark-rise-2"
          style={{ transformOrigin: '230px 402px', transform: 'scaleY(1)' }}
        >
          <path d="M174 112 286 48v354H174V112Z" fill="#17243A" />
          <path d="M248 87h20v24h-20zm-43 66h20v24h-20z" fill="#FFFFFF" />
        </g>
        <g
          className="bd-mark-building bd-mark-rise-3"
          style={{ transformOrigin: '341px 402px', transform: 'scaleY(1)' }}
        >
          <path d="M302 166 380 121v281h-78V166Z" fill="#17243A" />
          <path d="M291 96h20v24h-20z" fill="#FFFFFF" />
        </g>

        {/* The document: appears (scale + fade in) once the buildings are up, then its
            three lines draw themselves in, left edge to right. */}
        <g className="bd-mark-doc" style={{ transformOrigin: '328px 320px', opacity: 1, transform: 'scale(1)' }}>
          <path d="M232 174h158l82 82v171c0 27-21 48-48 48H232c-27 0-48-21-48-48V222c0-27 21-48 48-48Z" fill="#1D4ED8" />
          <path d="M232 198h148l74 74v155c0 14-11 25-25 25H232c-14 0-25-11-25-25V223c0-14 11-25 25-25Z" fill="#FFFFFF" />
          <path d="M380 198v56c0 27 21 48 48 48h44v-48l-92-56Z" fill="#1D4ED8" />
          <path
            d="M252 310h94"
            fill="none" stroke="#1D4ED8" strokeWidth={20} strokeLinecap="round"
            className="bd-mark-line bd-mark-draw-1"
            style={{ strokeDasharray: 94, strokeDashoffset: 0 }}
          />
          <path
            d="M252 359h124"
            fill="none" stroke="#1D4ED8" strokeWidth={20} strokeLinecap="round"
            className="bd-mark-line bd-mark-draw-2"
            style={{ strokeDasharray: 124, strokeDashoffset: 0 }}
          />
          <path
            d="M252 408h82"
            fill="none" stroke="#1D4ED8" strokeWidth={20} strokeLinecap="round"
            className="bd-mark-line bd-mark-draw-3"
            style={{ strokeDasharray: 82, strokeDashoffset: 0 }}
          />
        </g>
      </g>
    </svg>
  );
}
