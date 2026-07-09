// GasFast NYC - Search Page
// Handles station search functionality

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');

  if (!searchInput || !resultsContainer) return;

  let allStations = [];

  async function loadAllStations() {
    const boroughs = ['bronx', 'brooklyn', 'manhattan', 'queens', 'staten-island'];
    try {
      const promises = boroughs.map(async (b) => {
        const res = await fetch(`../${b}/gas-prices.json`);
        const data = await res.json();
        return data.map(s => ({ ...s, borough: b }));
      });
      const results = await Promise.all(promises);
      allStations = results.flat();
    } catch (e) {
      console.error('Failed to load stations for search:', e);
    }
  }

  function renderResults(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.innerHTML = '<div class="p-4 text-center text-outline">Start typing to search stations...</div>';
      return;
    }

    const filtered = allStations.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.address.street.toLowerCase().includes(q) ||
      s.address.city.toLowerCase().includes(q) ||
      s.address.zip.includes(q)
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML = '<div class="p-4 text-center text-outline">No stations found.</div>';
      return;
    }

    const sorted = [...filtered].sort((a, b) =>
      parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''))
    );

    resultsContainer.innerHTML = '';
    sorted.forEach(station => {
      const addressStr = `${station.address.street}, ${station.address.city}, ${station.address.state}`;
      const div = document.createElement('div');
      div.className = 'price-row grid grid-cols-[100px_1fr_100px] items-center gap-4 px-4 py-3 transition-colors';
      div.innerHTML = `
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
      resultsContainer.appendChild(div);
    });
  }

  loadAllStations();

  searchInput.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });
});