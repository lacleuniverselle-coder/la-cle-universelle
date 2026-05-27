// =============================================
// NAVIGATION & PAGES
// =============================================

const allPages = ['site-main', 'page-mentions-legales', 'page-cgv', 'page-tarifs-serrurerie', 'page-tarifs-velo', 'page-tarifs-pack'];

function showPage(page, anchor) {
  allPages.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('active');
    }
  });

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

// Initialise la carte quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map-zones')) {
    initMap();
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
