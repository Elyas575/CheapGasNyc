// GasFast NYC - Map Page
// Interactive map placeholder

document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  mapContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center p-8">
      <span class="material-symbols-outlined text-6xl text-outline mb-4">map</span>
      <h2 class="font-station-name text-body-md font-bold text-primary mb-2">Interactive Map</h2>
      <p class="font-metadata-sm text-metadata-sm text-outline max-w-md">
        An interactive map of all gas stations across NYC boroughs will be displayed here. 
        You'll be able to see prices, locations, and filter by fuel type.
      </p>
      <p class="font-metadata-sm text-metadata-sm text-outline/60 mt-4">Coming soon.</p>
    </div>
  `;
});