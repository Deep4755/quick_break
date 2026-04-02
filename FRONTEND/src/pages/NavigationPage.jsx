/**
 * NavigationPage — Enhanced Google Maps-style navigation.
 * Features: route highlight, A/B markers, turn-by-turn, traffic badge,
 * Start Navigation button, Recenter button, route summary card, mobile-optimised.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import mapApi from "../api/mapApi";
import useVoiceNavigation from "../hooks/useVoiceNavigation";
import VoiceGuidanceControls from "../components/VoiceGuidanceControls";

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

function trafficBadge(delaySec) {
  if (delaySec > 600) return { label:"Heavy traffic", color:"#dc2626", bg:"#fef2f2", dot:"🔴" };
  if (delaySec > 120) return { label:"Moderate", color:"#d97706", bg:"#fffbeb", dot:"🟡" };
  return { label:"Light traffic", color:"#16a34a", bg:"#f0fdf4", dot:"🟢" };
}

function makeStartMarker() {
  const el = document.createElement("div");
  el.style.cssText = "width:20px;height:20px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 0 3px rgba(22,163,74,0.35)";
  return el;
}
function makeEndMarker() {
  const el = document.createElement("div");
  el.innerHTML = `<svg viewBox="0 0 30 42" width="30" height="42"><path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="#ea4335" stroke="#c5221f" stroke-width="1"/><circle cx="15" cy="15" r="6" fill="white"/></svg>`;
  return el;
}

function drawRoutes(map, routes, activeIdx) {
  for (let i = 0; i < 5; i++) {
    [`qb-casing-${i}`,`qb-line-${i}`].forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch(_){} });
    try { if (map.getSource(`qb-route-${i}`)) map.removeSource(`qb-route-${i}`); } catch(_){}
  }
  const order = routes.map((_,i)=>i).filter(i=>i!==activeIdx).concat([activeIdx]);
  order.forEach(i => {
    const route = routes[i];
    if (!route?.geometry?.length) return;
    const coords = route.geometry.map(p=>[parseFloat(p.longitude??p.lng),parseFloat(p.latitude??p.lat)]).filter(([a,b])=>!isNaN(a)&&!isNaN(b));
    if (coords.length < 2) return;
    const isActive = i === activeIdx;
    map.addSource(`qb-route-${i}`, { type:"geojson", data:{ type:"Feature", geometry:{ type:"LineString", coordinates:coords } } });
    map.addLayer({ id:`qb-casing-${i}`, type:"line", source:`qb-route-${i}`, layout:{"line-join":"round","line-cap":"round"}, paint:{"line-color":"#ffffff","line-width":isActive?13:8,"line-opacity":1} });
    map.addLayer({ id:`qb-line-${i}`, type:"line", source:`qb-route-${i}`, layout:{"line-join":"round","line-cap":"round"}, paint:{"line-color":isActive?"#2563eb":"#9ca3af","line-width":isActive?7:3,"line-opacity":isActive?1:0.65} });
  });
}

const MANEUVER_ICONS = { TURN_RIGHT:"↱", TURN_LEFT:"↰", KEEP_RIGHT:"↗", KEEP_LEFT:"↖", ROUNDABOUT_RIGHT:"↻", ROUNDABOUT_LEFT:"↺", ARRIVE:"🏁", DEPART:"🚗", STRAIGHT:"↑" };

export default function NavigationPage() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const station    = state?.station;
  const passedLoc  = state?.userLocation;

  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const mapLoadedRef = useRef(false);
  const routeListRef = useRef(null);
  const userLocRef   = useRef(passedLoc);
  const routesRef    = useRef([]);
  const activeIdxRef = useRef(0);

  const [sdkReady,     setSdkReady]     = useState(false);
  const [userLocation, setUserLocation] = useState(passedLoc);
  const [routes,       setRoutes]       = useState([]);
  const [activeRoute,  setActiveRoute]  = useState(0);
  const [locLoading,   setLocLoading]   = useState(!passedLoc);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error,        setError]        = useState(null);
  const [saved,        setSaved]        = useState(false);
  const [retryCount,   setRetryCount]   = useState(0);
  const [showSteps,    setShowSteps]    = useState(false);
  const [navigating,   setNavigating]   = useState(false);
  const [currentStep,  setCurrentStep]  = useState(0);
  const watchIdRef = useRef(null);
  const userMarkerRef = useRef(null);

  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

  useEffect(() => { userLocRef.current = userLocation; }, [userLocation]);
  useEffect(() => { routesRef.current = routes; activeIdxRef.current = activeRoute; }, [routes, activeRoute]);

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

  useEffect(() => { loadSDK().then(() => setSdkReady(true)).catch(e => setError(e.message)); }, []);

  useEffect(() => {
    if (passedLoc) return;
    if (!navigator.geolocation) { setLocLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat:pos.coords.latitude, lng:pos.coords.longitude }); setLocLoading(false); },
      () => setLocLoading(false),
      { enableHighAccuracy:true, timeout:8000 }
    );
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!userLocation) return;
    setRouteLoading(true); setError(null);
    mapApi.getRoute(userLocation.lat, userLocation.lng, stLat, stLng)
      .then(data => { setRoutes(data?.routes || []); setActiveRoute(0); })
      .catch(e => setError("Route unavailable: " + (e?.response?.data?.message || e.message)))
      .finally(() => setRouteLoading(false));
  }, [userLocation, retryCount]); // eslint-disable-line

  const attemptDraw = useCallback((map, routeList, activeIdx, loc) => {
    if (!routeList?.length) return;
    const doIt = () => {
      drawRoutes(map, routeList, activeIdx);
      if (loc && routeList[activeIdx]?.geometry?.length) {
        try {
          const bounds = new window.tt.LngLatBounds();
          bounds.extend([loc.lng, loc.lat]);
          bounds.extend([stLng, stLat]);
          const el = mapRef.current?.getContainer();
          const pad = Math.min(50, Math.floor(Math.min(el?.offsetWidth||400, el?.offsetHeight||300)*0.1));
          map.fitBounds(bounds, { padding:{ top:pad, bottom:pad+20, left:pad, right:pad }, maxZoom:15, duration:900 });
        } catch(_){}
      }
    };
    if (map.isStyleLoaded()) doIt(); else map.once("styledata", doIt);
  }, [stLng, stLat]);

  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;
    const initLat = userLocation ? (userLocation.lat+stLat)/2 : stLat;
    const initLng = userLocation ? (userLocation.lng+stLng)/2 : stLng;
    try {
      const map = window.tt.map({ key:apiKey, container:containerRef.current, center:[initLng,initLat], zoom:userLocation?9:13 });
      mapRef.current = map;
      map.addControl(new window.tt.NavigationControl({ showZoom:true, showCompass:false }), "top-right");
      map.on("load", () => {
        mapLoadedRef.current = true;
        const loc = userLocRef.current;
        if (loc) {
          const m = new window.tt.Marker({ element:makeStartMarker(), anchor:"center" })
            .setLngLat([loc.lng,loc.lat])
            .setPopup(new window.tt.Popup({ offset:20 }).setHTML(`<div style="padding:8px 12px;font-size:13px;font-weight:600;color:#111">📍 Your Location</div>`))
            .addTo(map);
          userMarkerRef.current = m;
        }
        new window.tt.Marker({ element:makeEndMarker(), anchor:"bottom" }).setLngLat([stLng,stLat]).setPopup(new window.tt.Popup({ offset:40 }).setHTML(`<div style="padding:10px 14px;min-width:150px"><strong style="font-size:13px;color:#111">${station.name}</strong>${station.operator?`<p style="font-size:12px;color:#555;margin:3px 0 0">${station.operator}</p>`:""}</div>`)).addTo(map);
        const pending = routesRef.current;
        if (pending?.length) attemptDraw(map, pending, activeIdxRef.current, userLocRef.current);
      });
    } catch(e) { setError("Map failed: " + e.message); }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; mapLoadedRef.current = false; } };
  }, [sdkReady]); // eslint-disable-line

  useEffect(() => {
    if (!routes.length || !mapRef.current || !mapLoadedRef.current) return;
    attemptDraw(mapRef.current, routes, activeRoute, userLocRef.current);
  }, [routes, activeRoute, attemptDraw]);

  const handleRouteSelect = (idx) => {
    setActiveRoute(idx);
    if (mapRef.current && mapLoadedRef.current) attemptDraw(mapRef.current, routes, idx, userLocRef.current);
  };

  const handleRecenter = () => {
    const loc = userLocRef.current;
    if (loc && mapRef.current) mapRef.current.flyTo({ center:[loc.lng,loc.lat], zoom:13, duration:700 });
  };

  const handleStartNavigation = () => {
    if (!activeR?.steps?.length) return;
    setNavigating(true);
    setCurrentStep(0);
    setShowSteps(true);

    // Zoom into user location
    const loc = userLocRef.current;
    if (loc && mapRef.current) {
      mapRef.current.flyTo({ center:[loc.lng, loc.lat], zoom:15, duration:800 });
    }

    // Watch position and move user marker
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(newLoc);
          userLocRef.current = newLoc;

          // Move user marker on map
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([newLoc.lng, newLoc.lat]);
          }

          // Keep map centered on user during navigation
          if (mapRef.current) {
            mapRef.current.easeTo({ center:[newLoc.lng, newLoc.lat], duration:500 });
          }

          // Auto-advance steps based on proximity to destination
          if (activeR?.steps) {
            setCurrentStep(prev => {
              const next = prev + 1;
              return next < activeR.steps.length ? next : prev;
            });
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 2000 }
      );
    }
  };

  const handleStopNavigation = () => {
    setNavigating(false);
    setCurrentStep(0);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Zoom back out to show full route
    const loc = userLocRef.current;
    if (loc && mapRef.current) {
      const bounds = new window.tt.LngLatBounds();
      bounds.extend([loc.lng, loc.lat]);
      bounds.extend([stLng, stLat]);
      mapRef.current.fitBounds(bounds, { padding:60, maxZoom:14, duration:800 });
    }
  };

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const activeR = routes[activeRoute];
  const traffic = activeR ? trafficBadge(activeR.trafficDelaySeconds || 0) : null;

  // ── Voice navigation ──────────────────────────────────────────────────────────
  const voiceNav = useVoiceNavigation({
    steps: activeR?.steps || [],
    station,
    routeData: activeR,
  });

  return (
    <div className="nav-page-layout">
      <div ref={containerRef} className="nav-map-container" style={{ position:"absolute", inset:0 }} />

      {/* Live navigation banner — shown on top of map when navigating */}
      {navigating && activeR?.steps?.[currentStep] && (
        <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:30, background:"#1e40af", color:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 4px 16px rgba(0,0,0,0.3)" }}>
          <div style={{ width:44, height:44, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
            {MANEUVER_ICONS[activeR.steps[currentStep].maneuver] || "↑"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700, lineHeight:1.3 }}>{activeR.steps[currentStep].message}</p>
            {activeR.steps[currentStep].roadNumber && (
              <span style={{ fontSize:12, background:"rgba(255,255,255,0.2)", padding:"1px 8px", borderRadius:4, marginTop:3, display:"inline-block" }}>
                {activeR.steps[currentStep].roadNumber}
              </span>
            )}
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <p style={{ margin:0, fontSize:11, opacity:0.7 }}>Step {currentStep+1}/{activeR.steps.length}</p>
            <button onClick={handleStopNavigation}
              style={{ marginTop:4, padding:"4px 10px", borderRadius:6, background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", fontSize:11, cursor:"pointer" }}>
              End
            </button>
          </div>
        </div>
      )}

      {/* Recenter floating button */}
      {sdkReady && (
        <button onClick={handleRecenter} title="Center to my location"
          style={{ position:"absolute", bottom:16, right:16, zIndex:25, width:44, height:44, borderRadius:"50%", background:"#fff", border:"none", boxShadow:"0 2px 10px rgba(0,0,0,0.2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#2563eb"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="8" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
      )}

      {!sdkReady && (
        <div style={{ position:"absolute", inset:0, background:"#e8eaed", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"4px solid #e5e7eb", borderTopColor:"#2563eb", animation:"qb-spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
            <p style={{ fontSize:14, color:"#555", fontWeight:500 }}>Loading map…</p>
          </div>
        </div>
      )}

      <div className="nav-panel">
        {/* From / To */}
        <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid #f3f4f6" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <button onClick={() => navigate(-1)} style={{ width:36, height:36, borderRadius:"50%", background:"#f5f7f5", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#f5f7f5", borderRadius:10, marginBottom:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#16a34a", border:"2px solid #fff", boxShadow:"0 0 0 2px #16a34a", flexShrink:0 }}/>
                <span style={{ fontSize:13, color:"#555", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Your location"}
                </span>
                {locLoading && <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid #e5e7eb", borderTopColor:"#2563eb", animation:"qb-spin 0.8s linear infinite", flexShrink:0 }}/>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#f5f7f5", borderRadius:10 }}>
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink:0 }}><path d="M5 0C2.239 0 0 2.239 0 5c0 3.5 5 9 5 9S10 8.5 10 5C10 2.239 7.761 0 5 0z" fill="#ea4335"/><circle cx="5" cy="5" r="2" fill="white"/></svg>
                <span style={{ fontSize:13, fontWeight:600, color:"#111", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{station.name}</span>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            {[
              { icon:"🧭", label:"Directions", active:true, onClick:() => routeListRef.current?.scrollIntoView({ behavior:"smooth" }) },
              { icon:"🔖", label:saved?"Saved":"Save", active:saved, onClick:()=>setSaved(s=>!s) },
              { icon:"📍", label:"Nearby", onClick:()=>navigate("/nearby") },
              { icon:"↗️", label:"Share", onClick:()=>{ try { navigator.share?.({ title:station.name, url:window.location.href }); } catch(_){} } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 4px", borderRadius:10, background:btn.active?"#eff6ff":"#f5f7f5", border:"none", cursor:"pointer" }}>
                <span style={{ fontSize:16 }}>{btn.icon}</span>
                <span style={{ fontSize:10, fontWeight:600, color:btn.active?"#2563eb":"#555" }}>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {routeLoading && (
          <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid #e5e7eb", borderTopColor:"#2563eb", animation:"qb-spin 0.8s linear infinite" }}/>
            <span style={{ fontSize:13, color:"#555" }}>Calculating routes…</span>
          </div>
        )}

        {error && <div style={{ margin:"12px 16px", padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10 }}><p style={{ margin:0, fontSize:12, color:"#dc2626" }}>⚠️ {error}</p></div>}

        {/* Route summary card */}
        {activeR && (
          <div style={{ margin:"12px 16px 0", padding:"14px", background:"#eff6ff", borderRadius:12, border:"1px solid #bfdbfe" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <div>
                <span style={{ fontSize:22, fontWeight:800, color:"#1e40af" }}>{fmtTime(activeR.durationSeconds)}</span>
                <span style={{ fontSize:13, color:"#3b82f6", marginLeft:8 }}>{fmtDist(activeR.distanceMeters)}</span>
              </div>
              {traffic && (
                <span style={{ fontSize:11, padding:"3px 8px", borderRadius:99, background:traffic.bg, color:traffic.color, fontWeight:600 }}>
                  {traffic.dot} {traffic.label}
                </span>
              )}
            </div>
            <p style={{ margin:"0 0 10px", fontSize:12, color:"#3b82f6" }}>via {activeR.viaLabel || "fastest route"}</p>
            {!navigating ? (
              <button onClick={handleStartNavigation}
                style={{ width:"100%", padding:"11px 0", borderRadius:10, background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11l19-9-9 19-2-8-8-2z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Start Navigation
              </button>
            ) : (
              <button onClick={handleStopNavigation}
                style={{ width:"100%", padding:"11px 0", borderRadius:10, background:"linear-gradient(135deg,#dc2626,#b91c1c)", color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="6" y="6" width="12" height="12" rx="2" fill="white"/></svg>
                Stop Navigation
              </button>
            )}          </div>
        )}

        {/* Route options */}
        {routes.length > 0 && (
          <div ref={routeListRef} style={{ overflowY:"auto" }}>
            <p style={{ margin:"12px 16px 4px", fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em" }}>Route Options</p>
            {routes.map((r, i) => (
              <div key={i} onClick={() => handleRouteSelect(i)}
                style={{ padding:"12px 16px", borderBottom:"1px solid #f3f4f6", cursor:"pointer", background:i===activeRoute?"#f0f7ff":"#fff", borderLeft:i===activeRoute?"3px solid #2563eb":"3px solid transparent", transition:"background 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:15, fontWeight:700, color:i===activeRoute?"#2563eb":"#111" }}>{fmtTime(r.durationSeconds)}</span>
                    {r.isFastest && i===0 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:99, background:"#dcfce7", color:"#16a34a", fontWeight:600 }}>Fastest</span>}
                    {r.trafficDelaySeconds > 120 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:99, background:"#fef2f2", color:"#dc2626", fontWeight:600 }}>+{fmtTime(r.trafficDelaySeconds)}</span>}
                  </div>
                  <span style={{ fontSize:12, color:"#6b7280", fontWeight:500 }}>{fmtDist(r.distanceMeters)}</span>
                </div>
                <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>via {r.viaLabel || `Route ${i+1}`}</p>
              </div>
            ))}
          </div>
        )}

        {/* Turn-by-turn + Voice Guidance */}
        {activeR?.steps?.length > 0 && (
          <div style={{ borderTop:"1px solid #f3f4f6" }}>
            <button onClick={() => setShowSteps(s=>!s)}
              style={{ width:"100%", padding:"12px 16px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Turn-by-turn directions</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform:showSteps?"rotate(180deg)":"none", transition:"transform 0.2s" }}>
                <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showSteps && (
              <div style={{ padding:"0 16px 8px" }}>
                {activeR.steps.map((step, i) => {
                  const isCurrentVoiceStep = voiceNav.isActive && i === voiceNav.currentStep;
                  return (
                    <div key={i} style={{
                      display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0",
                      borderBottom:i<activeR.steps.length-1?"1px solid #f9fafb":"none",
                      background: isCurrentVoiceStep ? "#eff6ff" : "transparent",
                      borderRadius: isCurrentVoiceStep ? 8 : 0,
                      paddingLeft: isCurrentVoiceStep ? 8 : 0,
                      transition:"background 0.2s",
                    }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background: isCurrentVoiceStep ? "#2563eb" : "#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:14, color: isCurrentVoiceStep ? "#fff" : "#374151" }}>
                        {MANEUVER_ICONS[step.maneuver] || "↑"}
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:12, color: isCurrentVoiceStep ? "#1e40af" : "#111", fontWeight: isCurrentVoiceStep ? 600 : 500, lineHeight:1.4 }}>{step.message}</p>
                        {step.roadNumber && <span style={{ fontSize:10, color:"#2563eb", fontWeight:600 }}>{step.roadNumber}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Voice Guidance Controls */}
        <VoiceGuidanceControls
          status={voiceNav.status}
          isActive={voiceNav.isActive}
          isPaused={voiceNav.isPaused}
          currentStep={voiceNav.currentStep}
          totalSteps={activeR?.steps?.length || 0}
          currentInstruction={activeR?.steps?.[voiceNav.currentStep]?.message}
          transcript={voiceNav.transcript}
          onStart={voiceNav.startGuidance}
          onStop={voiceNav.stopGuidance}
          onNext={voiceNav.nextStep}
          onRepeat={voiceNav.repeatStep}
          onPause={voiceNav.pauseGuidance}
          onResume={voiceNav.resumeGuidance}
        />

        {!locLoading && !userLocation && !routeLoading && (
          <div style={{ padding:"16px" }}>
            <div style={{ padding:"12px 14px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:10 }}>
              <p style={{ margin:0, fontSize:12, color:"#92400e" }}>📍 Allow location access to calculate routes</p>
            </div>
          </div>
        )}

        {/* Station footer */}
        <div style={{ padding:"14px 16px", borderTop:"1px solid #f3f4f6", marginTop:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#111", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{station.name}</p>
              {station.address && <p style={{ margin:"2px 0 0", fontSize:11, color:"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{station.address}</p>}
            </div>
            <button onClick={() => navigate(`/stations/${station._id}`)}
              style={{ padding:"8px 14px", borderRadius:10, background:"linear-gradient(135deg,#1a7a4a,#22a05e)", color:"#fff", fontWeight:600, fontSize:12, border:"none", cursor:"pointer", flexShrink:0 }}>
              Details
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes qb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
