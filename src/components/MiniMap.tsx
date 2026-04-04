"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Custom Markers (More Attractive & Differentiating) ──
const createUserIcon = () => L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-40"></div>
      <div class="relative w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center">
        <div class="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
      </div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createTargetIcon = () => L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex flex-col items-center animate-float">
      <div class="w-10 h-10 bg-emerald-600 rounded-full shadow-[0_12px_24px_rgba(5,150,105,0.5)] border-2 border-white flex items-center justify-center text-white relative z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <!-- High-Contrast 3D Shadow (Deep Indigo for Sunshine feel) -->
      <div class="w-6 h-2 bg-indigo-900/20 rounded-full mt-1.5 blur-[3px] animate-shadow-pulse"></div>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 44],
});

L.Marker.prototype.options.icon = createUserIcon();

interface MiniMapProps {
  lat: number;
  lng: number;
  markerLat?: number | null;
  markerLng?: number | null;
  zoom?: number;
  showUserMarker?: boolean;
}

// ── Helper Component to auto-center map ──
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MiniMap: React.FC<MiniMapProps> = ({ lat, lng, markerLat, markerLng, zoom = 15, showUserMarker = true }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="w-full h-56 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-gray-400">Loading Map...</div>;

  return (
    <div className="w-full h-56 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-[0_30px_70px_-15px_rgba(5,150,105,0.25)] group relative perspective-container">
      <div className="w-full h-full transform-3d-tilt transition-transform duration-700 group-hover:rotate-x-0 relative">
        <MapContainer 
          center={[lat, lng]} 
          zoom={zoom} 
          scrollWheelZoom={false}
          dragging={true}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full z-0"
        >
          {/* Modern Tile Layer: CartoDB Voyager with Vibrant Theme Filter */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            className="map-tiles-3d-filter"
          />
          
          {showUserMarker && (
            <Marker position={[lat, lng]} icon={createUserIcon()}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {markerLat && markerLng && (
            <Marker position={[markerLat, markerLng]} icon={createTargetIcon()}>
              <Popup>Target Location</Popup>
            </Marker>
          )}

          <ChangeView center={[markerLat || lat, markerLng || lng]} zoom={zoom} />
        </MapContainer>

        {/* 3D Vignette Overlay for Depth Isolation */}
        <div className="absolute inset-0 z-[400] pointer-events-none shadow-[inset_0_0_80px_rgba(255,255,255,0.4)] transition-opacity duration-700 group-hover:opacity-0" />
      </div>

      <style jsx global>{`
        /* 3D Perspective Container */
        .perspective-container {
          perspective: 1200px;
          background: #ffffff;
        }

        /* The 3D Tilt Effect - Aggressive 22deg for Visibility */
        .transform-3d-tilt {
          transform: rotateX(22deg) translateY(-10px) scale(1.1);
          transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .perspective-container:hover .transform-3d-tilt {
          transform: rotateX(0deg) translateY(0) scale(1);
        }

        /* High-Definition Eye-Catching Filter */
        .map-tiles-3d-filter {
          filter: saturate(1.6) contrast(1.15) brightness(1.02) hue-rotate(-8deg);
        }

        /* 3D Floating Animation for Markers */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }

        /* Dynamic Marker Shadow */
        @keyframes shadow-pulse {
          0%, 100% { transform: scale(1.2); opacity: 0.25; }
          50% { transform: scale(0.6); opacity: 0.1; }
        }
        .animate-shadow-pulse {
          animation: shadow-pulse 2.5s ease-in-out infinite;
        }

        .leaflet-marker-icon {
          background: transparent !important;
          border: none !important;
        }

        /* Smooth Tile Fade-in */
        .leaflet-tile-pane {
          animation: fade-in 1.2s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MiniMap;
