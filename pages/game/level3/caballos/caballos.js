let bet = null;
let raceStarted = false;

function startRace(selectedHorse) {
  if (raceStarted) return;

  raceStarted = true;
  bet = selectedHorse;

  const horse1 = document.getElementById("horse1");
  const horse2 = document.getElementById("horse2");
  const horse3 = document.getElementById("horse3");

  let pos1 = 20;
  let pos2 = 20;
  let pos3 = 20;

  const laneWidth = document.querySelector(".lane").offsetWidth;
  const finish = laneWidth - 150;

  const losses = parseInt(localStorage.getItem("lossesLevel3")) || 0;

  let speed1, speed2, speed3;

  if (losses >= 3) {
    speed1 = (bet === 1) ? 6 : 2;
    speed2 = (bet === 2) ? 6 : 2;
    speed3 = (bet === 3) ? 6 : 2;
  } else {
    speed1 = Math.random() * 2 + 2;
    speed2 = Math.random() * 2 + 2;
    speed3 = Math.random() * 2 + 2;
  }

  function animate() {
    pos1 += speed1 + Math.random();
    pos2 += speed2 + Math.random();
    pos3 += speed3 + Math.random();

    horse1.style.left = pos1 + "px";
    horse2.style.left = pos2 + "px";
    horse3.style.left = pos3 + "px";

    if (pos1 >= finish) return endRace(1);
    if (pos2 >= finish) return endRace(2);
    if (pos3 >= finish) return endRace(3);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function endRace(winner) {
  const message = document.getElementById("result-message");
  let losses = parseInt(localStorage.getItem("lossesLevel3")) || 0;

  if (winner === bet) {
    localStorage.setItem("lossesLevel3", 0);
    window.location.href = "../pista3/pista3.html";
  } else {
    losses++;
    localStorage.setItem("lossesLevel3", losses);

    message.style.display = "block";
    message.innerText = "Mala suerte, apostar no es lo tuyo ;)";

    setTimeout(() => {
      location.reload();
    }, 2000);
  }
}
