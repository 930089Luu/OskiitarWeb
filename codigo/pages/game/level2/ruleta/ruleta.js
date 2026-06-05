(() => {
  // ===== DOM =====
  const wheelSvg = document.getElementById("wheelSvg");
  const msgEl = document.getElementById("msg");

  const spinBtn = document.getElementById("spinBtn");
  const clearBtn = document.getElementById("clearBtn");
  const backBtn = document.getElementById("backBtn");

  const creditsEl = document.getElementById("credits");
  const goalEl = document.getElementById("goal");
  const totalBetEl = document.getElementById("totalBet");
  const chipPickedEl = document.getElementById("chipPicked");

  const numsWrap = document.getElementById("nums");

  const toastEl = document.getElementById("toast");
  const toastMsgEl = document.getElementById("toastMsg");

  // ===== CONFIG =====
  const START_CREDITS = 100;
  const GOAL_CREDITS = 110;

  const BACK_URL = "../level2.html";
  const WIN_URL = "../pista2/pista2.html"; // cámbialo a tu pista real si se llama distinto

  // Orden ruleta europea
  const ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8,
    23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12,
    35, 3, 26
  ];

  const RED_SET = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  // ===== STATE =====
  let credits = START_CREDITS;
  let goal = GOAL_CREDITS;
  let chip = 5;

  let spinning = false;
  let currentRotationDeg = 0;

  // bets: key -> Map(denom -> count)
  // keys: number:X, red, black, low
  const bets = new Map();

  // ===== UI UTILS =====
  function showToast(text) {
    let t = 0;
    toastMsgEl.textContent = text;
    toastEl.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    t = window.setTimeout(() => toastEl.classList.remove("is-visible"), 1400);
    showToast._t = t;
  }
  showToast._t = 0;

  function randomInt(min, maxInclusive) {
    let v = 0;
    v = Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
    return v;
  }

  function getOrCreateBetMap(key) {
    let m = null;
    m = bets.get(key);
    if (!m) {
      m = new Map();
      bets.set(key, m);
    }
    return m;
  }

  function getTotalBet() {
    let sum = 0;
    for (const m of bets.values()) {
      for (const [den, cnt] of m.entries()) sum += den * cnt;
    }
    return sum;
  }

  function updateHud() {
    creditsEl.textContent = String(credits);
    goalEl.textContent = String(goal);
    totalBetEl.textContent = String(getTotalBet());
    chipPickedEl.textContent = String(chip);
  }

  function formatBetText(m) {
    // Ej: 2(5) + 1(20)
    let parts = [];
    for (const [den, cnt] of m.entries()) {
      if (cnt > 0) parts.push(`${cnt}(${den})`);
    }
    return parts.join(" + ");
  }

  function setAmtText(id, text) {
    let el = null;
  
    el = document.getElementById(id);
  
    // Fallback por si el id no existe (o hay algo raro con el DOM):
    // buscamos el .amt dentro del botón correspondiente por data-bet
    if (!el) {
      if (id === "amt-red") el = document.querySelector('[data-bet="red"] .amt');
      else if (id === "amt-black") el = document.querySelector('[data-bet="black"] .amt');
      else if (id === "amt-low") el = document.querySelector('[data-bet="low"] .amt');
      else if (id === "amt-number-0") el = document.querySelector('[data-bet="number:0"] .amt');
      else if (id.startsWith("amt-number-")) {
        const n = id.replace("amt-number-", "");
        el = document.querySelector(`[data-bet="number:${n}"] .amt`);
      }
    }
  
    if (!el) return;
    el.textContent = text || "";
  }
  
  function updateAmountsUI() {
    let btns = null;
    let i = 0;
  
    // 1) Pintar cualquier botón que tenga data-bet (red/black/low/number:0..36)
    btns = document.querySelectorAll('[data-bet]');
  
    i = 0;
    while (i < btns.length) {
      let key = "";
      let m = null;
      let text = "";
      let amtEl = null;
  
      key = String(btns[i].dataset.bet || "");
      m = bets.get(key) ?? new Map();
      text = formatBetText(m);
  
      amtEl = btns[i].querySelector(".amt");
      if (amtEl) amtEl.textContent = text || "";
  
      i += 1;
    }
  
    // 2) HUD
    updateHud();
  }
  
  

  function canAddBet(denom) {
    let ok = false;
    ok = (getTotalBet() + denom) <= credits;
    return ok;
  }

  function addChipToBet(key) {
    let m = null;
    let prev = 0;

    if (!canAddBet(chip)) {
      showToast("No tienes créditos suficientes.");
      return;
    }

    m = getOrCreateBetMap(key);
    prev = m.get(chip) ?? 0;
    m.set(chip, prev + 1);

    updateAmountsUI();
  }

  function clearBets() {
    bets.clear();
    updateAmountsUI();
    showToast("Apuestas borradas.");
  }

  function setChip(value) {
    let btns = null;
    let i = 0;

    chip = value;
    btns = document.querySelectorAll(".chipBtn[data-chip]");

    i = 0;
    while (i < btns.length) {
      btns[i].classList.toggle("is-active", Number(btns[i].dataset.chip) === chip);
      i += 1;
    }

    updateHud();
  }

  // ===== RULES =====
  function isRed(n) {
    return RED_SET.has(n);
  }

  function sumBetMoney(key) {
    let total = 0;
    let m = null;

    m = bets.get(key);
    if (!m) return 0;

    for (const [den, cnt] of m.entries()) total += den * cnt;
    return total;
  }

  function computeWinnings(landed) {
    let win = 0;

    // número x36
    {
      const nb = sumBetMoney(`number:${landed}`);
      if (nb > 0) win += nb * 36;
    }

    // outside x2 (solo si no es 0)
    if (landed !== 0) {
      const redB = sumBetMoney("red");
      const blackB = sumBetMoney("black");
      const lowB = sumBetMoney("low");

      if (isRed(landed)) win += redB * 2;
      else win += blackB * 2;

      if (landed >= 1 && landed <= 18) win += lowB * 2;
    }

    return win;
  }

  function finishIfGoal() {
    if (credits >= goal) {
      msgEl.textContent = "¡Objetivo conseguido! ✅";
      window.setTimeout(() => { window.location.href = WIN_URL; }, 900);
      return true;
    }
    return false;
  }

  // ===== FIX NÚMERO REAL BAJO EL PUNTERO =====
  function normDeg(deg) {
    let a = deg % 360;
    if (a < 0) a += 360;
    return a;
  }

  function numberUnderPointer(rotationDeg) {
    const segDeg = 360 / ORDER.length;
    const rot = normDeg(rotationDeg);

    // des-rotamos para llevar el ángulo del puntero al "ángulo de la rueda"
    const wheelAngle = normDeg(360 - rot);

    // + segDeg/2 para seleccionar por el centro del segmento
    const idx = Math.floor(normDeg(wheelAngle + segDeg / 2) / segDeg);
    return ORDER[idx];
  }

  // ===== SVG WHEEL =====
  function polar(cx, cy, r, deg) {
    let rad = 0;
    let x = 0;
    let y = 0;

    rad = (deg - 90) * Math.PI / 180;
    x = cx + r * Math.cos(rad);
    y = cy + r * Math.sin(rad);
    return { x, y };
  }

  function wedgePath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    let p1 = null;
    let p2 = null;
    let p3 = null;
    let p4 = null;
    let large = 0;

    p1 = polar(cx, cy, rOuter, startDeg);
    p2 = polar(cx, cy, rOuter, endDeg);
    p3 = polar(cx, cy, rInner, endDeg);
    p4 = polar(cx, cy, rInner, startDeg);

    large = (endDeg - startDeg) > 180 ? 1 : 0;

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
      "Z"
    ].join(" ");
  }

  function createSvgEl(name, attrs) {
    let el = null;
    let k = "";

    el = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (k in attrs) el.setAttribute(k, String(attrs[k]));
    return el;
  }

  function buildWheelSvg() {
    let cx = 0;
    let cy = 0;
    let segDeg = 0;

    let rOuter = 0;
    let rInner = 0;
    let rText = 0;

    let defs = null;
    let grad = null;
    let rot = null;

    let i = 0;

    cx = 250;
    cy = 250;
    segDeg = 360 / ORDER.length;

    rOuter = 235;
    rInner = 165;
    rText = 205;

    wheelSvg.innerHTML = "";

    defs = createSvgEl("defs", {});
    grad = createSvgEl("radialGradient", { id: "goldGrad", cx: "35%", cy: "30%", r: "70%" });
    grad.appendChild(createSvgEl("stop", { offset: "0%", "stop-color": "#f1dd9a" }));
    grad.appendChild(createSvgEl("stop", { offset: "55%", "stop-color": "#caa45a" }));
    grad.appendChild(createSvgEl("stop", { offset: "100%", "stop-color": "#8e6a2a" }));
    defs.appendChild(grad);
    wheelSvg.appendChild(defs);

    wheelSvg.appendChild(createSvgEl("circle", { cx, cy, r: 245, fill: "#caa45a" }));

    rot = createSvgEl("g", { id: "wheelRot" });
    wheelSvg.appendChild(rot);

    rot.appendChild(createSvgEl("circle", { cx, cy, r: 245, fill: "none", stroke: "#e3c27a", "stroke-width": 18 }));
    rot.appendChild(createSvgEl("circle", { cx, cy, r: 235, fill: "none", stroke: "#8e6a2a", "stroke-width": 6, opacity: 0.6 }));

    i = 0;
    while (i < ORDER.length) {
      let num = 0;
      let start = 0;
      let end = 0;
      let color = "";
      let mid = 0;
      let pos = null;
      let t = null;

      num = ORDER[i];
      start = i * segDeg;
      end = start + segDeg;

      if (num === 0) color = "#1c8c3a";
      else if (RED_SET.has(num)) color = "#c62828";
      else color = "#111111";

      rot.appendChild(createSvgEl("path", {
        d: wedgePath(cx, cy, rOuter, rInner, start, end),
        fill: color,
        stroke: "rgba(255,255,255,.18)",
        "stroke-width": 1
      }));

      mid = start + segDeg / 2;
      pos = polar(cx, cy, rText, mid);

      t = createSvgEl("text", {
        x: pos.x,
        y: pos.y,
        fill: "#ffffff",
        "font-size": 18,
        "font-weight": 900,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${mid} ${pos.x} ${pos.y})`
      });
      t.textContent = String(num);
      rot.appendChild(t);

      i += 1;
    }

    rot.appendChild(createSvgEl("circle", { cx, cy, r: 160, fill: "url(#goldGrad)" }));

    {
      const arm = createSvgEl("g", { opacity: 0.95 });
      arm.appendChild(createSvgEl("rect", { x: 245, y: 120, width: 10, height: 260, rx: 5, fill: "#d9ad63" }));
      arm.appendChild(createSvgEl("rect", { x: 120, y: 245, width: 260, height: 10, rx: 5, fill: "#d9ad63" }));
      rot.appendChild(arm);
      rot.appendChild(createSvgEl("circle", { cx, cy, r: 18, fill: "#e7bf77" }));
    }
  }

  function indexOfNumber(n) {
    let i = 0;
    i = 0;
    while (i < ORDER.length) {
      if (ORDER[i] === n) return i;
      i += 1;
    }
    return 0;
  }

  function spinToNumber(landed) {
    let idx = indexOfNumber(landed);
    let segDeg = 360 / ORDER.length;
  
    let centerDeg = (idx + 0.5) * segDeg;
    let extraSpins = randomInt(6, 9);
  
    //  IMPORTANTE: NO acumulamos rotación anterior
    let target = extraSpins * 360 + (360 - centerDeg);
  
    currentRotationDeg = target;
  
    document.getElementById("wheelRot").style.transform =
      `rotate(${target}deg)`;
  }
  

  // ===== TABLE BUILD =====
  function buildTableNumbers() {
    let n = 1;
    numsWrap.innerHTML = "";
  
    while (n <= 36) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell num";
  
      btn.dataset.bet = `number:${n}`;
  
      if (RED_SET.has(n)) btn.classList.add("is-red");
      else btn.classList.add("is-black");
  
      btn.innerHTML = `
        <span class="label">${n}</span>
        <span class="amt"></span>
      `;
  
      // 👇 LA CLAVE: usamos dataset en vez de variable externa
      btn.addEventListener("click", function () {
        const key = this.dataset.bet;
        addChipToBet(key);
      });
  
      numsWrap.appendChild(btn);
      n += 1;
    }
  
    // 0
    const zeroBtn = document.querySelector('[data-bet="number:0"]');
    if (zeroBtn) {
      zeroBtn.addEventListener("click", function () {
        addChipToBet(this.dataset.bet);
      });
    }
  
    // outside
    document.querySelector('[data-bet="red"]')
      ?.addEventListener("click", function () {
        addChipToBet(this.dataset.bet);
      });
  
    document.querySelector('[data-bet="black"]')
      ?.addEventListener("click", function () {
        addChipToBet(this.dataset.bet);
      });
  
    document.querySelector('[data-bet="low"]')
      ?.addEventListener("click", function () {
        addChipToBet(this.dataset.bet);
      });
  }
  

  // ===== FLOW =====
  function onSpin() {
    let total = 0;
    let landed = 0;
  
    if (spinning) return;
  
    total = getTotalBet();
    if (total <= 0) {
      showToast("Primero apuesta (pon fichas en la mesa).");
      return;
    }
  
    spinning = true;
    spinBtn.disabled = true;
  
    credits -= total;
    updateHud();
  
    msgEl.textContent = "Girando...";
  
    // elegimos un objetivo para animación
    const randomIndex = randomInt(0, ORDER.length - 1);
landed = ORDER[randomIndex];
spinToNumber(landed);

  
    window.setTimeout(() => {
      let win = 0;
  
      // ✅ USAMOS DIRECTAMENTE EL NÚMERO GENERADO
      win = computeWinnings(landed);
  
      if (win > 0) {
        credits += win;
        msgEl.textContent = `Ha salido el ${landed}. ¡Has tenido suerte! Premio +${win}`;
      } else {
        msgEl.textContent = `Ha salido el ${landed}. Mala suerte.`;
      }
      
  
      bets.clear();
      updateAmountsUI();
  
      if (finishIfGoal()) return;
  
      spinning = false;
      spinBtn.disabled = false;
    }, 3300);
  }
  

  function onBack() {
    window.location.href = BACK_URL;
  }

  function initChips() {
    const btns = document.querySelectorAll(".chipBtn[data-chip]");
    let i = 0;

    i = 0;
    while (i < btns.length) {
      const v = Number(btns[i].dataset.chip);
      btns[i].addEventListener("click", () => setChip(v));
      i += 1;
    }
  }

  function init() {
    credits = START_CREDITS;
    goal = GOAL_CREDITS;
    chip = 5;

    spinning = false;
    currentRotationDeg = 0;

    bets.clear();

    buildWheelSvg();
    buildTableNumbers();
    initChips();

    setChip(5);
    updateAmountsUI();

    spinBtn.addEventListener("click", onSpin);
    clearBtn.addEventListener("click", clearBets);
    backBtn.addEventListener("click", onBack);
  }

  init();
})();

