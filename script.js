// =============================================
// NAVIGATION & PAGES
// =============================================

const allPages = ['site-main', 'page-mentions-legales', 'page-cgv', 'page-tarifs-pack', 'page-faq'];

function showPage(page, anchor) {
  allPages.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('active');
    }
  });

  // Footer principal : visible uniquement sur la page principale
  const footerMain = document.getElementById('footer-main');
  if (footerMain) footerMain.style.display = page === 'main' ? '' : 'none';

  if (page === 'main') {
    const main = document.getElementById('site-main');
    if (main) main.style.display = 'block';
    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.scrollTo(0, 0);
    }
  } else {
    const target = document.getElementById('page-' + page);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }
    window.scrollTo(0, 0);
  }
}

// Ouverture directe d'une sous-page via l'URL (ex: index.html#mentions-legales
// utilisé depuis serrurerie.html / mecanique-velo.html). Ignoré si l'ancre ne
// correspond à aucune sous-page (ex: #services), showPage() gère déjà ce cas.
document.addEventListener('DOMContentLoaded', function () {
  var hash = window.location.hash.replace('#', '');
  var sousPages = ['mentions-legales', 'cgv', 'tarifs-pack', 'faq'];
  if (sousPages.indexOf(hash) !== -1) {
    showPage(hash);
  }
});

// =============================================
// MENU MOBILE
// =============================================

function toggleMenu() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  btn.classList.toggle('open');
  menu.classList.toggle('open');
}

function closeMenu() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  btn.classList.remove('open');
  menu.classList.remove('open');

  // Referme aussi l'accordéon Services quand on ferme le menu mobile
  document.querySelectorAll('.mobile-accordion-toggle.open').forEach(t => t.classList.remove('open'));
  document.querySelectorAll('.mobile-accordion-panel.open').forEach(p => p.classList.remove('open'));
}

// =============================================
// ACCORDÉON "SERVICES" DANS LE MENU MOBILE
// =============================================

function toggleMobileAccordion(btn) {
  const panel = btn.closest('.mobile-accordion').querySelector('.mobile-accordion-panel');
  const estOuvert = btn.classList.contains('open');
  btn.classList.toggle('open', !estOuvert);
  panel.classList.toggle('open', !estOuvert);
}

// =============================================
// POLITIQUE DE CONFIDENTIALITÉ (MODALE)
// =============================================

function openPolitiqueConfidentialite() {
  const overlay = document.getElementById('politique-overlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closePolitiqueConfidentialite(e) {
  const overlay = document.getElementById('politique-overlay');
  if (!e || e.target === overlay || (e.currentTarget && e.currentTarget.classList.contains('politique-close'))) {
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}

// =============================================
// LOGO STORY (OVERLAY)
// =============================================

function openLogoStory() {
  const overlay = document.getElementById('logo-overlay');
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeLogoStory(e) {
  const overlay = document.getElementById('logo-overlay');
  if (!e || e.target === overlay || (e.currentTarget && e.currentTarget.classList.contains('logo-overlay-close'))) {
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}

// Ferme l'overlay avec Échap
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLogoStory();
});

// =============================================
// INITIALISATION LEAFLET (CARTE ZONES)
// =============================================

function initMap() {
  if (typeof L === 'undefined') {
    console.error('Leaflet non chargé. Vérifie que leaflet.js est bien chargé.');
    return;
  }

  const geojsonData = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"stroke":"rgba(130, 47, 129, 1)","stroke-width":3,"":0},"geometry":{"type":"LineString","coordinates":[[1.500652,43.659929],[1.41847,43.673222],[1.404178,43.642201],[1.401626,43.618186],[1.409793,43.605251],[1.412856,43.593053],[1.423064,43.576784],[1.441951,43.576045],[1.467983,43.577894],[1.48789,43.593792],[1.514944,43.607839],[1.506266,43.629641],[1.497589,43.64294],[1.501162,43.657714],[1.500141,43.660299],[1.498099,43.661037],[1.496058,43.661037],[1.458795,43.667315]]}}]};

  const coords = geojsonData.features[0].geometry.coordinates;
  const lats = coords.map(c => c[1]);
  const lngs = coords.map(c => c[0]);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  const map = L.map('map-zones', {
    center: [centerLat, centerLng],
    zoom: 12,
    zoomControl: true,
    scrollWheelZoom: false,
    dragging: true,
    doubleClickZoom: true,
    touchZoom: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Polygone de zone (fond violet translucide)
  const polyCoords = coords.map(c => [c[1], c[0]]);
  if (polyCoords[0][0] !== polyCoords[polyCoords.length - 1][0] ||
      polyCoords[0][1] !== polyCoords[polyCoords.length - 1][1]) {
    polyCoords.push(polyCoords[0]);
  }
  L.polygon(polyCoords, {
    color: 'transparent',
    weight: 0,
    fillColor: '#8d68b1',
    fillOpacity: 0.30
  }).addTo(map);

  // Contour blanc (halo)
  L.geoJSON(geojsonData, {
    style: () => ({
      color: 'rgba(255, 255, 255, 0.65)',
      weight: 9,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round'
    })
  }).addTo(map);

  // Contour violet
  const layer = L.geoJSON(geojsonData, {
    style: () => ({
      color: 'rgba(130, 31, 160, 1)',
      weight: 5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round'
    })
  }).addTo(map);

  map.fitBounds(layer.getBounds(), { padding: [24, 24] });

  // Marqueur centre
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:10px;height:10px;background:rgba(130,31,160,1);border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(130,47,129,0.5);"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });
  L.marker([centerLat, centerLng], { icon }).addTo(map);
}

// Initialise la carte seulement quand elle entre dans le viewport
// (évite le reflow forcé de Leaflet -fitBounds/getBounds- pendant le chargement initial)
document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('map-zones');
  if (!mapEl) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initMap();
          obs.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(mapEl);
  } else {
    initMap(); // fallback navigateurs anciens
  }
});

// =============================================
// SCROLL DOUX POUR LES LIENS INTERNES
// =============================================

function setupInternalLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();

      // Ferme le menu mobile si ouvert
      closeMenu();

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Affiche le site principal si on vient d'une page cachée
        const mainSite = document.getElementById('site-main');
        if (mainSite) {
          mainSite.style.display = 'block';
        }
        const pages = ['page-mentions-legales', 'page-cgv', 'page-tarifs-serrurerie', 'page-tarifs-velo', 'page-tarifs-pack'];
        pages.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove('active');
        });

        // Scroll doux
        setTimeout(() => {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 50);
      }
    });
  });
}

// Initialise les liens quand le DOM est prêt
document.addEventListener('DOMContentLoaded', setupInternalLinks);

// =============================================
// ACCORDÉON TARIFS
// =============================================

function toggleAccordeon(btn) {
  var panel = btn.nextElementSibling;
  var ouvert = btn.classList.contains('ouvert');
  btn.classList.toggle('ouvert', !ouvert);
  panel.classList.toggle('ouvert', !ouvert);
}

// =============================================
// TOGGLE PRIX (📅 semaine / ⭐ férié)
// =============================================

function setPrixMode(mode, page) {
  var conteneur = document.getElementById('page-tarifs-' + (page === 'serr' ? 'serrurerie' : 'velo'));
  if (!conteneur) return;
  var semCells  = conteneur.querySelectorAll('.prix-semaine');
  var nuitCells = conteneur.querySelectorAll('.prix-nuit');
  var ferCells  = conteneur.querySelectorAll('.prix-ferie');
  var btnSem  = conteneur.querySelector('#toggle-sem-'  + page);
  var btnNuit = conteneur.querySelector('#toggle-nuit-' + page);
  var btnFer  = conteneur.querySelector('#toggle-fer-'  + page);

  // Cacher tout
  semCells.forEach(function(c)  { c.style.display = 'none'; });
  nuitCells.forEach(function(c) { c.style.display = 'none'; });
  ferCells.forEach(function(c)  { c.style.display = 'none'; });
  [btnSem, btnNuit, btnFer].forEach(function(b) { if (b) b.classList.remove('actif'); });

  if (mode === 'semaine') {
    semCells.forEach(function(c) { c.style.display = ''; });
    if (btnSem) btnSem.classList.add('actif');
  } else if (mode === 'nuit') {
    nuitCells.forEach(function(c) { c.style.display = ''; });
    if (btnNuit) btnNuit.classList.add('actif');
  } else {
    ferCells.forEach(function(c) { c.style.display = ''; });
    if (btnFer) btnFer.classList.add('actif');
  }
}

// =============================================
// EVENT LISTENERS (remplacent les onclick="")
// =============================================

document.addEventListener('DOMContentLoaded', function () {

  // Boutons "Voir les tarifs →" (data-page)
  document.querySelectorAll('.btn-tarifs[data-page]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showPage(btn.dataset.page);
    });
  });

  // Accordéon tarifs
  document.querySelectorAll('.tarif-accordeon').forEach(function (btn) {
    btn.addEventListener('click', function () {
      toggleAccordeon(btn);
    });
  });

  // Toggle prix — serrurerie
  var toggleSemSerr  = document.getElementById('toggle-sem-serr');
  var toggleNuitSerr = document.getElementById('toggle-nuit-serr');
  var toggleFerSerr  = document.getElementById('toggle-fer-serr');
  if (toggleSemSerr)  toggleSemSerr.addEventListener('click',  function () { setPrixMode('semaine', 'serr'); });
  if (toggleNuitSerr) toggleNuitSerr.addEventListener('click', function () { setPrixMode('nuit',    'serr'); });
  if (toggleFerSerr)  toggleFerSerr.addEventListener('click',  function () { setPrixMode('ferie',   'serr'); });

  // Toggle prix — vélo
  var toggleSemVelo  = document.getElementById('toggle-sem-velo');
  var toggleNuitVelo = document.getElementById('toggle-nuit-velo');
  var toggleFerVelo  = document.getElementById('toggle-fer-velo');
  if (toggleSemVelo)  toggleSemVelo.addEventListener('click',  function () { setPrixMode('semaine', 'velo'); });
  if (toggleNuitVelo) toggleNuitVelo.addEventListener('click', function () { setPrixMode('nuit',    'velo'); });
  if (toggleFerVelo)  toggleFerVelo.addEventListener('click',  function () { setPrixMode('ferie',   'velo'); });

});

// =============================================
// VALIDATION + ENVOI + FILTRAGE FORMULAIRE
// =============================================

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const champs = {
    nom: { el: document.getElementById('cf-nom'), err: document.getElementById('err-nom') },
    prenom: { el: document.getElementById('cf-prenom'), err: document.getElementById('err-prenom') },
    telephone: { el: document.getElementById('cf-tel'), err: document.getElementById('err-tel') },
    email: { el: document.getElementById('cf-email'), err: document.getElementById('err-email') },
    description: { el: document.getElementById('cf-description'), err: document.getElementById('err-description') },
    rgpd: { el: document.getElementById('cf-rgpd'), err: document.getElementById('err-rgpd') }
  };

const description = document.getElementById('cf-description');
const compteur = document.getElementById('count-description');
if (description && compteur) {
  description.addEventListener('input', () => {
    compteur.textContent = description.value.length + ' / 180';
  });
}

  const feedback = document.getElementById('form-feedback');

  // Empêche la saisie de chiffres dans nom/prénom
  [champs.nom.el, champs.prenom.el].forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[0-9]/g, '');
    });
  });

  // Empêche la saisie de lettres dans téléphone
  champs.telephone.el.addEventListener('input', () => {
    champs.telephone.el.value = champs.telephone.el.value.replace(/[^0-9]/g, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valide = true;
    let toutVide = true;

    Object.values(champs).forEach(c => { if (c.err) c.err.textContent = ''; });
    feedback.textContent = '';
    feedback.className = 'form-feedback';

    Object.entries(champs).forEach(([key, c]) => {
      if (key === 'rgpd') { if (c.el.checked) toutVide = false; return; }
      if (c.el.value.trim() !== '') toutVide = false;
    });

    if (toutVide) {
      feedback.textContent = 'Merci de remplir le formulaire avant d\'envoyer.';
      feedback.className = 'form-feedback erreur';
      return;
    }

    [['nom', 'Le nom'], ['prenom', 'Le prénom']].forEach(([key, label]) => {
      const val = champs[key].el.value.trim();
      if (val === '') { champs[key].err.textContent = label + ' est obligatoire.'; valide = false; }
      else if (/[0-9]/.test(val)) { champs[key].err.textContent = 'Pas de chiffres autorisés.'; valide = false; }
    });

    const tel = champs.telephone.el.value.trim();
    if (tel !== '' && !/^[0-9]{10}$/.test(tel)) {
      champs.telephone.err.textContent = '10 chiffres, sans point ni espace.';
      valide = false;
    }

    if (champs.email.el.value.trim() === '') {
      champs.email.err.textContent = 'Email obligatoire.'; valide = false;
    }

    if (champs.description.el.value.trim() === '') {
      champs.description.err.textContent = 'Description obligatoire (200 caractères max).'; valide = false;
    }

    if (!champs.rgpd.el.checked) {
      champs.rgpd.err.textContent = 'Vous devez accepter la politique de confidentialité.'; valide = false;
    }

    if (!valide) {
      feedback.textContent = 'Merci de corriger les champs en rouge.';
      feedback.className = 'form-feedback erreur';
      return;
    }

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        feedback.textContent = 'Votre demande a bien été envoyée.';
        feedback.className = 'form-feedback succes';
        form.reset();
      } else {
        feedback.textContent = 'Erreur lors de l\'envoi, réessayez.';
        feedback.className = 'form-feedback erreur';
      }
    })
    .catch(() => {
      feedback.textContent = 'Erreur lors de l\'envoi, réessayez.';
      feedback.className = 'form-feedback erreur';
    });
  });
});

// =============================================
// HORAIRES — surbrillance du jour en cours
// =============================================

document.addEventListener('DOMContentLoaded', function () {
  var rows = document.querySelectorAll('#hours-list .hours-row');
  if (!rows.length) return;

  // getDay() : 0 = dimanche ... 6 = samedi -> on le convertit en 1 = lundi ... 7 = dimanche
  var jsDay = new Date().getDay();
  var todayIndex = jsDay === 0 ? 7 : jsDay;

  rows.forEach(function (row) {
    if (parseInt(row.dataset.day, 10) === todayIndex) {
      row.classList.add('is-today');
    }
  });
});

// =============================================
// ANIMATION ROUE DU LOGO — au chargement + retour en haut
// =============================================
// En plus du hover (géré en CSS), on relance l'animation de la roue à
// l'ouverture de la page et à chaque retour en haut (scroll) : utile sur
// mobile où le hover n'existe pas et où le déclenchement CSS automatique
// est parfois capricieux selon le navigateur.

document.addEventListener('DOMContentLoaded', function () {
  var logoWrap = document.querySelector('.hero-logo-wrap');
  var roue = document.getElementById('roue');
  if (!logoWrap || !roue) return;

  // Certains navigateurs mobiles gèrent mal "transform-box: fill-box" sur
  // les <g> SVG (la roue ne tourne pas visuellement). On calcule donc le
  // centre réel de la roue en JS et on l'utilise comme point de pivot,
  // en unités locales du SVG — beaucoup plus fiable.
  try {
    var bbox = roue.getBBox();
    var cx = bbox.x + bbox.width / 2;
    var cy = bbox.y + bbox.height / 2;
    roue.style.transformOrigin = cx + 'px ' + cy + 'px';
  } catch (e) {
    // getBBox peut échouer si l'élément n'est pas encore rendu : on garde
    // alors le transform-origin: 50% 50% défini en CSS
  }

  function playRoue() {
    roue.classList.remove('roue-replay');
    void roue.offsetWidth; // force le navigateur à relire le style (redémarre l'animation)
    roue.classList.add('roue-replay');
  }

  // Déclenchement au chargement de la page
  playRoue();

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) playRoue();
    });
  }, { threshold: 0.5 });

  observer.observe(logoWrap);
});