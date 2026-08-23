import React, { useEffect, useState } from 'react';
import { 
  getSettings, 
  updateSettings, 
  getShopHours, 
  updateShopHours,
  GlobalSettingsDTO,
  ShopWorkingHourDTO
} from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import './AdminSettings.css';

const DEFAULT_DAYS = [
  { dayOfWeek: 0, dayName: 'Sunday' },
  { dayOfWeek: 1, dayName: 'Monday' },
  { dayOfWeek: 2, dayName: 'Tuesday' },
  { dayOfWeek: 3, dayName: 'Wednesday' },
  { dayOfWeek: 4, dayName: 'Thursday' },
  { dayOfWeek: 5, dayName: 'Friday' },
  { dayOfWeek: 6, dayName: 'Saturday' },
];

export default function AdminSettings() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settings, setSettings] = useState<GlobalSettingsDTO>({
    maximumBookingAdvanceDays: 30,
    cancellationWindowHours: 24,
  });

  // Shop Hours State
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hours, setHours] = useState<ShopWorkingHourDTO[]>([]);

  useEffect(() => {
    const fetchAllSettings = async () => {
      setIsLoading(true);
      try {
        const [settingsData, hoursData] = await Promise.all([
          getSettings(),
          getShopHours()
        ]);
        
        const rawResponse = settingsData as any;
        const rawSettings = rawResponse?.data ?? rawResponse?.Data ?? rawResponse;
        setSettings({
          maximumBookingAdvanceDays: rawSettings.maximumBookingAdvanceDays ?? rawSettings.MaximumBookingAdvanceDays ?? 30,
          cancellationWindowHours: rawSettings.cancellationWindowHours ?? rawSettings.CancellationWindowHours ?? 24,
        });
        
        const extractArray = (obj: any): any[] => {
          if (!obj) return [];
          if (Array.isArray(obj)) return obj;
          if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
          if (obj.items) return extractArray(obj.items);
          if (obj.Items) return extractArray(obj.Items);
          if (obj.data) return extractArray(obj.data);
          if (obj.Data) return extractArray(obj.Data);
          if (obj.result) return extractArray(obj.result);
          if (obj.Result) return extractArray(obj.Result);
          return [];
        };
        
        const rawHoursArray = extractArray(hoursData as any);
        const mappedHours = rawHoursArray.map((h: any) => ({
          id: h.id ?? h.Id ?? 0,
          dayOfWeek: h.dayOfWeek ?? h.DayOfWeek,
          dayName: h.dayName ?? h.DayName ?? DEFAULT_DAYS.find(d => d.dayOfWeek === (h.dayOfWeek ?? h.DayOfWeek))?.dayName,
          openingTime: h.openingTime ?? h.OpeningTime ?? '09:00',
          closingTime: h.closingTime ?? h.ClosingTime ?? '21:00',
          isClosed: h.isClosed ?? h.IsClosed ?? false,
        }));
        
        // Ensure all 7 days are represented even if API returns partial data
        const completeHours = DEFAULT_DAYS.map(defaultDay => {
          const existing = mappedHours.find(h => h.dayOfWeek === defaultDay.dayOfWeek);
          return existing || {
            id: 0,
            dayOfWeek: defaultDay.dayOfWeek,
            dayName: defaultDay.dayName,
            openingTime: '09:00',
            closingTime: '21:00',
            isClosed: false
          };
        });
        
        // Sort by dayOfWeek (0-6)
        completeHours.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        setHours(completeHours);
      } catch (error: any) {
        console.error('Failed to load settings', error);
        showToast(error.response?.data?.message || error.message || 'Failed to load settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSettings();
  }, [showToast]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSettings(settings);
      showToast('Booking rules updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update booking rules', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHours(true);
    try {
      const formatTime = (time: string) => time.length === 5 ? `${time}:00` : time;
      
      const payload = {
        workingHours: hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          openingTime: formatTime(h.openingTime),
          closingTime: formatTime(h.closingTime),
          isClosed: h.isClosed
        }))
      };
      await updateShopHours(payload);
      showToast('Shop hours updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update shop hours', 'error');
    } finally {
      setIsSavingHours(false);
    }
  };

  const handleHourChange = (index: number, field: keyof ShopWorkingHourDTO, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  if (isLoading) {
    return (
      <div className="admin-settings">
        <header className="admin-page-header">
          <h1>Global Settings</h1>
        </header>
        <div className="loading-overlay">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <header className="admin-page-header">
        <h1>Global Settings</h1>
      </header>

      {/* Booking Rules Panel */}
      <div className="settings-panel">
        <div className="settings-panel-header">
          <h2>Booking Rules</h2>
          <p>Configure general boundaries for customer appointments.</p>
        </div>
        
        <form onSubmit={handleSettingsSubmit}>
          <div className="settings-form-row">
            <div className="admin-form-group">
              <label>Maximum Booking Advance (Days)</label>
              <input 
                type="number" 
                min="1" max="365"
                required
                value={settings.maximumBookingAdvanceDays}
                onChange={(e) => setSettings({ ...settings, maximumBookingAdvanceDays: Number(e.target.value) })}
              />
            </div>
            
            <div className="admin-form-group">
              <label>Cancellation Window (Hours)</label>
              <input 
                type="number" 
                min="0" max="168"
                required
                value={settings.cancellationWindowHours}
                onChange={(e) => setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={isSavingSettings}>
              {isSavingSettings ? 'Saving...' : 'Save Booking Rules'}
            </button>
          </div>
        </form>
      </div>

      {/* Shop Working Hours Panel */}
      <div className="settings-panel">
        <div className="settings-panel-header">
          <h2>Shop Working Hours</h2>
          <p>Set the standard weekly schedule. Days are mapped from Sunday (0) to Saturday (6).</p>
        </div>
        
        <form onSubmit={handleHoursSubmit}>
          <div className="hours-manager">
            {hours.map((hour, index) => (
              <div className="hour-row" key={hour.dayOfWeek}>
                <div className="hour-day-name">{hour.dayName}</div>
                
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    className="toggle-input"
                    checked={!hour.isClosed}
                    onChange={(e) => handleHourChange(index, 'isClosed', !e.target.checked)}
                  />
                  <div className="toggle-slider"></div>
                  <span className="toggle-label">{!hour.isClosed ? 'Open' : 'Closed'}</span>
                </label>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <input 
                    type="time" 
                    value={hour.openingTime.substring(0, 5)} // Extract HH:mm in case API returns seconds
                    onChange={(e) => handleHourChange(index, 'openingTime', e.target.value)}
                    disabled={hour.isClosed}
                    required={!hour.isClosed}
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <input 
                    type="time" 
                    value={hour.closingTime.substring(0, 5)} 
                    onChange={(e) => handleHourChange(index, 'closingTime', e.target.value)}
                    disabled={hour.isClosed}
                    required={!hour.isClosed}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={isSavingHours}>
              {isSavingHours ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
