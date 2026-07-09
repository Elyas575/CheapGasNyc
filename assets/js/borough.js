// GasFast NYC - Borough Page
// Shared script for all borough pages

async function loadBoroughStations() {
  const container = document.getElementById('station-list');
  if (!container) return;

  container.innerHTML = '<div class="p-4 text-center text-outline">Loading stations...</div>';

  try {
    const response = await fetch('gas-prices.json');
    const stations = await response.json();
    renderStations(stations);
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

document.addEventListener('DOMContentLoaded', loadBoroughStations);