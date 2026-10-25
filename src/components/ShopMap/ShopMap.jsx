import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ShopMap.css';

const DEFAULT_CENTER = [10.3157, 123.8854];
const DEFAULT_ZOOM = 11;

const ShopMap = ({ shops = [], selectedShopId, onSelectShop }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const onSelectShopRef = useRef(onSelectShop);

  useEffect(() => {
    onSelectShopRef.current = onSelectShop;
  }, [onSelectShop]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    shops.forEach((shop) => {
      const lat = Number.parseFloat(shop.latitude);
      const lng = Number.parseFloat(shop.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const isSelected = selectedShopId === shop.id;

        const pinHtml = `
          <div class="map-pin-inner ${isSelected ? 'selected' : ''}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-map-pin',
          html: pinHtml,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'shop-popup-card';
        popupContent.innerHTML = `
          <h4>${shop.name}</h4>
          <p>${shop.address}, ${shop.city}</p>
          <span class="shop-status-badge ${shop.is_open ? 'is-open' : 'is-closed'}"><span class="shop-status-dot" aria-hidden="true"></span><span>${shop.is_open ? 'Open' : 'Closed'}</span></span>
          <div class="shop-popup-price">${shop.starting_price ? `Starts at ₱${shop.starting_price}/page` : 'Open for orders'}</div>
          <a href="/shops/${shop.id}" class="shop-popup-btn">View Shop & Print</a>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectShopRef.current) onSelectShopRef.current(shop);
        });

        markersRef.current[shop.id] = marker;
      }
    });

    return () => {
      // Keep map instance mounted between prop updates
    };
  }, [shops, selectedShopId]);

  // Center on selected shop when selectedShopId changes
  useEffect(() => {
    if (selectedShopId && markersRef.current[selectedShopId] && mapInstanceRef.current) {
      const marker = markersRef.current[selectedShopId];
      const latLng = marker.getLatLng();
      mapInstanceRef.current.setView(latLng, 14, { animate: true });
      marker.openPopup();
    }
  }, [selectedShopId]);

  return (
    <div className="shop-map-wrapper">
      <div ref={mapContainerRef} className="shop-map-container" />
    </div>
  );
};

export default ShopMap;
