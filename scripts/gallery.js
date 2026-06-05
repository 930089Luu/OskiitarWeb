(() => {

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  const closeTargets = Array.from(document.querySelectorAll('[data-lb-close]'));
  const btnPrev = document.querySelector('[data-lb-prev]');
  const btnNext = document.querySelector('[data-lb-next]');

  const btnAdd = document.getElementById('btnAddPhoto');
  const inputFile = document.getElementById('subirFoto');
  const galeria = document.getElementById('galeria');

  const cloudName = "dbsrgg5xv";
  const preset = "galeria_sanValentin";

  let images = [];
  let index = 0;
  let lastFocus = null;


  function actualizarImagenes() {
    images = Array.from(document.querySelectorAll('img[data-gallery]'));
    images.forEach((img, i) => {
      img.onclick = () => openLightbox(i);
    });
  }


  function isOpen() {
    return lightbox.classList.contains('is-open');
  }


  function openLightbox(i) {
    const img = images[i];
    const src = (img && img.getAttribute('data-full')) || (img && img.getAttribute('src'));
    const alt = img ? img.getAttribute('alt') : '';

    if (!src) return;

    index = i;
    lastFocus = document.activeElement;

    lightboxImg.src = src;
    lightboxImg.alt = alt;

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeBtn = lightbox.querySelector('[data-lb-close]');
    if (closeBtn) closeBtn.focus();
  }


  function closeLightbox() {
    if (!isOpen()) return;

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    lightboxImg.src = '';
    lightboxImg.alt = '';

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }


  function go(delta) {
    const total = images.length;
    if (total === 0) return;
    index = (index + delta + total) % total;
    openLightbox(index);
  }


  function añadirImagen(url) {
    const figure = document.createElement("figure");
    figure.className = "shot";

    const img = document.createElement("img");
    img.src = url;
    img.setAttribute("data-gallery", "");

    figure.appendChild(img);
    galeria.appendChild(figure);

    actualizarImagenes();
  }


  function guardarFoto(url) {
    const fotos = JSON.parse(localStorage.getItem("galeriaFotos")) || [];
    if (!fotos.includes(url)) {
      fotos.push(url);
      localStorage.setItem("galeriaFotos", JSON.stringify(fotos));
    }
  }


  function cargarFotos() {
    const fotos = JSON.parse(localStorage.getItem("galeriaFotos")) || [];
    fotos.forEach(url => añadirImagen(url));
  }


  async function subirImagen() {
    const file = inputFile.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", preset);
    data.append("folder", "galeria");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: data }
    );

    const json = await res.json();
    añadirImagen(json.secure_url);
    guardarFoto(json.secure_url);
  }


  if (btnAdd) {
    btnAdd.onclick = () => inputFile.click();
  }

  if (inputFile) {
    inputFile.onchange = subirImagen;
  }

  closeTargets.forEach(el => el.addEventListener('click', closeLightbox));

  if (btnPrev) btnPrev.addEventListener('click', () => go(-1));
  if (btnNext) btnNext.addEventListener('click', () => go(1));

  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });


  cargarFotos();
  actualizarImagenes();

})();
