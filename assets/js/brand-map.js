// NYC Gas - Brand Logo Mapping
// Centralized brand logo configuration

window.getBrandLogoUrl = function(stationName, basePath) {
  if (!stationName) return null;
  const name = stationName.trim().toLowerCase();
  const brandMap = {
    '7-eleven': '7eleven.png',
    '76': '76.png',
    'amoco': 'amoco.png',
    'atlantis': 'atlantis.png',
    'bp': 'bp.png',
    'citgo': 'citgo.png',
    'conoco': 'conoco.png',
    'costco': 'costco.png',
    'global': 'global.png',
    'gulf': 'gulf.png',
    'lukoil': 'lukoil.png',
    'mobil': 'mobil.png',
    'shell': 'shell.png',
    'speedway': 'speedway.png',
    'sunoco': 'sunoco.png'
  };
  if (brandMap[name]) {
    return `${basePath}${brandMap[name]}`;
  }
  return null;
};
