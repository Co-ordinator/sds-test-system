import React, { useMemo, useCallback, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, CheckCircle, TrendingUp, MoreHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { GOV } from '../../theme/government';
import { REGION_COLORS, REGION_LABELS, RIASEC_COLORS } from './analyticsConstants';
import { ESWATINI_GEOJSON } from '../../data/regionsGeoJson';

const ESWATINI_CENTER = [-26.52, 31.47];
const ESWATINI_ZOOM = 9;

const MiniBar = ({ value, max, color = GOV.blue }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: `${color}12` }}>
    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
    <div className="min-w-0">
      <p className="text-xs truncate" style={{ color: GOV.textMuted }}>{label}</p>
      <p className="text-sm font-bold leading-tight" style={{ color: GOV.text }}>{value}</p>
    </div>
  </div>
);

const LeafletChoropleth = ({ regionData, selectedRegion, onRegionChange }) => {
  const maxUsers = useMemo(
    () => Math.max(...(regionData || []).map(r => Number(r.totalUsers) || 0), 1),
    [regionData]
  );

  const getRegionInfo = useCallback(
    (key) => (regionData || []).find(r => r.region === key) || {},
    [regionData]
  );

  const getRegionKey = useCallback((feature) => {
    const regionName = feature.properties?.REGIONNAME || feature.properties?.NAME || '';
    return regionName.toLowerCase();
  }, []);

  const regionStyle = useCallback((feature) => {
    const key = getRegionKey(feature);
    const info = getRegionInfo(key);
    const users = Number(info.totalUsers) || 0;
    const intensity = 0.20 + (users / maxUsers) * 0.68;
    const isSelected = selectedRegion === key;
    return {
      fillColor: REGION_COLORS[key] || '#F44336',
      fillOpacity: intensity,
      color: isSelected ? '#111827' : 'white',
      weight: isSelected ? 3 : 1.5,
      dashArray: isSelected ? '' : '',
    };
  }, [selectedRegion, maxUsers, getRegionInfo, getRegionKey]);

  const onEachFeature = useCallback((feature, layer) => {
    const key = getRegionKey(feature);
    const regionName = feature.properties?.REGIONNAME || feature.properties?.NAME || key;
    const info = getRegionInfo(key);
    const users = Number(info.totalUsers) || 0;
    const completed = Number(info.completedAssessments) || 0;
    const topCode = info.topCode || '–';
    const perTaker = users > 0 ? (completed / users).toFixed(1) : '–';

    layer.bindTooltip(
      `<div style="font-family:sans-serif;min-width:140px">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#111827">${regionName}</div>
        <div style="font-size:11px;color:#374151;line-height:1.7">
          👥 Registered: <strong>${users}</strong><br/>
          ✅ Completed assessments: <strong>${completed}</strong><br/>
          📊 Avg per taker: <strong>${perTaker}</strong><br/>
          🎯 Top code: <strong style="color:#F44336">${topCode}</strong>
        </div>
      </div>`,
      { permanent: false, direction: 'auto', className: 'leaflet-custom-tooltip' }
    );

    const currentIntensity = 0.20 + (users / maxUsers) * 0.68;
    layer.on({
      click: () => onRegionChange(prev => prev === key ? null : key),
      mouseover: (e) => e.target.setStyle({ weight: 2.5, fillOpacity: Math.min(currentIntensity + 0.12, 1) }),
      mouseout: (e) => e.target.setStyle(regionStyle(feature)),
    });
  }, [getRegionInfo, getRegionKey, maxUsers, onRegionChange, regionStyle]);

  const geoJsonKey = useMemo(
    () => `map-${selectedRegion || 'none'}-${(regionData || []).map(r => r.totalUsers).join('-')}`,
    [selectedRegion, regionData]
  );

  return (
    <MapContainer
      center={ESWATINI_CENTER}
      zoom={ESWATINI_ZOOM}
      style={{ height: '420px', width: '100%', borderRadius: '8px', zIndex: 0 }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />
      <GeoJSON
        key={geoJsonKey}
        data={ESWATINI_GEOJSON}
        style={regionStyle}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
};

function intensity(key, maxUsers, info) {
  const users = Number(info?.totalUsers) || 0;
  return 0.20 + (users / maxUsers) * 0.68;
}

const AnalyticsMapSection = ({ regionalData, regionChartData, selectedRegion, onRegionChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const selectedDetail = useMemo(
    () => selectedRegion && regionalData?.regions
      ? regionalData.regions.find(r => r.region === selectedRegion)
      : null,
    [selectedRegion, regionalData]
  );

  const radarData = useMemo(() => {
    if (!selectedDetail) return [];
    return ['R','I','A','S','E','C'].map(l => ({
      type: l,
      value: Number(selectedDetail[`avg${l}`] || 0)
    }));
  }, [selectedDetail]);

  const avgPerTaker = selectedDetail && selectedDetail.totalUsers > 0
    ? (Number(selectedDetail.completedAssessments) / Number(selectedDetail.totalUsers)).toFixed(1)
    : '–';

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridAutoRows: 'min-content' }}>
        {/* Map */}
        <div className={`${isFullscreen ? 'col-span-12' : 'col-span-12 lg:col-span-7'} bg-white rounded-lg border p-4`} style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Eswatini Regional Map</p>
              <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>Click a region to drill down. Colour intensity = user density.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedRegion && (
                <button type="button" onClick={() => onRegionChange(null)}
                  className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: GOV.border, color: GOV.blue }}>
                  Clear selection
                </button>
              )}
              <button 
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors" 
                style={{ color: GOV.blue }}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <LeafletChoropleth
            regionData={regionalData?.regions || []}
            selectedRegion={selectedRegion}
            onRegionChange={onRegionChange}
          />
          
          {/* Legend */}
          <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: GOV.borderLight, backgroundColor: '#fafafa' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: GOV.textMuted }}>Legend</p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to right, rgba(96,165,250,0.55), rgba(29,78,216,0.88))' }} />
                <span style={{ color: GOV.text }}>User Density</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 rounded" style={{ borderColor: '#111827' }} />
                <span style={{ color: GOV.text }}>Selected Region</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(REGION_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onRegionChange(prev => prev === key ? null : key)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={{
                  borderColor: selectedRegion === key ? REGION_COLORS[key] : GOV.border,
                  backgroundColor: selectedRegion === key ? `${REGION_COLORS[key]}15` : 'white',
                  color: selectedRegion === key ? REGION_COLORS[key] : GOV.textMuted
                }}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: REGION_COLORS[key] }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className={`${isFullscreen ? 'hidden' : 'col-span-12 lg:col-span-5'} flex flex-col gap-4`}>
          {selectedDetail ? (
            <div className="bg-white rounded-lg border p-4 flex-1" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REGION_COLORS[selectedRegion] }} />
                  <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>{REGION_LABELS[selectedRegion]} Region</p>
                </div>
                <button className="p-0.5 rounded hover:bg-gray-100" style={{ color: GOV.textHint }}><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatBadge icon={Users} label="Registered" value={selectedDetail.totalUsers} color="#2563eb" />
                <StatBadge icon={CheckCircle} label="Completed assessments" value={selectedDetail.completedAssessments} color="#059669" />
                <StatBadge icon={TrendingUp} label="Avg per taker" value={avgPerTaker} color="#d97706" />
                <StatBadge icon={MapPin} label="Top Code" value={selectedDetail.topCode || '–'} color="#7c3aed" />
              </div>
              <p className="text-xs font-semibold mb-2" style={{ color: GOV.textMuted }}>RIASEC Profile</p>
              {radarData.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke={GOV.borderLight} />
                    <PolarAngleAxis dataKey="type" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis tick={{ fontSize: 8 }} />
                    <Radar dataKey="value" stroke={REGION_COLORS[selectedRegion] || GOV.blue}
                      fill={REGION_COLORS[selectedRegion] || GOV.blue} fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip formatter={(v) => [Number(v).toFixed(1), 'Avg Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color: GOV.textHint }} />
              <p className="text-sm font-semibold" style={{ color: GOV.text }}>Click any region</p>
              <p className="text-xs mt-1" style={{ color: GOV.textHint }}>View detailed statistics and RIASEC profile for that region</p>
            </div>
          )}

          <div className="bg-white rounded-lg border p-4" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: GOV.textMuted }}>Regional Comparison</p>
            {regionChartData.length > 0 ? (
              <div className="space-y-3">
                {regionChartData.map(r => {
                  const max = Math.max(...regionChartData.map(d => d.users), 1);
                  const isActive = selectedRegion === r.key;
                  return (
                    <div
                      key={r.key}
                      className="cursor-pointer p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: isActive ? `${REGION_COLORS[r.key]}10` : 'transparent' }}
                      onClick={() => onRegionChange(prev => prev === r.key ? null : r.key)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[r.key] }} />
                          <span className="text-xs font-semibold" style={{ color: GOV.text }}>{r.name}</span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
                            {r.topCode}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: GOV.textMuted }}>{r.users} / {r.completed}</span>
                      </div>
                      <MiniBar value={r.users} max={max} color={REGION_COLORS[r.key]} />
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-xs text-center py-4" style={{ color: GOV.textHint }}>No data</p>}
          </div>
        </div>

      {/* Breakdown table */}
      {regionalData?.regions?.length > 0 && !isFullscreen && (
        <div className="col-span-12 bg-white rounded-lg border overflow-hidden" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="flex items-start justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Regional Intelligence Table</p>
              <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>Click a row to highlight region on map</p>
            </div>
            <button className="p-0.5 rounded hover:bg-gray-100" style={{ color: GOV.textHint }}><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ backgroundColor: GOV.blueLightAlt }}>
                <tr>
                  {['Region','Users','Completed','Avg / taker','Top code','R','I','A','S','E','C'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs uppercase font-semibold tracking-wide" style={{ color: GOV.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regionalData.regions.map(r => {
                  const perTaker = r.totalUsers > 0
                    ? (Number(r.completedAssessments) / Number(r.totalUsers)).toFixed(1)
                    : '–';
                  const isActive = selectedRegion === r.region;
                  return (
                    <tr
                      key={r.region}
                      className="border-b cursor-pointer transition-colors"
                      style={{
                        borderColor: GOV.borderLight,
                        backgroundColor: isActive ? `${REGION_COLORS[r.region]}08` : undefined
                      }}
                      onClick={() => onRegionChange(prev => prev === r.region ? null : r.region)}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: GOV.text }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[r.region] }} />
                          {REGION_LABELS[r.region]}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{r.totalUsers}</td>
                      <td className="px-4 py-3">{r.completedAssessments}</td>
                      <td className="px-4 py-3 font-mono">{perTaker}</td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: GOV.blue }}>{r.topCode || '–'}</td>
                      {['avgR','avgI','avgA','avgS','avgE','avgC'].map((k, idx) => (
                        <td key={k} className="px-4 py-3 font-mono" style={{ color: RIASEC_COLORS[['R','I','A','S','E','C'][idx]] }}>
                          {Number(r[k] || 0).toFixed(1)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AnalyticsMapSection;
