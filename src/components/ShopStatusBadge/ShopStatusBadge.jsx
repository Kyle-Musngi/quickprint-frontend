import React from 'react';
import './ShopStatusBadge.css';

const ShopStatusBadge = ({ isOpen }) => (
  <span className={`shop-status-badge ${isOpen ? 'is-open' : 'is-closed'}`}>
    <span className="shop-status-dot" aria-hidden="true" />
    <span>{isOpen ? 'Open' : 'Closed'}</span>
  </span>
);

export default ShopStatusBadge;
