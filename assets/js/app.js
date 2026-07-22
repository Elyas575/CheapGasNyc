// NYC Gas - Main Application
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
let currentFuelType = 'Regular Fuel Prices';
let visibleCount = 10;

function getBrandLogoUrl(stationName) {
  if (!stationName) return null;
    const name = stationName.trim().toLowerCase();
    const brandMap = {
      '7-eleven': '7eleven.png',
      '76': '76.png',
      'amoco': 'amoco.png',
      'atlantis': 'atlantis.png',
      'bp': 'bp.png',
      'conoco': 'conoco.png',
      'costco': 'costco.png',
      'global': 'global.png',
      'gulf': 'gulf.png',
      'mobil': 'mobil.png',
      'shell': 'shell.png',
      'speedway': 'speedway.png',
      'sunoco': 'sunoco.png'
    };
  if (brandMap[name]) {
    return `images/${brandMap[name]}`;
  }
  return null;
}

function parseReportedAgoToMs(reportedAgo) {
  if (!reportedAgo || reportedAgo.trim() === '- - -') return null;
  const match = reportedAgo.trim().match(/(\d+)\s+(Hour|Hours|Day|Days|Minute|Minutes)\s+Ago/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit.includes('day')) return value * 24 * 60 * 60 * 1000;
  if (unit.includes('minute')) return value * 60 * 1000;
  return value * 60 * 60 * 1000; // hours
}

function getTrueReportTime(station) {
  if (!station.scraped_at || !station.reported_ago) return null;
  
  const reportedOffset = parseReportedAgoToMs(station.reported_ago);
  if (reportedOffset === null) return null;
  
  const scrapedDate = new Date(station.scraped_at + 'Z');
  return new Date(scrapedDate.getTime() - reportedOffset);
}

function timeAgo(trueReportTime) {
  if (!trueReportTime) return 'Unknown';
  const now = new Date();
  const diffMs = now - trueReportTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays >= 1 && diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return trueReportTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function extractStationsFromBorough(data, borough, fuelType) {
  if (Array.isArray(data)) {
    return data.map(s => ({ 
      ...s, 
      borough,
      fuel_type: fuelType 
    }));
  }
  
  if (data.fuel_types && typeof data.fuel_types === 'object') {
    const fuelData = data.fuel_types[fuelType];
    if (fuelData && fuelData.stations) {
      return fuelData.stations.map(s => ({ 
        ...s, 
        borough,
        fuel_type: fuelType 
      }));
    }
  }
  
  return [];
}

async function loadAllStations() {
  const container = document.getElementById('station-list');
  if (!container) return;

  container.innerHTML = '<div class="p-4 text-center text-outline">Loading stations...</div>';

  try {
    const promises = BOROUGHS.map(async (borough) => {
      try {
        const response = await fetch(`gas-prices/${borough}/gas-prices.json`);
        if (!response.ok) {
          console.error(`Failed to load ${borough}: HTTP ${response.status}`);
          return [];
        }
        const data = await response.json();
        return extractStationsFromBorough(data, borough, currentFuelType);
      } catch (err) {
        console.error(`Error loading ${borough}:`, err);
        return [];
      }
    });
    const results = await Promise.all(promises);
    allStations = results.flat();
    
    if (allStations.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-outline">No stations found for the selected fuel type.</div>';
    } else {
      visibleCount = 10;
      renderStations(allStations);
    }
  } catch (error) {
    console.error('Failed to load stations:', error);
    container.innerHTML = `<div class="p-4 text-center text-outline">Failed to load station data. Please check browser console for details.</div>`;
  }
}

function updateHeading(stations) {
  const heading = document.getElementById('section-heading');
  if (!heading) return;
  
  const withPrice = stations.filter(s => s.price && s.price !== '- - -' && s.price !== '$0.00');
  if (withPrice.length === 0) {
    heading.textContent = `Cheapest Stations Across NYC`;
    return;
  }
  
  const sorted = [...withPrice].sort((a, b) => {
    const priceA = parseFloat(a.price.replace('$', ''));
    const priceB = parseFloat(b.price.replace('$', ''));
    return priceA - priceB;
  });
  const cheapestBorough = BOROUGH_NAMES[sorted[0].borough] || sorted[0].borough;
  const cheapestPrice = sorted[0].price;
  heading.textContent = `Cheapest in ${cheapestBorough} - from ${cheapestPrice}`;
}

function renderStations(stations) {
  const sorted = [...stations].sort((a, b) => {
    const priceA = a.price ? parseFloat(a.price.replace('$', '')) : Infinity;
    const priceB = b.price ? parseFloat(b.price.replace('$', '')) : Infinity;
    return priceA - priceB;
  });

  const container = document.getElementById('station-list');
  container.innerHTML = '';

  updateHeading(stations);

  const shown = sorted.slice(0, visibleCount);
  shown.forEach((station) => {
    const row = document.createElement('a');
    const numericId = station.url ? station.url.match(/\/?station\/(\d+)/)?.[1] || station.url : '';
    row.href = `station.html?id=${encodeURIComponent(numericId)}`;
    row.className = 'price-row block bg-white border border-outline-variant rounded-lg p-4 mb-3 hover:border-secondary transition-all no-underline';
    row._stationData = station;
    
    const street = station.address.street || '';
    const cityState = [station.address.city || BOROUGH_NAMES[station.borough], station.address.state].filter(Boolean).join(', ') || BOROUGH_NAMES[station.borough] || '';
    
    const displayPrice = station.price && station.price !== '- - -' ? station.price : '--';
    
    const trueReportTime = getTrueReportTime(station);
    const reportedTime = timeAgo(trueReportTime);
    const priceType = station.price_type || 'Credit';
    const showCashBadge = priceType === 'Cash';
    
    const brandLogo = getBrandLogoUrl(station.name);
    const logoHtml = brandLogo
      ? `<img src="${brandLogo}" alt="${station.name}" class="w-10 h-10 object-contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="material-symbols-outlined text-4xl text-outline" style="display:none">local_gas_station</span>`
      : `<span class="material-symbols-outlined text-4xl text-outline">local_gas_station</span>`;

    row.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-white border border-outline-variant rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          ${logoHtml}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-station-name text-station-name font-bold text-primary mb-1">${station.name}</h3>
          ${street ? `<p class="font-metadata-sm text-metadata-sm text-outline">${street}</p>` : ''}
          ${cityState ? `<p class="font-metadata-sm text-metadata-sm text-outline">${cityState}</p>` : ''}
        </div>
       <div class="text-right flex-shrink-0">
           <div class="font-price-display text-price-display text-primary mb-1">${displayPrice}</div>
           <div class="flex items-center gap-1 text-xs text-outline">
             <span class="material-symbols-outlined text-[10px]">schedule</span>
             <span class="time-display">${reportedTime}</span>
           </div>
           ${showCashBadge ? '<span class="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">CASH</span>' : ''}
           ${station.borough ? `<span class="inline-block mt-1 px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded-full font-medium">${BOROUGH_NAMES[station.borough] || station.borough}</span>` : ''}
         </div>
      </div>
    `;
    container.appendChild(row);
  });

  const viewAllBtn = document.getElementById('view-all-btn');
  if (viewAllBtn) {
    if (visibleCount >= sorted.length) {
      viewAllBtn.style.display = 'none';
    } else {
      viewAllBtn.style.display = 'block';
    }
  }
}

function showMoreStations() {
  visibleCount += 10;
  renderStations(allStations);
}

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

  const viewAllBtn = document.getElementById('view-all-btn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', showMoreStations);
  }

  const searchInput = document.getElementById('homepage-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        visibleCount = 10;
        renderStations(allStations);
        return;
      }
      const filtered = allStations.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.address.street && s.address.street.toLowerCase().includes(query)) ||
        (s.address.city && s.address.city.toLowerCase().includes(query)) ||
        (s.address.zip && s.address.zip.includes(query))
      );
      visibleCount = 10;
      renderStations(filtered);
    });
  }

  const fuelTypeSelect = document.getElementById('fuel-type-select');
  if (fuelTypeSelect) {
    fuelTypeSelect.addEventListener('change', (e) => {
      currentFuelType = e.target.value;
      loadAllStations();
    });
  }

  const boroughBtn = document.getElementById('borough-selector-btn');
  const boroughDropdown = document.getElementById('borough-dropdown');
  
  if (boroughBtn && boroughDropdown) {
    boroughBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      boroughDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!boroughBtn.contains(e.target) && !boroughDropdown.contains(e.target)) {
        boroughDropdown.classList.add('hidden');
      }
    });

    const boroughLinks = boroughDropdown.querySelectorAll('a');
    boroughLinks.forEach(link => {
      link.addEventListener('click', () => {
        boroughDropdown.classList.add('hidden');
      });
    });
  }
});