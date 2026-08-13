import React, { useEffect, useState } from 'react';
import { getBarberProfile, updateBookingSettings, BarberDTO } from '../../api/barbers.api';
import { useToast } from '../../context/ToastContext';
import './BarberSettings.css';

export default function BarberSettings() {
  const [profile, setProfile] = useState<BarberDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings Form State
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(30);
  const [acceptingBookings, setAcceptingBookings] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getBarberProfile();
        setProfile(data);
        setBookingDurationMinutes(data.bookingDurationMinutes);
        setAcceptingBookings(data.acceptingBookings);
      } catch (err: any) {
        if (err.code === 'ERR_NETWORK') {
          showToast('Server is currently offline. Cannot load settings.', 'error');
        } else {
          showToast('Failed to load profile', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBookingSettings({
        bookingDurationMinutes,
        acceptingBookings
      });
      showToast('Settings saved successfully', 'success');
      
      // Update local profile state
      if (profile) {
        setProfile({ ...profile, bookingDurationMinutes, acceptingBookings });
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        showToast('Service is currently unavailable. Please try again later.', 'error');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="barber-settings skeleton">Loading settings...</div>;
  }

  return (
    <div className="barber-settings">
      <header className="page-header">
        <h1>Booking Settings</h1>
        <p className="subtitle">Manage your availability and slot configurations.</p>
      </header>

      <div className="settings-card">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="duration">Slot Duration (Minutes)</label>
            <p className="help-text">How long does an average appointment take?</p>
            <select 
              id="duration"
              value={bookingDurationMinutes}
              onChange={(e) => setBookingDurationMinutes(Number(e.target.value))}
              disabled={isSaving}
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes (1 Hour)</option>
              <option value={90}>90 Minutes (1.5 Hours)</option>
              <option value={120}>120 Minutes (2 Hours)</option>
            </select>
          </div>

          <div className="form-group toggle-group">
            <div>
              <label htmlFor="accepting">Accepting Bookings</label>
              <p className="help-text">Turn this off if you are on vacation or unavailable.</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                id="accepting"
                checked={acceptingBookings}
                onChange={(e) => setAcceptingBookings(e.target.checked)}
                disabled={isSaving}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSaving || (profile?.bookingDurationMinutes === bookingDurationMinutes && profile?.acceptingBookings === acceptingBookings)}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
