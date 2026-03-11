import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ESWATINI_REGIONS_GEOJSON, ESWATINI_CENTER, ESWATINI_BOUNDS } from '../../data/eswatiniRegions';
import { REGION_COLORS } from '../../features/analytics/analyticsConstants';
import { GOV } from '../../theme/government';

const EswatiniLeafletMap = ({ regionRows, selectedRegion, onSelectRegion }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  const getRegionMetric = (regionKey, field) => {
    const row = regionRows.find(r => r.region === regionKey);
    return Number(row?.[field] || 0);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: ESWATINI_CENTER,
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    // Add a simple base layer (light gray)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Fit bounds to Eswatini
    map.fitBounds(ESWATINI_BOUNDS);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !regionRows.length) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    Object.values(layersRef.current).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    layersRef.current = {};

    // Calculate max users for opacity scaling
    const maxUsers = Math.max(
      ...ESWATINI_REGIONS_GEOJSON.features.map(f => getRegionMetric(f.properties.region, 'totalUsers')),
      1
    );

    // Add region polygons
    ESWATINI_REGIONS_GEOJSON.features.forEach(feature => {
      const regionKey = feature.properties.region;
      const users = getRegionMetric(regionKey, 'totalUsers');
      const completed = getRegionMetric(regionKey, 'completedAssessments');
      const topCode = regionRows.find(r => r.region === regionKey)?.topCode || '—';
      
      const opacity = 0.3 + (users / maxUsers) * 0.5;
      const isSelected = selectedRegion === regionKey;
      const baseColor = REGION_COLORS[regionKey] || GOV.blue;

      const layer = L.geoJSON(feature, {
        style: {
          fillColor: baseColor,
          fillOpacity: opacity,
          color: isSelected ? '#0f172a' : '#ffffff',
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
        },
        onEachFeature: (feat, lyr) => {
          // Tooltip
          lyr.bindTooltip(
            `<div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px;">
              <strong style="font-size: 13px; color: #111827;">${feature.properties.name}</strong><br/>
              <span style="color: #6b7280;">Users: <strong style="color: #111827;">${users}</strong></span><br/>
              <span style="color: #6b7280;">Completed: <strong style="color: #111827;">${completed}</strong></span><br/>
              <span style="color: #6b7280;">Top Code: <strong style="color: #2563eb;">${topCode}</strong></span>
            </div>`,
            {
              sticky: true,
              direction: 'top',
              className: 'leaflet-custom-tooltip',
            }
          );

          // Hover effects
          lyr.on('mouseover', function () {
            if (!isSelected) {
              this.setStyle({
                fillOpacity: Math.min(opacity + 0.15, 0.9),
                weight: 2,
              });
            }
          });

          lyr.on('mouseout', function () {
            if (!isSelected) {
              this.setStyle({
                fillOpacity: opacity,
                weight: 1.5,
              });
            }
          });

          // Click handler
          lyr.on('click', () => {
            onSelectRegion(regionKey);
          });
        },
      }).addTo(map);

      layersRef.current[regionKey] = layer;
    });
  }, [regionRows, selectedRegion, onSelectRegion]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full rounded-lg overflow-hidden border"
        style={{ height: '320px', borderColor: GOV.borderLight }}
      />
      <style>{`
        .leaflet-custom-tooltip {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .leaflet-custom-tooltip::before {
          border-top-color: white;
        }
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .leaflet-control-zoom {
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          color: #111827 !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
};

export default EswatiniLeafletMap;
