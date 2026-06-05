"use strict";

/* ============ CONFIG ============ */
const TARGET_ANSWER = "vehiculo longo";
const NEXT_URL = "../../level3/level3.html";
   
const BACK_URL = "../level2.html";

const PISTA_LINES = [
  "Hay un sitio donde te conviertes en ratilla,según yo,",
  "pegado al calorcito…",
  "Aunque luego te quejes",
  "de que el agua está ardiendo.",
  "Si quieres seguir avanzando ya sabes a donde entrar sin ropa"
  
];

// Más lento que antes
const TYPE_SPEED_MS = 30;
const LINE_BREAK = "\n";

/* ============ HELPERS ============ */
function normalizeApostrophes(str) {
  let s = "";
  s = str;
  s = s.replaceAll("’", "'");
  s = s.replaceAll("‘", "'");
  s = s.replaceAll("`", "'");
  return s;
}

function normalizeAnswer(str) {
  let s = "";
  s = str ?? "";
  s = normalizeApostrophes(s);
  s = s.trim().toLowerCase();
  return s;
}

function isCorrectAnswer(inputValue) {
  let a = "";
  let b = "";
  a = normalizeAnswer(inputValue);
  b = normalizeAnswer(TARGET_ANSWER);
  return a === b;
}

function sleep(ms) {
  let p = null;
  p = new Promise((resolve) => setTimeout(resolve, ms));
  return p;
}

/* ============ UI ============ */
function showToast(msg) {
  let toast = null;
  let toastMsg = null;

  toast = document.getElementById("toast");
  toastMsg = document.getElementById("toastMsg");

  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.add("is-visible");

  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    let t = null;
    t = document.getElementById("toast");
    if (!t) return;
    t.classList.remove("is-visible");
  }, 1400);
}
showToast._t = 0;

async function typeText(el, text) {
  let i = 0;
  let current = "";

  if (!el) return;

  el.textContent = "";
  i = 0;
  current = "";

  while (i < text.length) {
    current += text[i];
    el.textContent = current;
    i += 1;
    await sleep(TYPE_SPEED_MS);
  }
}

async function runTypewriter() {
  let el = null;
  let fullText = "";

  el = document.getElementById("pistaText");
  fullText = PISTA_LINES.join(LINE_BREAK);

  await typeText(el, fullText);
}

function onSubmit(e) {
  let input = null;
  let value = "";
  let ok = false;

  e.preventDefault();

  input = document.getElementById("answerInput");
  if (!input) return;

  value = input.value;
  ok = isCorrectAnswer(value);

  if (ok) {
    window.location.href = NEXT_URL;
    return;
  }

  input.classList.remove("is-error");
  void input.offsetWidth;
  input.classList.add("is-error");
  showToast("Respuesta incorrecta. Prueba otra vez.");
  input.focus();
  input.select();
}

function onBack() {
  window.location.href = BACK_URL;
}

function init() {
  let form = null;
  let input = null;
  let backBtn = null;

  form = document.getElementById("pistaForm");
  input = document.getElementById("answerInput");
  backBtn = document.getElementById("backBtn");

  if (form) form.addEventListener("submit", onSubmit);
  if (backBtn) backBtn.addEventListener("click", onBack);

  if (input) input.focus();
  runTypewriter();
}

document.addEventListener("DOMContentLoaded", init);
