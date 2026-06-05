import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  useGetAllStopsQuery,
  useGetAllRoutesQuery,
  useGetAllBusesQuery,
  useCalculateRouteMutation,
} from '../../Redux/Slices/Bus.ts';
import "./Test.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 64 }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#d4af37' : score >= 50 ? '#c0a040' : '#8a7a30';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-svg">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="'Playfair Display', serif">
        {Math.round(score)}
      </text>
    </svg>
  );
}

function ScoreBar({ label, value, icon }) {
  const pct = Math.round(value * 100);
  return (
    <div className="score-bar-row">
      <i className={`fa ${icon} score-bar-icon`}/>
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${pct}%` }}/></div>
      <span className="score-bar-pct">{pct}%</span>
    </div>
  );
}

function EtaDisplay({ bus, className = '' }) {
  if (bus.isAlreadyHere || bus.etaMinutes === 0)
    return <span className={`eta-here ${className}`}><i className="fa fa-check-circle"/> Already here</span>;
  return <span className={className}><i className="fa fa-clock"/> {Number(bus.etaMinutes).toFixed(1)} min</span>;
}

function DirectionBadge({ isReturning }) {
  return isReturning
    ? <span className="dir-badge dir-badge--returning"><span className="dir-badge__track"><span className="dir-badge__dot"/></span><span className="dir-badge__label">Returning</span></span>
    : <span className="dir-badge dir-badge--outbound"><span className="dir-badge__track"><span className="dir-badge__dot"/></span><span className="dir-badge__label">Outbound</span></span>;
}

// ── Bus Card ──────────────────────────────────────────────────────────────────
function BusCard({ bus, isSelected, isExpanded, onClick, accentColor }) {
  const isRec = bus.isRecommended;
  const borderColor = isSelected ? (accentColor ?? '#d4af37') : isRec ? '#d4af37' : 'rgba(255,255,255,0.08)';
  return (
    <div
      className={`bus-card${isSelected ? ' bus-card-active' : ''}${isRec ? ' bus-card-recommended' : ''}`}
      style={{ borderColor, boxShadow: isSelected ? `0 0 0 2px ${accentColor ?? '#d4af37'}44` : undefined }}
      onClick={() => onClick(bus.busId)}
    >
      <div className={`bus-card-accent${isRec ? ' bus-card-accent-recommended' : isSelected ? ' bus-card-accent-active' : ''}`}
           style={isSelected && accentColor ? { background: accentColor } : {}}/>
      <div className="bus-card-inner">
        <div className="bus-card-header">
          <div className="bus-number-wrap">
            <span className="bus-number">
              <i className="fa fa-bus"/> {bus.busNumber}
              {isRec && <span className="bus-recommended-badge"><i className="fa fa-crown"/> Best</span>}
            </span>
            <span className="bus-company">{bus.companyName} <DirectionBadge isReturning={bus.isReturning}/></span>
          </div>
          <div className="bus-right">
            <ScoreRing score={bus.totalScore} size={48}/>
            <span className={`bus-eta${isRec ? ' bus-eta-recommended' : ''}`}><EtaDisplay bus={bus}/></span>
          </div>
        </div>
        <div className="bus-route">
          <i className="fa fa-map-marker-alt"/> {bus.currentStopName}
          <i className="fa fa-arrow-right mx"/> {bus.nextStopName || '…'}
        </div>
        <div className="bus-bottom-row">
          <span className="bus-stops"><i className="fa fa-map-signs"/> {bus.stopsAway} stops away</span>
          <span className="bus-expand-btn"><i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'}`}/> Details</span>
        </div>
        {isExpanded && (
          <div className="bus-expanded">
            <div className="bus-metrics-grid">
              {[
                { icon: 'fa-clock',         label: 'ETA',        val: bus.isAlreadyHere ? 'Here' : `${Number(bus.etaMinutes).toFixed(2)} min` },
                { icon: 'fa-tachometer-alt',label: 'Avg Speed',  val: `${bus.avgSpeed} km/h` },
                { icon: 'fa-coins',         label: 'Cost/Stop',  val: `NPR ${bus.avgCostPerStop}` },
                { icon: 'fa-star',          label: 'Score',      val: `${bus.totalScore}/100`, gold: true },
              ].map(m => (
                <div key={m.label} className="bus-metric">
                  <i className={`fa ${m.icon} metric-icon${m.gold ? ' gold' : ''}`}/>
                  <span className="metric-label">{m.label}</span>
                  <span className={`metric-value${m.gold ? ' gold' : ''}`}>{m.val}</span>
                </div>
              ))}
            </div>
            <div className="score-bars">
              <ScoreBar label="ETA"   value={bus.scoreEta}   icon="fa-clock"/>
              <ScoreBar label="Cost"  value={bus.scoreCost}  icon="fa-coins"/>
              <ScoreBar label="Speed" value={bus.scoreSpeed} icon="fa-tachometer-alt"/>
            </div>
          </div>
        )}
        {isSelected && <div className="bus-selected-indicator"><i className="fa fa-check-circle"/> Route shown on map</div>}
      </div>
    </div>
  );
}

// ── Leg Section header ────────────────────────────────────────────────────────
function LegHeader({ num, color, icon, title, sub }) {
  return (
    <div className="leg-header" style={{ borderLeftColor: color }}>
      <div className="leg-badge" style={{ background: color }}>{num}</div>
      <div>
        <div className="leg-title"><i className={`fa ${icon}`}/> {title}</div>
        <div className="leg-sub">{sub}</div>
      </div>
    </div>
  );
}

// ── Recommended banner ────────────────────────────────────────────────────────
function RecBanner({ bus }) {
  if (!bus) return null;
  return (
    <div className="recommended-banner" style={{ marginBottom: '0.75rem' }}>
      <div className="rec-ring-wrap"><ScoreRing score={bus.totalScore} size={64}/><div className="rec-ring-label">Score</div></div>
      <div className="recommended-banner-body">
        <div className="recommended-banner-label"><i className="fa fa-crown"/> Recommended</div>
        <div className="recommended-banner-bus">Bus {bus.busNumber} <DirectionBadge isReturning={bus.isReturning}/></div>
        <div className="recommended-banner-meta">{bus.companyName}</div>
        <div className="rec-metrics">
          <span><EtaDisplay bus={bus}/></span>
          <span><i className="fa fa-tachometer-alt"/> {bus.avgSpeed} km/h</span>
          <span><i className="fa fa-coins"/> NPR {bus.avgCostPerStop}/stop</span>
          <span><i className="fa fa-map-signs"/> {bus.stopsAway} stops away</span>
        </div>
        <div className="score-bars">
          <ScoreBar label="ETA"   value={bus.scoreEta}   icon="fa-clock"/>
          <ScoreBar label="Cost"  value={bus.scoreCost}  icon="fa-coins"/>
          <ScoreBar label="Speed" value={bus.scoreSpeed} icon="fa-tachometer-alt"/>
        </div>
      </div>
    </div>
  );
}

export default function BusTracker() {
  const mapRef             = useRef(null);
  const leg1LayerRef       = useRef(null);
  const leg2LayerRef       = useRef(null);
  const markersRef         = useRef([]);
  const busMarkersRef      = useRef([]);
  const userMarkerRef      = useRef(null);
  const pinMarkersRef      = useRef([]);

  const { data: stopsData }  = useGetAllStopsQuery();
  const { data: routesData } = useGetAllRoutesQuery();
  const { data: busesData }  = useGetAllBusesQuery();
  const [calculateRoute, { isLoading: calculating }] = useCalculateRouteMutation();

  const [userLocation,       setUserLocation]       = useState(null);
  const [selectedDestStopId, setSelectedDestStopId] = useState(null);
  const selectedCompanyId = null;
  const [routeResult,        setRouteResult]        = useState(null);
  const [selectedLeg1BusId,  setSelectedLeg1BusId]  = useState(null);
  const [selectedLeg2BusId,  setSelectedLeg2BusId]  = useState(null);
  const [expandedBusId,      setExpandedBusId]      = useState(null);
  const [scrolled,           setScrolled]           = useState(false);

  const stops    = useMemo(() => stopsData?.data ?? [], [stopsData?.data]);
  const routes   = useMemo(() => routesData?.data ?? [], [routesData?.data]);
  const allBuses = useMemo(() => busesData?.data ?? [], [busesData?.data]);

  const needsBusChange = routeResult?.requiresBusChange ?? false;
  const leg1Buses = useMemo(() => routeResult?.leg1Buses ?? [], [routeResult]);
  const leg2Buses = useMemo(() => routeResult?.availableBuses ?? [], [routeResult]);

  // Scroll header
  useEffect(() => {
    const el = document.querySelector('.bus-tracker-container');
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', fn);
    return () => el.removeEventListener('scroll', fn);
  }, []);

  // ── Random bus positions ──────────────────────────────────────────────────
  const positionedBuses = useMemo(() => {
    if (!routes.length || !allBuses.length) return [];
    return allBuses.map(bus => {
      const r = routes[Math.floor(Math.random() * routes.length)];
      if (!r.sequence || r.sequence.length < 2) return null;
      const isReturning = Math.random() < 0.4;
      const seq = isReturning ? [...r.sequence].reverse() : r.sequence;
      const si  = Math.floor(Math.random() * (seq.length - 1));
      const fr  = seq[si], to = seq[si + 1];
      const pr  = Math.random();
      return {
        busId: bus.busId, busNumber: bus.busNumber, companyName: bus.companyName,
        routeId: r.routeId, routeName: r.routeName, isReturning,
        currentStopId: fr.stopId, currentStopName: fr.stopName,
        nextStopId: to.stopId, nextStopName: to.stopName, progress: pr,
        currentLatitude:  fr.latitude  + (to.latitude  - fr.latitude)  * pr,
        currentLongitude: fr.longitude + (to.longitude - fr.longitude) * pr,
      };
    }).filter(Boolean);
  }, [routes, allBuses]);

  const enrichBuses = useCallback((backendList) =>
    backendList.map(b => {
      const local = positionedBuses.find(p => p?.busId === b.busId);
      return { ...b, currentLatitude: local?.currentLatitude ?? b.currentLatitude,
               currentLongitude: local?.currentLongitude ?? b.currentLongitude,
               nextStopName: local?.nextStopName ?? '' };
    }), [positionedBuses]);

  const enrichedLeg1 = useMemo(() => enrichBuses(leg1Buses), [leg1Buses, enrichBuses]);
  const enrichedLeg2 = useMemo(() => enrichBuses(leg2Buses), [leg2Buses, enrichBuses]);

  // Auto-select recommended buses
  useEffect(() => {
    if (!enrichedLeg1.length) return;
    if (selectedLeg1BusId && enrichedLeg1.find(b => b.busId === selectedLeg1BusId)) return;
    setSelectedLeg1BusId((enrichedLeg1.find(b => b.isRecommended) ?? enrichedLeg1[0]).busId);
  }, [enrichedLeg1, selectedLeg1BusId]);

  useEffect(() => {
    if (!enrichedLeg2.length) return;
    if (selectedLeg2BusId && enrichedLeg2.find(b => b.busId === selectedLeg2BusId)) return;
    setSelectedLeg2BusId((enrichedLeg2.find(b => b.isRecommended) ?? enrichedLeg2[0]).busId);
  }, [enrichedLeg2, selectedLeg2BusId]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = L.map('map').setView([27.7172, 85.324], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(mapRef.current);
    mapRef.current.on('click', e => setUserLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
  }, []);

  // ── User marker ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
    userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: L.divIcon({
        className: 'user-marker-container',
        html: `<div class="user-marker-icon"><i class="fa fa-map-marker-alt"></i></div>`,
        iconSize: [36, 36], iconAnchor: [18, 36],
      }),
    }).addTo(mapRef.current)
      .bindPopup(`<div class="popup-content"><div class="popup-title"><i class="fa fa-crosshairs"></i> Your Location</div>
        <div class="popup-subtitle">${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}</div></div>`);
  }, [userLocation]);

  // ── Stop markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !stops.length) return;
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));

    markersRef.current = stops.map(stop => {
      const isDest    = stop.stopId === selectedDestStopId;
      const isNearest = stop.stopId === routeResult?.nearestStopId;
      const isChange  = stop.stopId === routeResult?.changeStopId;

      let cls, size;
      if (isDest)         { cls = 'stop-marker-selected'; size = 28; }
      else if (isChange)  { cls = 'stop-marker-change';   size = 26; }
      else if (isNearest) { cls = 'stop-marker-nearest';  size = 26; }
      else                { cls = 'stop-marker';           size = 20; }

      const m = L.marker([stop.latitude, stop.longitude], {
        icon: L.divIcon({
          className: 'stop-marker-container',
          html: `<div class="${cls}"></div>`,
          iconSize: [size, size], iconAnchor: [size/2, size/2],
        }),
      }).addTo(mapRef.current);

      const badge = isDest    ? '<div class="destination-badge"><i class="fa fa-flag-checkered"></i> Destination</div>'
                  : isChange  ? '<div class="change-badge"><i class="fa fa-exchange-alt"></i> Change bus here</div>'
                  : isNearest ? '<div class="nearest-badge"><i class="fa fa-walking"></i> Your nearest stop</div>'
                  : '';

      m.bindPopup(`<div class="popup-content">
        <div class="popup-title">${stop.stopName}</div>
        <div class="popup-subtitle">Stop ID: ${stop.stopId}</div>
        ${badge}
      </div>`);
      return m;
    });
  }, [stops, selectedDestStopId, routeResult]);

  // ── Bus markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    busMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
    busMarkersRef.current = positionedBuses.filter(Boolean).map(bus => {
      const isOnRoute = routeResult && bus.routeId === routeResult.routeId;
      const isSel1    = bus.busId === selectedLeg1BusId;
      const isSel2    = bus.busId === selectedLeg2BusId;
      const isRec     = enrichedLeg1.find(b => b.busId === bus.busId)?.isRecommended
                     || enrichedLeg2.find(b => b.busId === bus.busId)?.isRecommended;

      const cls = isSel1 || isSel2 ? 'bus-marker-selected' : isRec ? 'bus-marker-recommended'
                : isOnRoute ? 'bus-marker-on-route' : 'bus-marker';

      const m = L.marker([bus.currentLatitude, bus.currentLongitude], {
        icon: L.divIcon({
          className: 'bus-marker-container',
          html: `<div class="${cls}"><i class="fa fa-bus"></i>${isRec && !isSel1 && !isSel2 ? '<span class="rec-star">★</span>' : ''}</div>`,
          iconSize: [(isSel1||isSel2) ? 46 : 38, (isSel1||isSel2) ? 46 : 38],
          iconAnchor: [(isSel1||isSel2) ? 23 : 19, (isSel1||isSel2) ? 23 : 19],
        }),
      }).addTo(mapRef.current);

      const dirColor = bus.isReturning ? '#e07b39' : '#39a0e0';
      m.bindPopup(`<div class="popup-content">
        <div class="popup-title"><i class="fa fa-bus"></i> ${bus.busNumber}</div>
        <div class="popup-subtitle">${bus.companyName}</div>
        <div class="dir-pill-popup" style="background:${dirColor}22;color:${dirColor};border:1px solid ${dirColor}55;">
          ${bus.isReturning ? '⟵ Returning' : '⟶ Outbound'}
        </div>
        <div class="${isOnRoute ? 'bus-route-info-selected' : 'bus-route-info'}">
          <div><strong>Route:</strong> ${bus.routeName}</div>
          <div><strong>At:</strong> ${bus.currentStopName} → ${bus.nextStopName}</div>
        </div>
      </div>`);
      return m;
    });
  }, [positionedBuses, routeResult, selectedLeg1BusId, selectedLeg2BusId, enrichedLeg1, enrichedLeg2]);

  // ── Route polylines ───────────────────────────────────────────────────────
  useEffect(() => {
    const draw = async () => {
      if (!mapRef.current) return;

      [leg1LayerRef, leg2LayerRef].forEach(r => {
        if (r.current) { mapRef.current.removeLayer(r.current); r.current = null; }
      });
      pinMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
      pinMarkersRef.current = [];

      if (!routeResult) return;

      const fetchRoad = async (pts) => {
        try {
          const s = pts.map(c => `${c[1]},${c[0]}`).join(';');
          const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${s}?overview=full&geometries=geojson`);
          const d = await r.json();
          if (d.code === 'Ok') return d.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        } catch (_) {}
        return null;
      };

      const nearestStop = stops.find(s => s.stopId === routeResult.nearestStopId);
      const changeStop  = stops.find(s => s.stopId === routeResult.changeStopId);
      const destStop    = stops.find(s => s.stopId === selectedDestStopId);

      // ════════════════════════════════════════════════════════════════════
      //  2-LEG TRANSFER ROUTE
      // ════════════════════════════════════════════════════════════════════
      if (needsBusChange && nearestStop && changeStop && destStop) {

        const selLeg1 = enrichedLeg1.find(b => b.busId === selectedLeg1BusId) ?? enrichedLeg1[0];

        if (selLeg1) {
          const leg1Seq = routeResult.leg1Sequence ?? [];
          let wpts = [];

          if (leg1Seq.length >= 2) {
            const busIdx    = leg1Seq.findIndex(s => s.stopId === selLeg1.currentStopId);
            const changeIdx = leg1Seq.findIndex(s => s.stopId === routeResult.changeStopId);

            if (busIdx !== -1 && changeIdx !== -1) {
              wpts.push([selLeg1.currentLatitude, selLeg1.currentLongitude]);
              const step = selLeg1.isReturning ? -1 : 1;
              let cur = busIdx;
              let safety = 0;
              cur = (cur + step + leg1Seq.length) % leg1Seq.length;
              while (safety++ < leg1Seq.length) {
                const stop = leg1Seq[cur];
                wpts.push([stop.latitude, stop.longitude]);
                if (cur === changeIdx) break;
                cur = (cur + step + leg1Seq.length) % leg1Seq.length;
              }
            } else {
              wpts = [
                [selLeg1.currentLatitude, selLeg1.currentLongitude],
                [nearestStop.latitude,    nearestStop.longitude],
                [changeStop.latitude,     changeStop.longitude],
              ];
            }
          } else {
            wpts = [
              [selLeg1.currentLatitude, selLeg1.currentLongitude],
              [nearestStop.latitude,    nearestStop.longitude],
              [changeStop.latitude,     changeStop.longitude],
            ];
          }

          const road = await fetchRoad(wpts);
          leg1LayerRef.current = L.polyline(
            road ?? wpts,
            { color: '#f59e0b', weight: 5, opacity: 0.9, dashArray: '10 6', lineJoin: 'round', lineCap: 'round' }
          ).addTo(mapRef.current);
        }

        const selLeg2 = enrichedLeg2.find(b => b.busId === selectedLeg2BusId) ?? enrichedLeg2[0];

        if (selLeg2) {
          const leg2Seq = routeResult.routeSequence ?? [];
          let wpts = [];

          if (leg2Seq.length >= 2) {
            const busIdx    = leg2Seq.findIndex(s => s.stopId === selLeg2.currentStopId);
            const changeIdx = leg2Seq.findIndex(s => s.stopId === routeResult.changeStopId);
            const destIdx   = leg2Seq.findIndex(s => s.stopId === selectedDestStopId);

            if (busIdx !== -1 && changeIdx !== -1 && destIdx !== -1) {
              wpts.push([selLeg2.currentLatitude, selLeg2.currentLongitude]);
              const step = selLeg2.isReturning ? -1 : 1;
              let cur = busIdx;
              let safety = 0;
              cur = (cur + step + leg2Seq.length) % leg2Seq.length;
              while (safety++ < leg2Seq.length) {
                const stop = leg2Seq[cur];
                wpts.push([stop.latitude, stop.longitude]);
                if (cur === destIdx) break;
                cur = (cur + step + leg2Seq.length) % leg2Seq.length;
              }
            } else if (changeIdx !== -1 && destIdx !== -1) {
              wpts.push([changeStop.latitude, changeStop.longitude]);
              const step = selLeg2.isReturning ? -1 : 1;
              let cur = changeIdx;
              let safety = 0;
              cur = (cur + step + leg2Seq.length) % leg2Seq.length;
              while (safety++ < leg2Seq.length) {
                const stop = leg2Seq[cur];
                wpts.push([stop.latitude, stop.longitude]);
                if (cur === destIdx) break;
                cur = (cur + step + leg2Seq.length) % leg2Seq.length;
              }
            } else {
              wpts = [
                [changeStop.latitude, changeStop.longitude],
                [destStop.latitude,   destStop.longitude],
              ];
            }
          } else {
            wpts = [
              [changeStop.latitude, changeStop.longitude],
              [destStop.latitude,   destStop.longitude],
            ];
          }

          const road = await fetchRoad(wpts);
          leg2LayerRef.current = L.polyline(
            road ?? wpts,
            { color: '#10b981', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }
          ).addTo(mapRef.current);
        }

        const pin = L.marker([changeStop.latitude, changeStop.longitude], {
          icon: L.divIcon({
            className: '',
            html: `<div class="change-map-pin"><i class="fa fa-exchange-alt"></i> Change bus here</div>`,
            iconSize: [150, 32], iconAnchor: [75, 32],
          }),
          zIndexOffset: 600,
        }).addTo(mapRef.current);
        pinMarkersRef.current.push(pin);

        const allPts = [
          [nearestStop.latitude,  nearestStop.longitude],
          [changeStop.latitude,   changeStop.longitude],
          [destStop.latitude,     destStop.longitude],
        ];
        if (userLocation) allPts.unshift([userLocation.latitude, userLocation.longitude]);
        mapRef.current.fitBounds(L.latLngBounds(allPts), { padding: [60, 60] });

      // ════════════════════════════════════════════════════════════════════
      //  DIRECT ROUTE — two-colour split: bus→nearest (blue) + nearest→dest (gold)
      // ════════════════════════════════════════════════════════════════════
      } else if (!needsBusChange) {

        const selBus = enrichedLeg2.find(b => b.busId === selectedLeg2BusId);
        if (!selBus || !routeResult.routeSequence?.length) return;

        const seq        = routeResult.routeSequence;
        const busIdx     = seq.findIndex(s => s.stopId === selBus.currentStopId);
        const nearestIdx = seq.findIndex(s => s.stopId === routeResult.nearestStopId);
        const destIdx    = seq.findIndex(s => s.stopId === selectedDestStopId);
        if (busIdx === -1 || destIdx === -1) return;

        // ── Segment 1: Bus → Nearest Stop (blue dashed) ───────────────────
        const wpts1 = [[selBus.currentLatitude, selBus.currentLongitude]];
        if (nearestIdx !== -1 && nearestIdx !== busIdx) {
          let cur = busIdx, safety = 0;
          while (cur !== nearestIdx && safety++ < seq.length) {
            cur = selBus.isReturning
              ? (cur - 1 + seq.length) % seq.length
              : (cur + 1) % seq.length;
            wpts1.push([seq[cur].latitude, seq[cur].longitude]);
          }
        }

        // ── Segment 2: Nearest Stop → Destination (gold solid) ────────────
        const wpts2 = nearestStop
          ? [[nearestStop.latitude, nearestStop.longitude]]
          : [[...wpts1].pop()];

        if (nearestIdx !== -1) {
          let cur = nearestIdx, safety = 0;
          while (cur !== destIdx && safety++ < seq.length) {
            cur = selBus.isReturning
              ? (cur - 1 + seq.length) % seq.length
              : (cur + 1) % seq.length;
            wpts2.push([seq[cur].latitude, seq[cur].longitude]);
          }
        }

        // ── Draw segment 1: blue dashed (bus approaching user stop) ───────
        if (wpts1.length >= 2) {
          const road1 = await fetchRoad(wpts1);
          leg1LayerRef.current = L.polyline(road1 ?? wpts1, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.85,
            dashArray: '10 6',
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(mapRef.current);
        }

        // ── Draw segment 2: gold solid (user's journey to destination) ────
        if (wpts2.length >= 2) {
          const road2 = await fetchRoad(wpts2);
          leg2LayerRef.current = L.polyline(road2 ?? wpts2, {
            color: selBus?.isRecommended ? '#d4af37' : '#c0a040',
            weight: 5,
            opacity: 0.92,
            lineJoin: 'round',
            lineCap: 'round',
          }).addTo(mapRef.current);
        }

        // ── Fit map ───────────────────────────────────────────────────────
        const allWpts = [...wpts1, ...wpts2];
        if (allWpts.length >= 2) {
          const bounds = L.latLngBounds(allWpts);
          if (userLocation) bounds.extend([userLocation.latitude, userLocation.longitude]);
          mapRef.current.fitBounds(bounds, { padding: [60, 60] });
        }
      }
    };

    draw();
  }, [routeResult, userLocation, selectedLeg1BusId, selectedLeg2BusId, enrichedLeg1, enrichedLeg2, stops, selectedDestStopId, needsBusChange]);

  const handleCalculate = async () => {
    if (!userLocation || !selectedDestStopId) { alert('Set your location and select a destination.'); return; }
    try {
      const result = await calculateRoute({
        userLatitude: userLocation.latitude, userLongitude: userLocation.longitude,
        destinationStopId: selectedDestStopId,
        companyId: selectedCompanyId ?? undefined,
        busPositions: positionedBuses.filter(Boolean).map(b => ({
          busId: b.busId, currentStopId: b.currentStopId, nextStopId: b.nextStopId,
          progress: b.progress, routeId: b.routeId,
          currentLatitude: b.currentLatitude, currentLongitude: b.currentLongitude,
          isReturning: b.isReturning,
        })),
      }).unwrap();
      setRouteResult(Array.isArray(result.data) ? result.data[0] : result.data);
      setSelectedLeg1BusId(null);
      setSelectedLeg2BusId(null);
      setExpandedBusId(null);
    } catch (e) { console.error(e); alert('Failed to calculate route.'); }
  };

  const handleGeo = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        mapRef.current?.setView([coords.latitude, coords.longitude], 15);
      },
      err => alert({ 1: 'Permission denied.', 2: 'Unavailable.', 3: 'Timed out.' }[err.code] || 'Click the map instead.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleBusClick = (busId, leg) => {
    if (leg === 1) {
      setSelectedLeg1BusId(busId);
      setExpandedBusId(prev => (prev === busId ? null : busId));
    } else {
      setSelectedLeg2BusId(busId);
      setExpandedBusId(prev => (prev === busId ? null : busId));
    }
  };

  const rec1 = enrichedLeg1.find(b => b.isRecommended);
  const rec2 = enrichedLeg2.find(b => b.isRecommended);

  return (
    <div className="bus-tracker-container">

      {/* ── Header ── */}
      <div className={`bus-tracker-header${scrolled ? ' header-scrolled' : ''}`}>
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-icon"><i className="fa fa-bus-alt"/></span>
            <div>
              <h1 className="bus-tracker-title">BUSPARK</h1>
              <p className="bus-tracker-subtitle">Real-time intelligent routing</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="hstat"><i className="fa fa-bus"/><span>{positionedBuses.length}</span><em>Buses</em></div>
            <div className="hstat"><i className="fa fa-map-marker-alt"/><span>{stops.length}</span><em>Stops</em></div>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="controls-card glass-card">
        <div className="controls-grid">
          <div className="control-group">
            <label className="control-label"><i className="fa fa-crosshairs"/> Your Location</label>
            <button className="btn-primary" onClick={handleGeo}>
              <i className="fa fa-location-arrow"/> Get Current Location
            </button>
            {userLocation && (
              <div className="location-info">
                <i className="fa fa-map-marker-alt"/> {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </div>
            )}
          </div>
          <div className="control-group">
            <label className="control-label"><i className="fa fa-flag-checkered"/> Destination Stop</label>
            <div className="select-wrapper">
              <i className="fa fa-chevron-down select-icon"/>
              <select className="select-input" value={selectedDestStopId || ''} onChange={e => setSelectedDestStopId(Number(e.target.value))}>
                <option value="">Select destination…</option>
                {stops.map(s => <option key={s.stopId} value={s.stopId}>{s.stopName}</option>)}
              </select>
            </div>
          </div>
          <div className="control-group">
            <label className="control-label">&nbsp;</label>
            <button className="btn-find-route" onClick={handleCalculate} disabled={calculating || !userLocation || !selectedDestStopId}>
              {calculating
                ? <><i className="fa fa-spinner fa-spin"/> Calculating…</>
                : <><i className="fa fa-search"/> Find Best Route</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Route Result ── */}
      {routeResult && (
        <div className="route-card glass-card">

          <div className="route-details" style={{ marginBottom: '1.25rem' }}>
            <div className="route-detail-row">
              <div className="route-detail-item">
                <span className="detail-label"><i className="fa fa-route"/> Route</span>
                <span className="detail-value">{routeResult.routeName}</span>
              </div>
              <div className="route-detail-item">
                <span className="detail-label"><i className="fa fa-clock"/> Est. Time</span>
                <span className="detail-value">~{routeResult.totalTravelTime} min</span>
              </div>
            </div>
          </div>

          {needsBusChange ? (
            <>
              <div className="change-alert-strip">
                <i className="fa fa-exchange-alt change-alert-icon"/>
                <div>
                  <div className="change-alert-title">Bus change required at <strong>{routeResult.changeStopName}</strong></div>
                  <div className="change-alert-sub">
                    You are {Number(routeResult.distanceToNearestStop).toFixed(1)} km from the boarding stop.
                    Take a bus there first, then change to reach your destination.
                  </div>
                </div>
              </div>

              <div className="transfer-legend" style={{ margin: '0.75rem 0 1rem' }}>
                <span className="transfer-legend-item">
                  <span className="transfer-legend-swatch" style={{ background: '#f59e0b', borderStyle: 'dashed' }}/>
                  Leg 1 — to {routeResult.changeStopName} (amber)
                </span>
                <span className="transfer-legend-item">
                  <span className="transfer-legend-swatch" style={{ background: '#10b981' }}/>
                  Leg 2 — to destination (green)
                </span>
              </div>

              <LegHeader num="Leg 1" color="#f59e0b" icon="fa-bus"
                title={`Board a bus at ${routeResult.nearestStopName} (your nearest stop)`}
                sub={`Ride to ${routeResult.changeStopName} — then change buses`}/>

              <RecBanner bus={rec1}/>

              {enrichedLeg1.length > 0 ? (
                <div className="buses-list" style={{ marginBottom: '1.5rem' }}>
                  {enrichedLeg1.map(bus => (
                    <BusCard key={bus.busId} bus={bus}
                      isSelected={bus.busId === selectedLeg1BusId}
                      isExpanded={expandedBusId === bus.busId}
                      accentColor="#f59e0b"
                      onClick={id => handleBusClick(id, 1)}/>
                  ))}
                </div>
              ) : (
                <div className="buses-empty" style={{ marginBottom: '1.5rem' }}>
                  <i className="fa fa-bus buses-empty-icon"/>
                  <p>No live buses found for Leg 1. Check at the stop.</p>
                </div>
              )}

              <div className="change-stop-divider">
                <div className="change-stop-divider__line"/>
                <div className="change-stop-divider__badge">
                  <i className="fa fa-exchange-alt"/> Alight at <strong>{routeResult.changeStopName}</strong> — change buses
                </div>
                <div className="change-stop-divider__line"/>
              </div>

              <LegHeader num="Leg 2" color="#10b981" icon="fa-flag-checkered"
                title={`Board at ${routeResult.changeStopName} → Destination`}
                sub={`Take route "${routeResult.routeName}" from the change stop to your destination`}/>

              <RecBanner bus={rec2}/>

              {enrichedLeg2.length > 0 ? (
                <div className="buses-list">
                  {enrichedLeg2.map(bus => (
                    <BusCard key={bus.busId} bus={bus}
                      isSelected={bus.busId === selectedLeg2BusId}
                      isExpanded={expandedBusId === bus.busId}
                      accentColor="#10b981"
                      onClick={id => handleBusClick(id, 2)}/>
                  ))}
                </div>
              ) : (
                <div className="buses-empty">
                  <i className="fa fa-bus buses-empty-icon"/>
                  <p>No live buses found for Leg 2. Check at the stop.</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ── Direct route legend ── */}
              <div className="transfer-legend" style={{ margin: '0 0 1rem' }}>
                <span className="transfer-legend-item">
                  <span className="transfer-legend-swatch" style={{ background: '#3b82f6', borderStyle: 'dashed' }}/>
                  Bus approaching your stop (blue)
                </span>
                <span className="transfer-legend-item">
                  <span className="transfer-legend-swatch" style={{ background: '#d4af37' }}/>
                  Your journey to destination (gold)
                </span>
              </div>

              <div className="route-detail-row" style={{ marginBottom: '1rem' }}>
                <div className="route-detail-item">
                  <span className="detail-label"><i className="fa fa-walking"/> Nearest Stop</span>
                  <span className="detail-value">
                    {routeResult.nearestStopName}
                    <span className="distance-badge">{Number(routeResult.distanceToNearestStop).toFixed(2)} km</span>
                  </span>
                </div>
              </div>

              <RecBanner bus={rec2}/>

              {enrichedLeg2.length > 0 ? (
                <div className="buses-list">
                  {enrichedLeg2.map(bus => (
                    <BusCard key={bus.busId} bus={bus}
                      isSelected={bus.busId === selectedLeg2BusId}
                      isExpanded={expandedBusId === bus.busId}
                      onClick={id => handleBusClick(id, 2)}/>
                  ))}
                </div>
              ) : (
                <div className="buses-empty">
                  <i className="fa fa-bus buses-empty-icon"/>
                  <p>No buses on this route.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div id="map" className="map-container"/>
    </div>
  );
}