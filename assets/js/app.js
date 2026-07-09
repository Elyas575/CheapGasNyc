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
      const response = await fetch(`${borough}/gas-prices.json`);
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
    const row = document.createElement('div');
    row.className = 'price-row grid grid-cols-[100px_1fr_100px] items-center gap-4 px-4 py-3 transition-colors';
    row.innerHTML = `
      <div class="font-price-display-mobile text-primary">${station.price}</div>
      <div class="flex flex-col">
        <span class="font-station-name text-body-md font-bold">${station.name}</span>
        <span class="font-metadata-sm text-metadata-sm text-outline truncate">${addressStr}</span>
        <span class="font-metadata-sm text-metadata-sm text-outline/60 flex items-center gap-1 mt-0.5">
          <span class="material-symbols-outlined text-[10px]">schedule</span>
          ${station.reported_ago}
        </span>
      </div>
      <div class="flex justify-end">
        <a href="${station.url}" target="_blank" class="bg-secondary px-3 py-1 rounded text-white font-label-caps text-[10px] hover:bg-on-secondary-container transition-all inline-block">REPORT</a>
      </div>
    `;
    container.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', loadAllStations);