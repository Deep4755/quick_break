/**
 * TomTomMap — polished reusable TomTom map component.
 *
 * Props:
 *   center           { lat, lng }   — map center (controlled)
 *   zoom             number         — initial zoom (default 12)
 *   stations         array          — nearby station objects
 *   userLocation     { lat, lng }   — blue pulsing dot
 *   selectedStationId string        — highlights that station marker
 *   onStationClick   (station, action) — "details" | "navigate"
 *   onNavigate       (station)      — navigate button in popup
 *   onMarkerClick    (station)      — fired when any marker is clicked (for card sync)
 *   height           string         — CSS height (default "420px")
 */

import { useEffect, useRef, useState } from "react";

const SDK_JS  = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js";
const SDK_CSS = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css";

// ── Singleton SDK loader ───────────────────────────────────────────────────────
let sdkPromise = null;
function loadSDK() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.tt) { resolve(); return; }
    if (!document.querySelector(`link[href="${SDK_CSS}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = SDK_CSS;
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = SDK_JS; s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load TomTom SDK"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

// ── Marker factories ───────────────────────────────────────────────────────────

/** Blue pulsing dot — user location */
function makeUserMarker() {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:22px;height:22px";

  // Pulse ring
  const pulse = document.createElement("div");
  pulse.style.cssText = `
    position:absolute;inset:-6px;border-radius:50%;
    background:rgba(59,130,246,0.2);
    animation:qb-pulse 2s ease-out infinite;
  `;

  // Core dot
  const dot = document.createElement("div");
  dot.style.cssText = `
    position:absolute;inset:0;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(59,130,246,0.5);
  `;

  wrap.appendChild(pulse);
  wrap.appendChild(dot);
  return wrap;
}

/** Green teardrop pin — station */
function makeStationMarker(selected = false) {
  const size   = selected ? 42 : 34;
  const shadow = selected
    ? "0 4px 16px rgba(26,122,74,0.55)"
    : "0 2px 8px rgba(0,0,0,0.28)";
  const border = selected ? "3px solid #fff" : "2.5px solid #fff";
  const scale  = selected ? "scale(1.15)" : "scale(1)";

  const el = document.createElement("div");
  el.style.cssText = `
    width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
    transform:${scale} rotate(-45deg);
    background:${selected
      ? "linear-gradient(135deg,#15803d,#16a34a)"
      : "linear-gradient(135deg,#1a7a4a,#22a05e)"};
    border:${border};
    box-shadow:${shadow};
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;
  `;

  const inner = document.createElement("div");
  inner.style.cssText = "transform:rotate(45deg);display:flex;align-items:center;justify-content:center";
  inner.innerHTML = `<svg width="${selected ? 16 : 13}" height="${selected ? 16 : 13}" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
    <circle cx="12" cy="9" r="2.5" fill="${selected ? "#15803d" : "#1a7a4a"}"/>
  </svg>`;

  el.appendChild(inner);
  return el;
}

/** Popup HTML for a station */
function makePopupHTML(station) {
  const dist = station.distanceKm != null
    ? `<span style="color:#1a7a4a;font-size:12px;font-weight:600">${station.distanceKm.toFixed(1)} km away</span>`
    : "";
  const op = station.operator
    ? `<p style="color:#4b5563;font-size:12px;margin:2px 0 0">${station.operator}</p>`
    : "";
  const mw = station.motorway
    ? `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:rgba(26,122,74,0.1);color:#1a7a4a;border:1px solid rgba(26,122,74,0.2);white-space:nowrap">${station.motorway}</span>`
    : "";
  const facs = (station.facilities || []).slice(0, 3)
    .map(f => `<span style="font-size:10px;padding:1px 7px;border-radius:99px;background:#f3f4f6;color:#374151;text-transform:capitalize">${f}</span>`)
    .join("");

  return `
    <div style="min-width:200px;max-width:240px;padding:12px 14px;font-family:system-ui,sans-serif">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:6px">
        <strong style="font-size:13px;color:#111827;line-height:1.3;flex:1">${station.name}</strong>
        ${mw}
      </div>
      ${op}
      <div style="margin:6px 0;display:flex;align-items:center;justify-content:space-between">
        ${dist}
      </div>
      ${facs ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">${facs}</div>` : ""}
      <button data-action="details"
        style="width:100%;padding:7px 0;border-radius:8px;margin-bottom:5px;
               background:linear-gradient(135deg,#1a7a4a,#22a05e);
               color:#fff;font-size:12px;font-weight:600;border:none;cursor:pointer">
        View Details
      </button>
      <button data-action="navigate"
        style="width:100%;padding:7px 0;border-radius:8px;
               background:#f5f7f5;border:1px solid #e5e7eb;
               color:#374151;font-size:12px;font-weight:600;cursor:pointer;
               display:flex;align-items:center;justify-content:center;gap:5px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Navigate
      </button>
    </div>`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function TomTomMap({
  center = { lat: 51.5074, lng: -0.1278 },
  zoom = 12,
  stations = [],
  userLocation = null,
  selectedStationId = null,
  onStationClick = null,
  onNavigate = null,
  onMarkerClick = null,
  height = "420px",
}) {
  const containerRef      = useRef(null);
  const mapRef            = useRef(null);
  const userMarkerRef     = useRef(null);
  const markersMapRef     = useRef({});   // stationId → { marker, el, popup }
  const [ready, setReady] = useState(false);
  const [err,   setErr]   = useState(null);

  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

  // ── Load SDK ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiKey) { setErr("VITE_TOMTOM_API_KEY is not set."); return; }
    loadSDK().then(() => setReady(true)).catch(e => setErr(e.message));
  }, [apiKey]);

  // ── Init map + controls ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    try {
      const map = window.tt.map({
        key: apiKey,
        container: containerRef.current,
        center: [center.lng, center.lat],
        zoom,
      });
      mapRef.current = map;

      // Native zoom controls (top-right)
      map.addControl(new window.tt.NavigationControl({ showZoom: true, showCompass: false }), "top-right");

      // ── Recenter button ──────────────────────────────────────────────────
      const RecenterControl = {
        onAdd(m) {
          this._map = m;
          this._container = document.createElement("div");
          this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
          const btn = document.createElement("button");
          btn.title = "Re-center on my location";
          btn.style.cssText = "width:29px;height:29px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#fff;border:none;border-radius:4px";
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#3b82f6"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="8" stroke="#3b82f6" stroke-width="1.5" fill="none"/>
          </svg>`;
          btn.onclick = () => {
            if (userMarkerRef.current) {
              const lngLat = userMarkerRef.current.getLngLat();
              m.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 13, duration: 800 });
            }
          };
          this._container.appendChild(btn);
          return this._container;
        },
        onRemove() { this._container.parentNode?.removeChild(this._container); },
      };
      map.addControl(RecenterControl, "top-right");

    } catch (e) {
      setErr("Map failed to initialise: " + e.message);
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-centre ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ center: [center.lng, center.lat], duration: 400 });
  }, [center.lat, center.lng]);

  // ── User location marker ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    userMarkerRef.current = new window.tt.Marker({ element: makeUserMarker(), anchor: "center" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new window.tt.Popup({ offset: 20 }).setHTML(
        `<div style="padding:7px 11px;font-size:12px;font-weight:600;color:#111827">📍 Your location</div>`
      ))
      .addTo(mapRef.current);
  }, [userLocation]);

  // ── Station markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    Object.values(markersMapRef.current).forEach(({ marker }) => marker.remove());
    markersMapRef.current = {};

    stations.forEach(station => {
      if (!station.location?.coordinates) return;
      const [lng, lat] = station.location.coordinates;
      const isSelected = station._id === selectedStationId;

      const el = makeStationMarker(isSelected);

      const popup = new window.tt.Popup({
        offset: [0, -20],
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
      }).setHTML(makePopupHTML(station));

      popup.on("open", () => {
        const el2 = popup.getElement();
        const detailsBtn = el2?.querySelector("[data-action='details']");
        const navBtn     = el2?.querySelector("[data-action='navigate']");
        if (detailsBtn && onStationClick) detailsBtn.onclick = () => onStationClick(station, "details");
        if (navBtn && onNavigate)         navBtn.onclick     = () => onNavigate(station);
      });

      const marker = new window.tt.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      // Click on marker → notify parent for card sync
      el.addEventListener("click", () => {
        if (onMarkerClick) onMarkerClick(station);
      });

      markersMapRef.current[station._id] = { marker, el, popup };
    });
  }, [stations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlight selected station without re-creating all markers ──────────────
  useEffect(() => {
    Object.entries(markersMapRef.current).forEach(([id, { el }]) => {
      const isSelected = id === selectedStationId;
      const size   = isSelected ? 42 : 34;
      const shadow = isSelected ? "0 4px 16px rgba(26,122,74,0.55)" : "0 2px 8px rgba(0,0,0,0.28)";
      const border = isSelected ? "3px solid #fff" : "2.5px solid #fff";
      const scale  = isSelected ? "scale(1.15)" : "scale(1)";
      const bg     = isSelected
        ? "linear-gradient(135deg,#15803d,#16a34a)"
        : "linear-gradient(135deg,#1a7a4a,#22a05e)";
      el.style.width  = `${size}px`;
      el.style.height = `${size}px`;
      el.style.transform = `${scale} rotate(-45deg)`;
      el.style.background = bg;
      el.style.boxShadow  = shadow;
      el.style.border     = border;
    });

    // Fly to selected station and open its popup
    if (selectedStationId && markersMapRef.current[selectedStationId]) {
      const { marker } = markersMapRef.current[selectedStationId];
      const lngLat = marker.getLngLat();
      mapRef.current?.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 13, duration: 600 });
      marker.togglePopup();
    }
  }, [selectedStationId]);

  // ── Pulse CSS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("qb-map-styles")) return;
    const style = document.createElement("style");
    style.id = "qb-map-styles";
    style.textContent = `
      @keyframes qb-pulse {
        0%   { transform: scale(1);   opacity: 0.7; }
        70%  { transform: scale(2.2); opacity: 0; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      @keyframes qb-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (err) {
    return (
      <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center",
                    background:"#f5f7f5", borderRadius:12, border:"1px solid #e5e7eb" }}>
        <div style={{ textAlign:"center", padding:24 }}>
          <p style={{ fontSize:32, marginBottom:8 }}>🗺️</p>
          <p style={{ fontWeight:600, color:"#1a1a1a", marginBottom:4 }}>Map unavailable</p>
          <p style={{ fontSize:12, color:"#6b7280" }}>{err}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center",
                    background:"#f5f7f5", borderRadius:12, border:"1px solid #e5e7eb" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid #e5e7eb",
                        borderTopColor:"#1a7a4a", animation:"qb-spin 0.8s linear infinite", margin:"0 auto 10px" }} />
          <p style={{ fontSize:13, color:"#4b5563" }}>Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width:"100%", height, borderRadius:12, overflow:"hidden" }} />
  );
}
