import React, { useState, useEffect } from 'react';
import { Printer, Save, PlusCircle, CheckCircle2 } from 'lucide-react';
import { printingService } from '../../services/api';
import './ShopServices.css';

const ShopServices = () => {
  const [rules, setRules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPrices, setSavingPrices] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('0.00');

  useEffect(() => {
    Promise.all([
      printingService.getMyShopPrices(),
      printingService.getMyShopServices(),
    ])
      .then(([rulesRes, srvRes]) => {
        setRules(rulesRes || []);
        setServices(srvRes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePriceChange = (id, newPrice) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, price_per_page: newPrice } : r))
    );
  };

  const handleAvailabilityToggle = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_available: !r.is_available } : r))
    );
  };

  const savePrices = async () => {
    setSavingPrices(true);
    setSuccessMsg('');
    try {
      const updated = await printingService.updateMyShopPrices(rules);
      setRules(updated);
      setSuccessMsg('Price matrix updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Failed to update prices.');
    } finally {
      setSavingPrices(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName) return;
    try {
      const created = await printingService.addMyShopService({
        name: newServiceName,
        description: newServiceDesc,
        base_price: parseFloat(newServicePrice) || 0.0,
      });
      setServices([...services, created]);
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServicePrice('0.00');
    } catch {
      alert('Failed to add service.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading pricing & services...</div>;
  }

  return (
    <div className="shop-services-page">
      <div className="services-header">
        <h1 className="services-title">Services & Pricing Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure authoritative page pricing for sizes, colors, and sides. New customer orders will calculate totals using these rates.
        </p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem', fontWeight: 600 }}>
          <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {successMsg}
        </div>
      )}

      {/* Pricing Matrix */}
      <div className="pricing-editor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-blue)' }}>
            Document Printing Rates
          </h2>
          <button
            type="button"
            className="home-btn-primary"
            onClick={savePrices}
            disabled={savingPrices}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
          >
            <Save size={16} /> {savingPrices ? 'Saving...' : 'Save Price Changes'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="pricing-table-editor">
            <thead>
              <tr>
                <th>Paper Size</th>
                <th>Color Mode</th>
                <th>Print Sides</th>
                <th>Price per Page / Sheet (₱)</th>
                <th>Offer this Option?</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td><strong>{rule.paper_size}</strong></td>
                  <td>{rule.color_mode === 'color' ? 'Full Color' : 'Black & White'}</td>
                  <td>{rule.print_side === 'double' ? 'Double-Sided' : 'Single-Sided'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>₱</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0.50"
                        className="price-input-mini"
                        value={rule.price_per_page}
                        onChange={(e) => handlePriceChange(rule.id, e.target.value)}
                      />
                    </div>
                  </td>
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={rule.is_available}
                        onChange={() => handleAvailabilityToggle(rule.id)}
                      />
                      <span>{rule.is_available ? 'Available' : 'Disabled'}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Services */}
      <div className="pricing-editor-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark-blue)', marginBottom: '1rem' }}>
          Custom Services (Binding, Lamination, Scanning)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {services.map((srv) => (
            <div key={srv.id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 8, background: 'var(--bg-subtle)' }}>
              <h4 style={{ color: 'var(--dark-blue)', fontWeight: 700 }}>{srv.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{srv.description}</p>
              <div style={{ fontWeight: 800, color: 'var(--primary-blue)', fontSize: '0.95rem' }}>
                Starts at ₱{parseFloat(srv.base_price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Service Form */}
        <form onSubmit={handleAddService} style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-blue)', marginBottom: '1rem' }}>
            Add New Service
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ring Binding"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Spiral ring binding with PVC cover"
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Base Fee (₱)</label>
              <input
                type="number"
                step="5"
                className="form-input"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
              />
            </div>
            <button type="submit" className="home-btn-primary" style={{ padding: '0.75rem 1.25rem', height: 'fit-content' }}>
              <PlusCircle size={16} /> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopServices;
