import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import { shopService } from '../../services/api';
import { formatTime12Hour } from '../../utils/formatTime';
import './ShopSettings.css';

// 12-Hour Formatted Time Options (every 30 mins)
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const timeVal = `${hh}:${mm}:00`;
    TIME_OPTIONS.push({
      value: timeVal,
      label: formatTime12Hour(timeVal)
    });
  }
}

const DAYS_META = [
  { day_of_week: 0, name: 'Monday' },
  { day_of_week: 1, name: 'Tuesday' },
  { day_of_week: 2, name: 'Wednesday' },
  { day_of_week: 3, name: 'Thursday' },
  { day_of_week: 4, name: 'Friday' },
  { day_of_week: 5, name: 'Saturday' },
  { day_of_week: 6, name: 'Sunday' }
];

const ShopSettings = () => {
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [hoursSuccess, setHoursSuccess] = useState('');
  const [hoursError, setHoursError] = useState('');

  // General Shop Information
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone_number: '',
    address: '',
    city: '',
    pickup_slot_interval_minutes: 30,
    slot_capacity: 5,
  });

  const [shop, setShop] = useState(null);

  // Operating Hours (Mon - Sun): Pre-populated with all 7 days
  const buildDefaultSchedules = () => DAYS_META.map(d => ({
    day_of_week: d.day_of_week,
    day_name: d.name,
    is_open: d.day_of_week < 6, // Mon - Sat open by default
    opening_time: '07:30:00',
    closing_time: '19:30:00',
  }));

  const [schedules, setSchedules] = useState(buildDefaultSchedules);
  const [originalSchedules, setOriginalSchedules] = useState(buildDefaultSchedules);
  const [dayErrors, setDayErrors] = useState({});

  useEffect(() => {
    Promise.all([
      shopService.getMyShop(),
      shopService.getShopOperatingHours()
    ])
      .then(([shopData, hoursData]) => {
        if (shopData) {
          setShop(shopData);
          setFormData({
            name: shopData.name || '',
            description: shopData.description || '',
            phone_number: shopData.phone_number || '',
            address: shopData.address || '',
            city: shopData.city || 'Cebu City',
            pickup_slot_interval_minutes: shopData.pickup_slot_interval_minutes || 30,
            slot_capacity: shopData.slot_capacity || 5,
          });
        }

        // Ensure all 7 days are represented and merged with saved hours
        const list = Array.isArray(hoursData) ? hoursData : [];
        const map = new Map(list.map(item => [item.day_of_week, item]));
        const fullList = DAYS_META.map(d => {
          const found = map.get(d.day_of_week);
          return {
            day_of_week: d.day_of_week,
            day_name: d.name,
            is_open: found ? found.is_open : d.day_of_week < 6,
            opening_time: found ? found.opening_time : '07:30:00',
            closing_time: found ? found.closing_time : '19:30:00',
          };
        });

        setSchedules(fullList);
        setOriginalSchedules(JSON.parse(JSON.stringify(fullList)));
      })
      .catch((err) => {
        console.error('Failed to load shop settings:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGeneralChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGeneralSave = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    setGeneralSuccess('');
    try {
      const updated = await shopService.updateMyShop(formData);
      setShop(updated);
      setGeneralSuccess('Shop profile updated successfully!');
      setTimeout(() => setGeneralSuccess(''), 3500);
    } catch {
      alert('Failed to update shop details.');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    setSchedules(prev => prev.map(s => {
      if (s.day_of_week === dayOfWeek) {
        return { ...s, is_open: !s.is_open };
      }
      return s;
    }));
    // Clear validation error on toggle
    setDayErrors(prev => ({ ...prev, [dayOfWeek]: null }));
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setSchedules(prev => prev.map(s => {
      if (s.day_of_week === dayOfWeek) {
        return { ...s, [field]: value };
      }
      return s;
    }));
    setDayErrors(prev => ({ ...prev, [dayOfWeek]: null }));
  };

  // Shortcuts
  const applyMondayToAllOpen = () => {
    const monday = schedules.find(s => s.day_of_week === 0);
    if (!monday) return;
    setSchedules(prev => prev.map(s => {
      if (s.is_open) {
        return {
          ...s,
          opening_time: monday.opening_time,
          closing_time: monday.closing_time
        };
      }
      return s;
    }));
    setHoursSuccess('Applied Monday schedule to all open days.');
    setTimeout(() => setHoursSuccess(''), 3000);
  };

  const setPresetSchedule = (pattern) => {
    setSchedules(prev => prev.map(s => {
      let isOpen = false;
      if (pattern === 'mon-fri') isOpen = s.day_of_week >= 0 && s.day_of_week <= 4;
      if (pattern === 'mon-sat') isOpen = s.day_of_week >= 0 && s.day_of_week <= 5;
      if (pattern === 'all-week') isOpen = true;
      return { ...s, is_open: isOpen };
    }));
  };

  const handleResetHours = () => {
    setSchedules(JSON.parse(JSON.stringify(originalSchedules)));
    setDayErrors({});
    setHoursError('');
    setHoursSuccess('Reset schedule changes to previous saved values.');
    setTimeout(() => setHoursSuccess(''), 3000);
  };

  const validateHours = () => {
    const errors = {};
    let isValid = true;

    schedules.forEach(s => {
      if (s.is_open) {
        if (!s.opening_time || !s.closing_time) {
          errors[s.day_of_week] = 'Opening and closing times are required.';
          isValid = false;
        } else if (s.opening_time === s.closing_time) {
          errors[s.day_of_week] = 'Opening and closing times cannot be identical.';
          isValid = false;
        }
      }
    });

    setDayErrors(errors);
    return isValid;
  };

  const handleSaveHours = async () => {
    setHoursError('');
    setHoursSuccess('');

    if (!validateHours()) {
      setHoursError('Please correct the highlighted operating schedule errors.');
      return;
    }

    setSavingHours(true);
    try {
      const payload = schedules.map(s => ({
        day_of_week: s.day_of_week,
        is_open: s.is_open,
        opening_time: s.opening_time,
        closing_time: s.closing_time,
      }));

      const res = await shopService.updateShopOperatingHours(payload);
      const list = Array.isArray(res) ? res : [];
      const map = new Map(list.map(item => [item.day_of_week, item]));
      const fullList = DAYS_META.map(d => {
        const found = map.get(d.day_of_week);
        return {
          day_of_week: d.day_of_week,
          day_name: d.name,
          is_open: found ? found.is_open : false,
          opening_time: found ? found.opening_time : '07:30:00',
          closing_time: found ? found.closing_time : '19:30:00',
        };
      });
      setSchedules(fullList);
      setOriginalSchedules(JSON.parse(JSON.stringify(fullList)));
      setHoursSuccess('Weekly operating schedule saved successfully! Public shop cards and pickup slots have been updated.');
      setTimeout(() => setHoursSuccess(''), 4000);
    } catch (err) {
      setHoursError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save operating schedule.');
    } finally {
      setSavingHours(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading shop settings...</div>;
  }

  return (
    <div className="shop-settings-page">
      {/* 1. Operating Hours Section */}
      <div className="settings-card" id="operating-hours">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Clock size={24} style={{ color: 'var(--primary-blue)' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-blue)', margin: 0 }}>
            Operating Hours & Weekly Schedule
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Select the days your printing shop is open and set custom opening and closing times. Times are displayed in standard 12-hour format for student readability.
        </p>

        {hoursSuccess && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.85rem 1rem', borderRadius: 8, marginBottom: '1.25rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {hoursSuccess}
          </div>
        )}

        {hoursError && (
          <div style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '0.85rem 1rem', borderRadius: 8, marginBottom: '1.25rem', fontWeight: 600, border: '1px solid #FCA5A5' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {hoursError}
          </div>
        )}

        {/* Shortcuts Bar */}
        <div className="hours-shortcuts-bar">
          <span className="shortcut-label">Schedule Shortcuts:</span>
          <button type="button" className="btn-shortcut" onClick={() => setPresetSchedule('mon-sat')}>
            Mon – Sat Open (Sun Closed)
          </button>
          <button type="button" className="btn-shortcut" onClick={() => setPresetSchedule('mon-fri')}>
            Mon – Fri Open (Weekends Closed)
          </button>
          <button type="button" className="btn-shortcut" onClick={() => setPresetSchedule('all-week')}>
            Open All 7 Days
          </button>
          <button type="button" className="btn-shortcut" onClick={applyMondayToAllOpen}>
            Copy Monday Hours to All Open Days
          </button>
        </div>

        {/* Weekly Schedule Table */}
        <div className="hours-table-container">
          <table className="hours-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Day</th>
                <th style={{ width: '20%' }}>Status</th>
                <th style={{ width: '27%' }}>Opening Time</th>
                <th style={{ width: '28%' }}>Closing Time</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((day) => {
                const isDayOpen = day.is_open;
                const error = dayErrors[day.day_of_week];

                return (
                  <tr key={day.day_of_week} className={isDayOpen ? '' : 'row-closed'}>
                    <td>
                      <div className="day-label-wrap">
                        <span className="day-name">{day.day_name}</span>
                        <span className={`day-status-pill ${isDayOpen ? 'open' : 'closed'}`}>
                          {isDayOpen ? 'Open for Orders' : 'Closed'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="hours-toggle-btn"
                        onClick={() => handleToggleDay(day.day_of_week)}
                        aria-pressed={isDayOpen}
                        aria-label={`Toggle open or closed for ${day.day_name}`}
                      >
                        <div className={`toggle-track ${isDayOpen ? 'active' : ''}`}>
                          <div className="toggle-thumb" />
                        </div>
                      </button>
                    </td>
                    <td>
                      {isDayOpen ? (
                        <>
                          <select
                            className="hours-time-select"
                            value={day.opening_time}
                            onChange={(e) => handleTimeChange(day.day_of_week, 'opening_time', e.target.value)}
                            aria-label={`${day.day_name} Opening Time`}
                          >
                            {/* If current value is not on the standard 30 min list, include it */}
                            {!TIME_OPTIONS.some(o => o.value === day.opening_time) && day.opening_time && (
                              <option value={day.opening_time}>
                                {formatTime12Hour(day.opening_time)}
                              </option>
                            )}
                            {TIME_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {error && <div className="hours-error-text">{error}</div>}
                        </>
                      ) : (
                        <span className="hours-closed-dash">—</span>
                      )}
                    </td>
                    <td>
                      {isDayOpen ? (
                        <select
                          className="hours-time-select"
                          value={day.closing_time}
                          onChange={(e) => handleTimeChange(day.day_of_week, 'closing_time', e.target.value)}
                          aria-label={`${day.day_name} Closing Time`}
                        >
                          {!TIME_OPTIONS.some(o => o.value === day.closing_time) && day.closing_time && (
                            <option value={day.closing_time}>
                              {formatTime12Hour(day.closing_time)}
                            </option>
                          )}
                          {TIME_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="hours-closed-dash">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Buttons for Operating Hours */}
        <div className="hours-actions-bar">
          <button
            type="button"
            className="home-btn-primary"
            onClick={handleSaveHours}
            disabled={savingHours}
          >
            <Save size={16} /> {savingHours ? 'Saving Schedule...' : 'Save Operating Schedule'}
          </button>
          <button
            type="button"
            className="btn-reset-hours"
            onClick={handleResetHours}
            disabled={savingHours}
          >
            <RotateCcw size={15} style={{ display: 'inline', marginRight: 6 }} /> Reset Changes
          </button>
        </div>
      </div>

      {/* 2. General Shop Profile & Pickup Limit Settings */}
      <div className="settings-card">
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>
          Shop Profile & Pickup Limits
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Manage contact details, pickup interval slots, and maximum orders allowed per counter pickup window.
        </p>

        {generalSuccess && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {generalSuccess}
          </div>
        )}

        <form onSubmit={handleGeneralSave}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Shop Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleGeneralChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows="3"
              value={formData.description}
              onChange={handleGeneralChange}
            />
          </div>

          <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                name="phone_number"
                className="form-input"
                value={formData.phone_number}
                onChange={handleGeneralChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">City / Location</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleGeneralChange}
              />
            </div>
          </div>

          <div className="settings-section-divider">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-blue)', marginBottom: '1rem' }}>
              Pickup Scheduling Capacity Limits
            </h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Pickup Slot Interval</label>
                <select
                  name="pickup_slot_interval_minutes"
                  className="form-input"
                  value={formData.pickup_slot_interval_minutes}
                  onChange={handleGeneralChange}
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Orders Allowed Per Slot</label>
                <input
                  type="number"
                  name="slot_capacity"
                  min="1"
                  max="50"
                  className="form-input"
                  value={formData.slot_capacity}
                  onChange={handleGeneralChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="home-btn-primary"
            style={{ marginTop: '2rem' }}
            disabled={savingGeneral}
          >
            <Save size={16} /> {savingGeneral ? 'Saving...' : 'Update Profile & Capacity'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopSettings;
