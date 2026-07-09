// GasFast NYC - Main Application
// Handles homepage rendering with data from all boroughs

const BOROUGHS = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
const BOROUGH_NAMES = {
  'bronx': 'Bronx',
  'brooklyn': 'Brooklyn',
  'manhattan': 'Manhattan',
  'queens': 'Queens',
  'staten-island': 'Staten Island'
};

let allStations = [];

async function loadAllStations() {
  const container = document.getElementById('station-list');
  if (!container) return;

  container.innerHTML = '<div class="p-4 text-center text-outline">Loading stations...</div>';

  try {
    const promises = BOROUGHS.map(async (borough) => {
      const response = await fetch(`gas-prices/${borough}/gas-prices.json`);
      const stations = await response.json();
      return stations.map(s => ({ ...s, borough }));
    });
    const results = await Promise.all(promises);
    allStations = results.flat();
    renderStations(allStations);
  } catch (error) {
    console.error('Failed to load stations:', error);
    container.innerHTML = '<div class="p-4 text-center text-outline">Failed to load station data.</div>';
  }
}

function renderStations(stations) {
  const sorted = [...stations].sort((a, b) => {
    return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
  });

  const container = document.getElementById('station-list');
  container.innerHTML = '';

  sorted.forEach((station) => {
    const addressStr = `${station.address.street}, ${station.address.city}, ${station.address.state}`;
    const row = document.createElement('a');
    row.href = `station.html?id=${encodeURIComponent(station.url)}`;
    row.className = 'price-row grid grid-cols-[100px_1fr] items-center gap-4 px-4 py-3 transition-colors cursor-pointer block no-underline';
    row.innerHTML = `
      <div class="font-price-display-mobile text-primary">${station.price}</div>
      <div class="flex flex-col">
        <span class="font-station-name text-body-md font-bold text-primary">${station.name}</span>
        <span class="font-metadata-sm text-metadata-sm text-outline truncate">${addressStr}</span>
        <span class="font-metadata-sm text-metadata-sm text-outline/60 flex items-center gap-1 mt-0.5">
          <span class="material-symbols-outlined text-[10px]">schedule</span>
          ${station.reported_ago}
        </span>
      </div>
    `;
    container.appendChild(row);
  });
}

// Mobile menu functionality
function openMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const panel = document.getElementById('mobile-nav-panel');
  nav.classList.remove('hidden');
  setTimeout(() => panel.classList.remove('-translate-x-full'), 10);
}

function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const panel = document.getElementById('mobile-nav-panel');
  panel.classList.add('-translate-x-full');
  setTimeout(() => nav.classList.add('hidden'), 300);
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', openMobileNav);

  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) mobileNav.addEventListener('click', (e) => { if (e.target === mobileNav) closeMobileNav(); });

  loadAllStations();

  const searchInput = document.getElementById('homepage-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderStations(allStations);
        return;
      }
      const filtered = allStations.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.address.street.toLowerCase().includes(query) ||
        s.address.city.toLowerCase().includes(query) ||
        s.address.zip.includes(query)
      );
      renderStations(filtered);
    });
  }
});
