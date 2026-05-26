export const ESWATINI_REGIONS = ['Hhohho', 'Manzini', 'Lubombo', 'Shiselweni'];

export const REGION_TO_BACKEND = {
  Hhohho: 'hhohho',
  Manzini: 'manzini',
  Lubombo: 'lubombo',
  Shiselweni: 'shiselweni',
};

export const REGION_FROM_BACKEND = {
  hhohho: 'Hhohho',
  manzini: 'Manzini',
  lubombo: 'Lubombo',
  shiselweni: 'Shiselweni',
};

export const ESWATINI_TOWNS_BY_REGION = {
  hhohho: [
    'Mbabane',
    'Lobamba',
    'Ezulwini',
    'Piggs Peak',
    'Bulembu',
    'Ngwenya',
    'Mhlambanyatsi',
    'Motshane',
    'Buhleni',
    'Timphisini',
  ],
  manzini: [
    'Manzini',
    'Matsapha',
    'Kwaluseni',
    'Malkerns',
    'Bhunya',
    'Mankayane',
    'Sidvokodvo',
    'Kubuta',
    'Matsanjeni',
  ],
  lubombo: [
    'Siteki',
    'Big Bend',
    'Mhlume',
    'Mpaka',
    'Simunye',
    'Tshaneni',
    'Vuvulane',
    'Nsoko',
    'Dvokodvweni',
    'Siphofaneni',
    'Mpolonjeni',
    'Nhlambeni',
  ],
  shiselweni: [
    'Nhlangano',
    'Hlatikhulu',
    'Hluti',
    'Lavumisa',
    'Gege',
    'Matsamo',
    'Zombodze',
    'Emvembili',
    'Golgotha',
    'Mavuso',
  ],
};

export const normalizeRegionKey = (region) => {
  if (!region) return '';
  const value = String(region).trim();
  return REGION_TO_BACKEND[value] || value.toLowerCase();
};

export const getTownsForRegion = (region) => {
  const key = normalizeRegionKey(region);
  const towns = key && ESWATINI_TOWNS_BY_REGION[key]
    ? ESWATINI_TOWNS_BY_REGION[key]
    : Object.values(ESWATINI_TOWNS_BY_REGION).flat();

  return Array.from(new Set([...towns, 'Other']));
};

export const townBelongsToRegion = (town, region) => {
  const normalizedTown = String(town || '').trim().toLowerCase();
  if (!normalizedTown || normalizedTown === 'other') return true;
  return getTownsForRegion(region).some((item) => item.toLowerCase() === normalizedTown);
};
