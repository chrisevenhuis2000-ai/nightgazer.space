// NightGazer social v1 — shared, seek-safe motion helpers for the beat timelines.
// Easing: expo.out ≈ cubic-bezier(0.16, 1, 0.3, 1), the plate easing from plate.css.
window.NG = {
  ease: "expo.out",

  // The live dot breathes and its hairline halo expands: realtime, not an alarm.
  breathe(tl, dot, halo, t, dur) {
    tl.fromTo(dot, { boxShadow: "0 0 0 0 rgba(55,138,221,0.42)" },
      { boxShadow: "0 0 18px 4px rgba(55,138,221,0.34)", duration: dur / 2, ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t);
    tl.fromTo(halo, { opacity: 0.5, scale: 0.72 },
      { opacity: 0, scale: 1.5, duration: dur * 0.7, ease: "power2.out", immediateRender: false }, t);
  },

  // Text revealed left to right, as if behind a hairline.
  // `hidden` (default true) applies the start state from the clip's first frame.
  wipeIn(tl, sel, t, d, hidden = true) {
    tl.fromTo(sel, { clipPath: "inset(-10% 100% -10% 0)" },
      { clipPath: "inset(-10% 0% -10% 0)", duration: d, ease: "power3.out", immediateRender: hidden }, t);
  },

  // An exposure developing: latent (faint, blurred) to sharp.
  // Elements that must stay invisible until `t` start at opacity 0 in CSS.
  develop(tl, sel, t, d) {
    tl.fromTo(sel, { opacity: 0.25, filter: "blur(10px)" },
      { opacity: 1, filter: "blur(0px)", duration: d, ease: this.ease, immediateRender: false }, t);
  },

  // Deterministic ticking readouts, driven by the timeline (seek-safe).
  ticker(tl, t, dur, render) {
    const p = { v: 0 };
    tl.to(p, { v: 1, duration: dur, ease: "none", onUpdate: () => render(p.v) }, t);
  },
};
