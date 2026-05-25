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
// INITIALISATION LEAFLET (CARTE)
// =============================================

// À adapter avec tes coordonnées réelles
function initMap() {
  if (typeof L === 'undefined') {
    console.error('Leaflet non chargé. Vérifie que leaflet.js est bien chargé.');
    return;
  }

  // Coordonnées de Toulouse (à personnaliser)
  const toulouseCoords = [43.6047, 1.4442];

  // Initialise la carte
  const map = L.map('map').setView(toulouseCoords, 13);

  // Ajoute le fond de carte OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Ajoute un marqueur (à personnaliser)
  L.marker(toulouseCoords).addTo(map)
    .bindPopup('La clé universElle - Toulouse')
    .openPopup();
}

// Initialise la carte quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
  // Vérifie si l'élément #map existe
  if (document.getElementById('map')) {
    initMap();
  }
});

// =============================================
// SCROLL DOUX POUR LES LIENS INTERNES
// =============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    // Ferme le menu mobile si ouvert
    closeMenu();

    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      // Affiche le site principal si on vient d'une page cachée
      document.getElementById('site-main').style.display = 'block';
      const pages = ['page-mentions-legales', 'page-cgv', 'page-tarifs-serrurerie', 'page-tarifs-velo', 'page-tarifs-pack'];
      pages.forEach(id => {
        document.getElementById(id).classList.remove('active');
      });

      // Scroll doux
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
