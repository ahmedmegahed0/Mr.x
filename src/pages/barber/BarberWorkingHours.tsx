import React, { useEffect, useState } from 'react';
import { getBarberProfile, updateWorkingHours, WorkingHour } from '../../api/barbers.api';
import { useToast } from '../../context/ToastContext';
import './BarberWorkingHours.css';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function BarberWorkingHours() {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getBarberProfile();
        
        // Ensure we have exactly 7 days
        const initializedHours: WorkingHour[] = DAYS_OF_WEEK.map((_, index) => {
          const existing = data.workingHours?.find(wh => wh.dayOfWeek === index);
          return existing || {
            dayOfWeek: index,
            openingTime: '09:00',
            closingTime: '17:00',
            isClosed: false
          };
        });
        
        setWorkingHours(initializedHours);
      } catch (err: any) {
        if (err.code === 'ERR_NETWORK') {
          showToast('Server is currently offline. Cannot load working hours.', 'error');
        } else {
          showToast('Failed to load working hours', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleToggleDay = (dayIndex: number, isClosed: boolean) => {
    setWorkingHours(prev => prev.map(wh => 
      wh.dayOfWeek === dayIndex ? { ...wh, isClosed } : wh
    ));
  };

  const handleTimeChange = (dayIndex: number, field: 'openingTime' | 'closingTime', value: string) => {
    setWorkingHours(prev => prev.map(wh => 
      wh.dayOfWeek === dayIndex ? { ...wh, [field]: value } : wh
    ));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Validate times
    const hasError = workingHours.some(wh => {
      if (!wh.isClosed) {
        return wh.openingTime >= wh.closingTime;
      }
      return false;
    });

    if (hasError) {
      showToast('Opening time must be before closing time.', 'error');
      setIsSaving(false);
      return;
    }

    try {
      // Format times to HH:mm:ss for backend if needed, or backend might accept HH:mm. 
      // Assuming backend accepts HH:mm.
      const payload = workingHours.map(wh => ({
        ...wh,
        openingTime: wh.openingTime.length === 5 ? `${wh.openingTime}:00` : wh.openingTime,
        closingTime: wh.closingTime.length === 5 ? `${wh.closingTime}:00` : wh.closingTime,
      }));

      await updateWorkingHours({ workingHours: payload });
      showToast('Working hours saved successfully', 'success');
    } catch (err: any) {
      console.error('Save working hours error:', err);
      if (err.code === 'ERR_NETWORK') {
        showToast('Service is currently unavailable. Please try again later.', 'error');
      } else {
        const resData = err.response?.data;
        let errMsg = 'Failed to save working hours';
        if (typeof resData === 'string' && resData) errMsg = resData;
        else if (resData?.message) errMsg = resData.message;
        else if (resData?.title) {
          errMsg = resData.title;
          if (resData.errors) {
            const firstErr = Object.values(resData.errors)[0] as string[];
            if (firstErr && firstErr.length > 0) errMsg += ': ' + firstErr[0];
          }
        }
        showToast(errMsg, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="working-hours skeleton">Loading working hours...</div>;
  }

  return (
    <div className="working-hours">
      <header className="page-header">
        <h1>Working Hours</h1>
        <p className="subtitle">Set your weekly availability schedule.</p>
      </header>

      <form className="hours-container" onSubmit={handleSave}>
        {workingHours.map((wh) => (
          <div className={`day-row ${wh.isClosed ? 'closed' : ''}`} key={wh.dayOfWeek}>
            <div className="day-name">
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={!wh.isClosed}
                  onChange={(e) => handleToggleDay(wh.dayOfWeek, !e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="name">{DAYS_OF_WEEK[wh.dayOfWeek]}</span>
            </div>

            <div className="time-inputs">
              {wh.isClosed ? (
                <div className="closed-label">Day Off</div>
              ) : (
                <>
                  <input 
                    type="time" 
                    value={wh.openingTime.substring(0, 5)} 
                    onChange={(e) => handleTimeChange(wh.dayOfWeek, 'openingTime', e.target.value)}
                    required
                  />
                  <span className="separator">to</span>
                  <input 
                    type="time" 
                    value={wh.closingTime.substring(0, 5)} 
                    onChange={(e) => handleTimeChange(wh.dayOfWeek, 'closingTime', e.target.value)}
                    required
                  />
                </>
              )}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}
