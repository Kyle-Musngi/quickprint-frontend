import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, Navigation, X, ArrowRight, Store, Star } from 'lucide-react';
import { shopService } from '../../services/api';
import ShopMap from '../../components/ShopMap/ShopMap';
import ShopStatusBadge from '../../components/ShopStatusBadge/ShopStatusBadge';
import { formatTime12Hour } from '../../utils/formatTime';
import './ShopDiscovery.css';

const ShopDiscovery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || 'all');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (cityFilter && cityFilter !== 'all') params.city = cityFilter;
      if (sortBy) params.sort = sortBy;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const data = await shopService.getShops(params);
      const list = Array.isArray(data) ? data : (data.results || []);
      setShops(list);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [searchQuery, cityFilter, sortBy, userLocation]);

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        alert('Could not retrieve GPS location. You can select your university city manually.');
        setGpsLoading(false);
      }
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCityFilter('all');
    setSortBy('distance');
    setUserLocation(null);
    setSearchParams({});
  };

  return (
    <div className="shop-discovery-page">
      <div className="discovery-header">
        <h1 className="discovery-title">Campus Printing Shops</h1>
        <p className="discovery-subtitle">
          Find verified partner copy shops near university hubs, compare prices, and order ahead.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="discovery-filters-bar">
        <div className="filter-search-box">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by shop name, campus, or street..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Manual Location Selection */}
        <select
          className="filter-select"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="all">All Locations</option>
          <option value="Cebu City">Cebu City</option>
          <option value="Mandaue">Mandaue</option>
        </select>

        {/* Sort Options */}
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="distance">Sort by Distance</option>
          <option value="rating">Sort by Rating</option>
          <option value="price">Sort by Starting Price</option>
          <option value="name">Sort by Shop Name</option>
        </select>

        {/* Optional GPS */}
        <button
          type="button"
          className="filter-gps-btn"
          onClick={requestGpsLocation}
          title="Use browser location to calculate real distance"
        >
          <Navigation size={16} />
          {gpsLoading ? 'Locating...' : userLocation ? 'GPS Active' : 'Use My GPS'}
        </button>

        {(searchQuery || cityFilter !== 'all' || userLocation) && (
          <button type="button" className="filter-clear-btn" onClick={clearFilters}>
            <X size={16} /> Clear Filters
          </button>
        )}
      </div>

      {/* Discovery Split View: Left List, Right Map */}
      <div className="discovery-layout">
        <div className="shops-list-column">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Searching for printing shops...
            </div>
          ) : shops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <Store size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>No printing shops found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Try adjusting your search query or selecting "All Locations".
              </p>
              <button type="button" className="view-shop-action-btn" onClick={clearFilters}>
                Reset Search
              </button>
            </div>
          ) : (
            shops.map((shop) => {
              const isSelected = selectedShopId === shop.id;
              return (
                <div
                  key={shop.id}
                  className={`shop-card-interactive ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <div className="shop-card-top">
                    <div className="shop-card-title-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3>{shop.name}</h3>
                        {shop.review_count > 0 ? (
                          <div className="shop-discovery-rating">
                            <Star size={13} className="star-icon-filled" />
                            <span className="rating-score">{Number(shop.average_rating).toFixed(1)}</span>
                            <span className="rating-count">({shop.review_count})</span>
                          </div>
                        ) : (
                          <div className="shop-discovery-rating unrated">
                            <span>No reviews yet</span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {shop.description || 'University printing, thesis binding, and photocopying.'}
                      </p>
                    </div>
                    <ShopStatusBadge isOpen={shop.is_open} />
                  </div>

                  <div className="shop-card-info-row">
                    <div className="shop-card-info-item">
                      <MapPin size={15} style={{ color: 'var(--primary-blue)' }} />
                      <span>{shop.address}, {shop.city}</span>
                    </div>
                    <div className="shop-card-info-item">
                      <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatTime12Hour(shop.opening_time)} - {formatTime12Hour(shop.closing_time)}</span>
                    </div>
                    {shop.distance_km !== null && (
                      <div className="shop-card-info-item" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
                        <Navigation size={14} />
                        <span>{shop.distance_km} km away</span>
                      </div>
                    )}
                  </div>

                  {shop.services_summary && shop.services_summary.length > 0 && (
                    <div className="shop-services-tags">
                      {shop.services_summary.map((srv, idx) => (
                        <span key={idx} className="service-tag">{srv}</span>
                      ))}
                    </div>
                  )}

                  <div className="shop-card-bottom">
                    <div className="starting-price-box">
                      <span className="starting-price-label">Starting Price</span>
                      <span className="starting-price-num">
                        {shop.starting_price ? `₱${shop.starting_price}/page` : '₱1.50/page'}
                      </span>
                    </div>
                    <Link
                      to={`/shops/${shop.id}`}
                      className="view-shop-action-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Shop & Print <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map Column */}
        <div className="map-column">
          <ShopMap
            shops={shops}
            selectedShopId={selectedShopId}
            onSelectShop={(shop) => setSelectedShopId(shop.id)}
          />
        </div>
      </div>
    </div>
  );
};

export default ShopDiscovery;
