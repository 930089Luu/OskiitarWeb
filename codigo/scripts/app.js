document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const openBtn = document.getElementById("openEnvelope");
  const envelope = document.getElementById("envelope");
  const letter = document.getElementById("letter");
  const letterHandle = document.getElementById("letterHandle");

  let isDragging = false;
  let startY = 0;
  let currentY = 160;
  let dragStartY = 160;

  const Y_CLOSED = 160;
  const Y_TOP = -50;
  const Y_BOTTOM = 10;

  function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function setLetterY(px) {
    const y = clamp(px, Y_TOP, Y_BOTTOM);
    currentY = y;
    if (letter) letter.style.setProperty("--letterY", `${y}px`);
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      document.body.classList.add("show-envelope");
    });
  }

  if (openBtn && envelope && letter) {
    openBtn.addEventListener("click", () => {
      envelope.classList.add("is-open");
      letter.setAttribute("aria-hidden", "false");
      letter.style.transition = "transform 380ms ease, opacity 200ms ease";
      setLetterY(Y_CLOSED);
    });
  }

  function onPointerDown(e) {
    if (!envelope || !envelope.classList.contains("is-open")) return;
    if (!letter) return;

    isDragging = true;
    startY = e.clientY;
    dragStartY = currentY;

    letter.style.transition = "none";
    letter.setPointerCapture(e.pointerId);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const delta = e.clientY - startY;
    setLetterY(dragStartY + delta);
  }

  function onPointerUp() {
    if (!isDragging || !letter) return;

    isDragging = false;
    letter.style.transition = "transform 220ms ease, opacity 200ms ease";

    if (currentY <= Y_TOP) setLetterY(Y_TOP);
    else setLetterY(Y_CLOSED);

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  }

  if (letterHandle) {
    letterHandle.addEventListener("pointerdown", onPointerDown);
  }
});
