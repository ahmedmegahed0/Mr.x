import React, { useEffect, useState, useRef } from 'react';
import { getBarberProfile, updateBookingSettings, BarberDTO } from '../../api/barbers.api';
import { uploadProfilePicture, deleteProfilePicture } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './BarberSettings.css';

export default function BarberSettings() {
  const [profile, setProfile] = useState<BarberDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings Form State
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(30);
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  
  // Profile Picture State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const { showToast } = useToast();
  const { updateProfilePictureUrl } = useAuth();

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

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPicture(true);
    try {
      await uploadProfilePicture(file);
      showToast('Profile picture updated successfully', 'success');
      // Reload profile to get the new image URL
      const data = await getBarberProfile();
      // Add a cache buster so the browser fetches the new image instead of using cache
      if (data.profilePictureUrl) {
        const newUrl = `${data.profilePictureUrl}?t=${Date.now()}`;
        data.profilePictureUrl = newUrl;
        updateProfilePictureUrl(newUrl); // Update global auth context
      }
      setProfile(data);
    } catch (err: any) {
      showToast('Failed to upload picture', 'error');
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    setIsUploadingPicture(true);
    try {
      await deleteProfilePicture();
      showToast('Profile picture removed', 'success');
      if (profile) setProfile({ ...profile, profilePictureUrl: '' });
    } catch (err: any) {
      showToast('Failed to remove picture', 'error');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (isLoading) {
    return <div className="barber-settings skeleton">Loading settings...</div>;
  }

  return (
    <div className="barber-settings">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">Manage your profile, availability, and preferences.</p>
      </header>

      {/* ── PROFILE PICTURE PANEL ── */}
      <div className="settings-card">
        <h2>Profile Picture</h2>
        <p className="help-text" style={{ marginBottom: '1.5rem' }}>This picture will be shown to customers on the booking page.</p>
        
        <div className="profile-picture-section">
          <div className="profile-picture-preview">
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl} alt={profile.fullName} />
            ) : (
              <div className="profile-picture-placeholder">
                <span style={{ fontSize: '2.5rem' }}>📸</span>
              </div>
            )}
          </div>
          
          <div className="profile-picture-actions">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePictureUpload}
              disabled={isUploadingPicture}
            />
            
            <button 
              className="btn-primary" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPicture}
            >
              {isUploadingPicture ? 'Uploading...' : 'Upload New Picture'}
            </button>
            
            {profile?.profilePictureUrl && (
              <button 
                className="btn-danger-text" 
                onClick={handleDeletePicture}
                disabled={isUploadingPicture}
                style={{ marginLeft: '1rem', background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}
              >
                Remove Picture
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── BOOKING SETTINGS PANEL ── */}
      <div className="settings-card" style={{ marginTop: '2rem' }}>
        <h2>Booking Settings</h2>
        <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
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
