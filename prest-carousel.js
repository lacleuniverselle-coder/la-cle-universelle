/* Pages « Prestations » : aperçu de chaque catégorie.
   - Ordinateur : les photos défilent au survol de l'aperçu.
   - Partout : un clic sur l'aperçu ouvre la visionneuse plein écran. */
(function () {
  'use strict';
  var INTERVAL = 1400; // ms entre deux photos pendant le survol
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* ---------- Visionneuse (créée une seule fois, à la demande) ---------- */
  var lb = null, lbImg, lbCap, items = [], idx = 0, lastFocus = null;

  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'prest-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visionneuse de photos');
    lb.innerHTML =
      '<button type="button" class="prest-lb-btn prest-lb-close" aria-label="Fermer">&times;</button>' +
      '<button type="button" class="prest-lb-btn prest-lb-prev" aria-label="Photo précédente">&#8249;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="prest-lb-btn prest-lb-next" aria-label="Photo suivante">&#8250;</button>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img');
    lbCap = lb.querySelector('figcaption');

    lb.querySelector('.prest-lb-close').addEventListener('click', closeLb);
    lb.querySelector('.prest-lb-prev').addEventListener('click', function () { go(-1); });
    lb.querySelector('.prest-lb-next').addEventListener('click', function () { go(1); });

    // clic hors de la photo et des boutons : fermer
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.tagName === 'FIGURE') closeLb();
    });

    // balayage du doigt dans la visionneuse
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    // clavier : ← → Échap, et Tab reste dans la visionneuse
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab') {
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function render() {
    var im = items[idx];
    lbImg.src = im.currentSrc || im.src;
    lbImg.alt = im.alt;
    lbCap.textContent = im.alt + (items.length > 1 ? '  (' + (idx + 1) + '/' + items.length + ')' : '');
  }

  function go(d) {
    if (items.length < 2) return;
    idx = (idx + d + items.length) % items.length;
    render();
  }

  function openLb(list, n) {
    if (!lb) buildLightbox();
    items = list;
    idx = n;
    lastFocus = document.activeElement;
    var multi = items.length > 1;
    lb.querySelector('.prest-lb-prev').style.display = multi ? '' : 'none';
    lb.querySelector('.prest-lb-next').style.display = multi ? '' : 'none';
    render();
    lb.classList.add('is-open');
    document.body.classList.add('prest-lb-lock');
    lb.querySelector('.prest-lb-close').focus();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    document.body.classList.remove('prest-lb-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Aperçus ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (box) {
    var imgs = Array.prototype.slice.call(box.querySelectorAll('img'));
    if (!imgs.length) return;

    var current = 0;
    var timer = null;

    // accessibilité : l'aperçu se comporte comme un bouton
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-label', 'Voir toutes les photos');
    box.addEventListener('click', function () { openLb(imgs, current); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(imgs, current); }
    });

    if (imgs.length < 2) return; // une seule photo : pas de défilé

    var dots = document.createElement('div');
    dots.className = 'prest-dots';
    dots.setAttribute('aria-hidden', 'true');
    imgs.forEach(function (_, k) {
      var d = document.createElement('span');
      if (k === 0) d.className = 'is-on';
      dots.appendChild(d);
    });
    box.appendChild(dots);

    function show(n) {
      imgs[current].classList.remove('is-on');
      dots.children[current].classList.remove('is-on');
      current = (n + imgs.length) % imgs.length;
      imgs[current].classList.add('is-on');
      dots.children[current].classList.add('is-on');
    }

    function start() {
      if (reduceMotion || timer) return;
      show(current + 1);
      timer = setInterval(function () { show(current + 1); }, INTERVAL);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      show(0);
    }

    // Ordinateur : survol de l'aperçu (pas de défilé automatique sur mobile)
    if (canHover) {
      box.addEventListener('mouseenter', start);
      box.addEventListener('mouseleave', stop);
    }
  });
})();
