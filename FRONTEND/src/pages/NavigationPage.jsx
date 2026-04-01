/**
 * NavigationPage — Google Maps-style directions UI with TomTom map.
 * - From/To input bar with swap
 * - Multiple route options (fastest + alternatives)
 * - Blue active route, gray alternates on map
 * - Directions / Save / Nearby / Share action buttons
 * - Red destination pin, blue start dot
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import mapApi from "../api/mapApi";

const SDK_JS  = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js";
const SDK_CSS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css";
let sdkPromise = null;
function loadSDK() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.tt) { resolve(); return; }
    if (!document.querySelector(`link[href="${SDK_CSS}"]`)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = SDK_CSS;
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = SDK_JS; s.async = true; s.onload = resolve;
    s.onerror = () => reject(new Error("TomTom SDK failed to load"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

const fmtDist = m => m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`;
const fmtTime = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m} min`; };

// ── Marker factories ───────────────────────────────────────────────────────────
function makeStartDot() {
  const el = document.createElement("div");
  el.style.cssText = "width:16px;height:16px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 3px rgba(26,115,232,0.3)";
  return el;
}
function makeEndPin() {
  const el = document.createElement("div");
  el.innerHTML = `<svg viewBox="0 0 30 42" width="30" height="42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="#ea4335" stroke="#c5221f" stroke-width="1"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`;
  return el;
}

// ── Draw route layers ──────────────────────────────────────────────────────────
function drawRoutes(map, routes, activeIdx) {
  // Remove old layers/sources
  for (let i = 0; i < 5; i++) {
    [`qb-casing-${i}`, `qb-line-${i}`].forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch(_){} });
    try { if (map.getSource(`qb-route-${i}`)) map.removeSource(`qb-route-${i}`); } catch(_){}
  }

  // Draw alternates first (gray, behind), then active (blue, on top)
  const order = routes.map((_,i) => i).filter(i => i !== activeIdx).concat([activeIdx]);

  order.forEach(i => {
    const route = routes[i];
    if (!route?.geometry?.length) return;
    const coords = route.geometry
      .map(p => [parseFloat(p.longitude ?? p.lng), parseFloat(p.latitude ?? p.lat)])
      .filter(([a,b]) => !isNaN(a) && !isNaN(b));
    if (coords.length < 2) return;

    const isActive = i === activeIdx;
    const geojson = { type:"Feature", geometry:{ type:"LineString", coordinates:coords } };

    map.addSource(`qb-route-${i}`, { type:"geojson", data:geojson });

    // Casing
    map.addLayer({ id:`qb-casing-${i}`, type:"line", source:`qb-route-${i}`,
      layout:{"line-join":"round","line-cap":"round"},
      paint:{"line-color":"#ffffff","line-width": isActive ? 13 : 9,"line-opacity":1}
    });
    // Main line
    map.addLayer({ id:`qb-line-${i}`, type:"line", source:`qb-route-${i}`,
      layout:{"line-join":"round","line-cap":"round"},
      paint:{"line-color": isActive ? "#1a73e8" : "#9ca3af","line-width": isActive ? 7 : 4,"line-opacity": isActive ? 1 : 0.7}
    });
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NavigationPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const station    = state?.station;
  const passedLoc  = state?.userLocation;

  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const mapLoadedRef  = useRef(false);
  const pendingDraw   = useRef(null);
  const routeListRef  = useRef(null);

  const [sdkReady,     setSdkReady]     = useState(false);
  const [userLocation, setUserLocation] = useState(passedLoc);
  const [routes,       setRoutes]       = useState([]);
  const [activeRoute,  setActiveRoute]  = useState(0);
  const [locLoading,   setLocLoading]   = useState(!passedLoc);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error,        setError]        = useState(null);
  const [saved,        setSaved]        = useState(false);
  const [retryCount,   setRetryCount]   = useState(0);

  // Refs that always hold latest values (safe to use inside map callbacks)
  const userLocRef   = useRef(passedLoc);
  const routesRef    = useRef([]);
  const activeIdxRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { userLocRef.current = userLocation; }, [userLocation]);
  useEffect(() => { routesRef.current = routes; activeIdxRef.current = activeRoute; }, [routes, activeRoute]);

  const handleDirectionsClick = () => {
    if (routes.length > 0) {
      // Scroll to route list
      routeListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (!userLocation) {
      // Re-request location
      setLocLoading(true);
      navigator.geolocation?.getCurrentPosition(
        pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
        () => setLocLoading(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      // Retry route fetch
      setRetryCount(c => c + 1);
    }
  };

  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

  if (!station?.location?.coordinates) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f4f0"}}>
        <div style={{textAlign:"center",padding:32}}>
          <p style={{fontSize:40,marginBottom:12}}>🗺️</p>
          <p style={{fontWeight:700,fontSize:18,color:"#1a1a1a",marginBottom:8}}>No destination set</p>
          <button onClick={() => navigate("/nearby")} style={{padding:"10px 24px",borderRadius:10,background:"linear-gradient(135deg,#1a7a4a,#22a05e)",color:"#fff",fontWeight:600,border:"none",cursor:"pointer"}}>Back to Nearby</button>
        </div>
      </div>
    );
  }

  const [stLng, stLat] = station.location.coordinates;

  // Load SDK
  useEffect(() => { loadSDK().then(() => setSdkReady(true)).catch(e => setError(e.message)); }, []);

  // Get location
  useEffect(() => {
    if (passedLoc) return;
    if (!navigator.geolocation) { setLocLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
      () => setLocLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []); // eslint-disable-line

  // Fetch routes (also re-runs on retry)
  useEffect(() => {
    if (!userLocation) return;
    setRouteLoading(true); setError(null);
    mapApi.getRoute(userLocation.lat, userLocation.lng, stLat, stLng)      .then(data => {
        console.log("[Route] data:", data);
        const list = data?.routes || (data?.geometry ? [{ index:0, geometry:data.geometry, distanceMeters:data.distanceMeters, durationSeconds:data.durationSeconds, trafficDelaySeconds:data.trafficDelaySeconds||0, viaLabel:"Fastest route", isFastest:true }] : []);
        setRoutes(list);
        setActiveRoute(0);
      })
      .catch(e => setError("Route unavailable: " + (e?.response?.data?.message || e.message)))
      .finally(() => setRouteLoading(false));
  }, [userLocation, retryCount]); // eslint-disable-line

  // Attempt draw helper
  const attemptDraw = useCallback((map, routeList, activeIdx, loc) => {
    if (!routeList?.length) return;
    const doIt = () => {
      drawRoutes(map, routeList, activeIdx);
      if (loc && routeList[activeIdx]?.geometry?.length) {
        try {
          const bounds = new window.tt.LngLatBounds();
          bounds.extend([loc.lng, loc.lat]);
          bounds.extend([stLng, stLat]);
          const mapEl = mapRef.current?.getContainer();
          const w = mapEl?.offsetWidth  || 400;
          const h = mapEl?.offsetHeight || 300;
          const pad = Math.min(40, Math.floor(Math.min(w, h) * 0.1));
          map.fitBounds(bounds, {
            padding: { top: pad, bottom: pad + 20, left: pad, right: pad },
            maxZoom: 15,
            duration: 900,
          });
        } catch(_){}
      }
    };
    if (map.isStyleLoaded()) doIt();
    else map.once("styledata", doIt);
  }, [stLng, stLat]);

  // Init map
  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;
    const initLat = userLocation ? (userLocation.lat + stLat) / 2 : stLat;
    const initLng = userLocation ? (userLocation.lng + stLng) / 2 : stLng;
    try {
      const map = window.tt.map({ key:apiKey, container:containerRef.current, center:[initLng,initLat], zoom: userLocation ? 9 : 13 });
      mapRef.current = map;
      map.addControl(new window.tt.NavigationControl({ showZoom:true, showCompass:false }), "top-right");
      map.on("load", () => {
        mapLoadedRef.current = true;
        const loc = userLocRef.current;
        if (loc) new window.tt.Marker({ element:makeStartDot(), anchor:"center" }).setLngLat([loc.lng, loc.lat]).addTo(map);
        new window.tt.Marker({ element:makeEndPin(), anchor:"bottom" })
          .setLngLat([stLng, stLat])
          .setPopup(new window.tt.Popup({ offset:40 }).setHTML(`<div style="padding:10px 14px;min-width:150px"><strong style="font-size:13px;color:#111">${station.name}</strong>${station.operator?`<p style="font-size:12px;color:#555;margin:3px 0 0">${station.operator}</p>`:""}</div>`))
          .addTo(map);
        // Draw any routes that arrived before map was ready
        const pending = routesRef.current;
        if (pending?.length) {
          attemptDraw(map, pending, activeIdxRef.current, userLocRef.current);
        }
      });
    } catch(e) { setError("Map failed: " + e.message); }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; mapLoadedRef.current = false; } };
  }, [sdkReady]); // eslint-disable-line

  // Draw when routes arrive or change
  useEffect(() => {
    if (!routes.length) return;
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return; // map.on("load") will draw via routesRef
    attemptDraw(map, routes, activeRoute, userLocRef.current);
  }, [routes, activeRoute, attemptDraw]);

  const handleRouteSelect = (idx) => {
    setActiveRoute(idx);
    const map = mapRef.current;
    if (map && mapLoadedRef.current) attemptDraw(map, routes, idx, userLocRef.current);
  };

  const activeR = routes[activeRoute];

  return (
    <div className="nav-page-layout">
      {/* Map */}
      <div ref={containerRef} className="nav-map-container" style={{ position:"absolute", inset:0 }} />

      {/* SDK loading */}
      {!sdkReady && (
        <div style={{ position:"absolute", inset:0, background:"#e8eaed", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"4px solid #e5e7eb", borderTopColor:"#1a73e8", animation:"qb-spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
            <p style={{ fontSize:14, color:"#555", fontWeight:500 }}>Loading map…</p>
          </div>
        </div>
      )}

      {/* ── Left panel — Google Maps style ── */}
      <div className="nav-panel">

        {/* From / To inputs */}
        <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid #f3f4f6" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <button onClick={() => navigate(-1)} style={{ width:36, height:36, borderRadius:"50%", background:"#f5f7f5", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ flex:1 }}>
              {/* From */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#f5f7f5", borderRadius:10, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#1a73e8", border:"2px solid #fff", boxShadow:"0 0 0 2px #1a73e8", flexShrink:0 }}/>
                <span style={{ fontSize:13, color:"#555", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Your location"}
                </span>
                {locLoading && <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid #e5e7eb", borderTopColor:"#1a73e8", animation:"qb-spin 0.8s linear infinite", flexShrink:0 }}/>}
              </div>
              {/* To */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#f5f7f5", borderRadius:10 }}>
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink:0 }}>
                  <path d="M5 0C2.239 0 0 2.239 0 5c0 3.5 5 9 5 9S10 8.5 10 5C10 2.239 7.761 0 5 0z" fill="#ea4335"/>
                  <circle cx="5" cy="5" r="2" fill="white"/>
                </svg>
                <span style={{ fontSize:13, fontWeight:600, color:"#111", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{station.name}</span>
              </div>
            </div>
          </div>

          {/* Action buttons row — Directions / Save / Nearby / Share */}
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {[
              { icon:"🧭", label:"Directions", active:true, onClick: handleDirectionsClick },
              { icon:"🔖", label: saved ? "Saved" : "Save", active:saved, onClick:()=>setSaved(s=>!s) },
              { icon:"📍", label:"Nearby", onClick:()=>navigate("/nearby") },
              { icon:"↗️", label:"Share", onClick:()=>{ try { navigator.share?.({ title:station.name, url:window.location.href }); } catch(_){} } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 4px", borderRadius:10, background: btn.active ? "#e8f0fe" : "#f5f7f5", border:"none", cursor:"pointer" }}>
                <span style={{ fontSize:16 }}>{btn.icon}</span>
                <span style={{ fontSize:10, fontWeight:600, color: btn.active ? "#1a73e8" : "#555" }}>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Route loading */}
        {routeLoading && (
          <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid #e5e7eb", borderTopColor:"#1a73e8", animation:"qb-spin 0.8s linear infinite" }}/>
            <span style={{ fontSize:13, color:"#555" }}>Calculating routes…</span>
          </div>
        )}

        {/* Error */}
        {error && <div style={{ margin:"12px 16px", padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10 }}><p style={{ margin:0, fontSize:12, color:"#dc2626" }}>⚠️ {error}</p></div>}

        {/* Route options */}
        {routes.length > 0 && (
          <div ref={routeListRef} style={{ flex:1 }}>
            {routes.map((r, i) => (
              <div key={i} onClick={() => handleRouteSelect(i)}
                style={{ padding:"14px 16px", borderBottom:"1px solid #f3f4f6", cursor:"pointer", background: i === activeRoute ? "#f0f7ff" : "#fff", borderLeft: i === activeRoute ? "3px solid #1a73e8" : "3px solid transparent", transition:"background 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="2" rx="1" fill={i===activeRoute?"#1a73e8":"#9ca3af"}/><path d="M5 7h14M5 17h14" stroke={i===activeRoute?"#1a73e8":"#9ca3af"} strokeWidth="2" strokeLinecap="round"/></svg>
                    <span style={{ fontSize:14, fontWeight:700, color: i===activeRoute ? "#1a73e8" : "#111" }}>{fmtTime(r.durationSeconds)}</span>
                    {r.isFastest && i===0 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:99, background:"#e8f5e9", color:"#1a7a4a", fontWeight:600 }}>Fastest</span>}
                    {r.trafficDelaySeconds > 60 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:99, background:"#fef2f2", color:"#dc2626", fontWeight:600 }}>🚦 +{fmtTime(r.trafficDelaySeconds)}</span>}
                  </div>
                  <span style={{ fontSize:13, color:"#555", fontWeight:500 }}>{fmtDist(r.distanceMeters)}</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>via {r.viaLabel || `Route ${i+1}`}</p>
                {i === activeRoute && (
                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <button onClick={e => { e.stopPropagation(); navigate(`/stations/${station._id}`); }}
                      style={{ flex:1, padding:"8px 0", borderRadius:8, background:"#f5f7f5", border:"1px solid #e5e7eb", color:"#374151", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                      Details
                    </button>
                    <button onClick={e => { e.stopPropagation(); navigate("/nearby"); }}
                      style={{ flex:1, padding:"8px 0", borderRadius:8, background:"linear-gradient(135deg,#1a7a4a,#22a05e)", color:"#fff", fontWeight:700, fontSize:12, border:"none", cursor:"pointer" }}>
                      ← Nearby
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No location yet */}
        {!locLoading && !userLocation && !routeLoading && (
          <div style={{ padding:"16px" }}>
            <div style={{ padding:"12px 14px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:10 }}>
              <p style={{ margin:0, fontSize:12, color:"#92400e" }}>📍 Allow location access to calculate routes</p>
            </div>
            <div style={{ marginTop:12, padding:"14px 0", borderTop:"1px solid #f3f4f6" }}>
              <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:"#111" }}>{station.name}</p>
              {station.operator && <p style={{ margin:"0 0 2px", fontSize:12, color:"#1a7a4a", fontWeight:500 }}>{station.operator}</p>}
              {station.address  && <p style={{ margin:0, fontSize:11, color:"#6b7280" }}>{station.address}</p>}
              {station.facilities?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
                  {station.facilities.map(f => <span key={f} style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"rgba(26,122,74,0.07)", color:"#1a7a4a", border:"1px solid rgba(26,122,74,0.15)", textTransform:"capitalize" }}>{f}</span>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes qb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
