(() => {
  const msgEl = document.getElementById("msg");
  const backBtn = document.getElementById("backBtn");
  const spinBtn = document.getElementById("spinBtn");

  const symEls = [
    document.getElementById("sym0"),
    document.getElementById("sym1"),
    document.getElementById("sym2"),
  ];

  // Al ganar -> Pista 1 (dentro de level1/pista1/)
  const NEXT_URL = "../pista1/pista1.html";

  // 5 fallos seguidos => 6ª gana seguro
  const PITY_FAILS_REQUIRED = 2;

  let spinning = false;
  let failsInARow = 0;

  // símbolos (como en tu captura)
  const symbols = ["7", "♥", "♦", "♣", "♠"];

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function randSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
  }

  function isThreeEqual(a, b, c) {
    return (a === b && b === c);
  }

  function pickForcedWinSymbol() {
    const options = ["7", "♥", "♠"];
    return options[Math.floor(Math.random() * options.length)];
  }

  async function spinReel(reelIndex, durationMs, forcedFinalSymbol) {
    let start = Date.now();

    const intervalId = setInterval(() => {
      symEls[reelIndex].textContent = randSymbol();
      symEls[reelIndex].style.transform = `translateY(${Math.random() * 14 - 7}px)`;
    }, 70);

    while (Date.now() - start < durationMs) {
      await sleep(40);
    }

    clearInterval(intervalId);

    const finalSym = forcedFinalSymbol ? forcedFinalSymbol : randSymbol();
    symEls[reelIndex].textContent = finalSym;
    symEls[reelIndex].style.transform = "translateY(0)";
    return finalSym;
  }

  async function onPlay() {
    if (spinning) return;

    spinning = true;
    spinBtn.disabled = true;

    const forceWin = (failsInARow >= PITY_FAILS_REQUIRED);
    let forcedSym = "";

    if (forceWin) {
      forcedSym = pickForcedWinSymbol();
    }

    msgEl.textContent = "Girando...";

    const a = await spinReel(0, 900,  forceWin ? forcedSym : "");
    const b = await spinReel(1, 1200, forceWin ? forcedSym : "");
    const c = await spinReel(2, 1500, forceWin ? forcedSym : "");

    if (isThreeEqual(a, b, c)) {
      failsInARow = 0;

      msgEl.textContent = "¡Has ganado!";
      await sleep(650);

      window.location.href = NEXT_URL;
      return;
    }

    failsInARow += 1;
    msgEl.textContent = "Prueba otra vez.";

    spinning = false;
    spinBtn.disabled = false;
  }

  function onBack() {
    window.location.href = "../level1.html";
  }

  spinBtn.addEventListener("click", onPlay);
  backBtn.addEventListener("click", onBack);
})();
