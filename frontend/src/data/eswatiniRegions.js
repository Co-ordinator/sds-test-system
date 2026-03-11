// GeoJSON data for Eswatini regions
// Coordinates are approximate based on actual Eswatini geography
// Format: [longitude, latitude]

export const ESWATINI_REGIONS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        region: 'hhohho',
        name: 'Hhohho',
        capital: 'Mbabane',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [31.0, -25.9],
          [31.5, -25.9],
          [31.6, -26.2],
          [31.5, -26.4],
          [31.2, -26.5],
          [30.9, -26.3],
          [30.8, -26.0],
          [31.0, -25.9],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        region: 'manzini',
        name: 'Manzini',
        capital: 'Manzini',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [30.8, -26.0],
          [30.9, -26.3],
          [31.2, -26.5],
          [31.5, -26.4],
          [31.6, -26.7],
          [31.4, -26.9],
          [31.0, -26.9],
          [30.7, -26.7],
          [30.6, -26.4],
          [30.8, -26.0],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        region: 'lubombo',
        name: 'Lubombo',
        capital: 'Siteki',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [31.5, -25.9],
          [32.1, -25.9],
          [32.1, -26.3],
          [32.0, -26.7],
          [31.8, -27.1],
          [31.4, -26.9],
          [31.6, -26.7],
          [31.5, -26.4],
          [31.6, -26.2],
          [31.5, -25.9],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        region: 'shiselweni',
        name: 'Shiselweni',
        capital: 'Nhlangano',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [30.6, -26.4],
          [30.7, -26.7],
          [31.0, -26.9],
          [31.4, -26.9],
          [31.8, -27.1],
          [31.6, -27.4],
          [31.2, -27.5],
          [30.8, -27.4],
          [30.5, -27.1],
          [30.4, -26.7],
          [30.6, -26.4],
        ]],
      },
    },
  ],
};

// Center coordinates for Eswatini
export const ESWATINI_CENTER = [-26.5, 31.5];
export const ESWATINI_BOUNDS = [
  [-27.6, 30.3],
  [-25.8, 32.2],
];
