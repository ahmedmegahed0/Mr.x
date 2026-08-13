import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBarberById, getBarberAvailability, BarberDTO, AvailabilitySlot } from '../../api/barbers.api';
import './BarberProfile.css';
import { useAuth } from '../../context/AuthContext';

export default function BarberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [barber, setBarber] = useState<BarberDTO | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  
  const [isLoadingBarber, setIsLoadingBarber] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBarber = async () => {
      setIsLoadingBarber(true);
      try {
        const data = await getBarberById(id);
        setBarber(data);
      } catch (err: any) {
        console.error('Failed to load barber profile', err);
        setError('Barber not found or currently unavailable.');
      } finally {
        setIsLoadingBarber(false);
      }
    };
    fetchBarber();
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlot(null);
      try {
        const data = await getBarberAvailability(id, selectedDate);
        setSlots(data);
      } catch (err: any) {
        console.error('Failed to load availability', err);
        setSlotsError('Unable to load availability for this date.');
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [id, selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleBookSlot = () => {
    if (!selectedSlot || !barber) return;
    
    const pendingBooking = {
      barberId: barber.id,
      bookingDate: selectedDate,
      startTime: selectedSlot.startTime,
      serviceIds: [] // To be selected in the next step
    };
    
    sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
    
    if (isAuthenticated) {
      navigate(`/book/services`);
    } else {
      navigate('/login');
    }
  };

  if (isLoadingBarber) {
    return (
      <div className="barber-profile-container loading">
        <div className="skeleton-header"></div>
        <div className="skeleton-body"></div>
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div className="barber-profile-container error">
        <h2>{error}</h2>
        <button className="btn-secondary" onClick={() => navigate('/barbers')}>Back to Barbers</button>
      </div>
    );
  }

  return (
    <div className="barber-profile-container">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          {barber.profilePictureUrl ? (
            <img src={barber.profilePictureUrl} alt={barber.fullName} className="profile-image" />
          ) : (
            <div className="profile-image-placeholder">
              {barber.fullName.charAt(0)}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{barber.fullName}</h1>
          <div className="profile-status">
            <span className={`status-dot ${barber.acceptingBookings ? 'active' : 'inactive'}`}></span>
            <span className="status-text">
              {barber.acceptingBookings ? 'Accepting Bookings' : 'Fully Booked'}
            </span>
          </div>
          <p className="profile-duration">Slot Duration: {barber.bookingDurationMinutes} mins</p>
        </div>
      </div>

      <div className="booking-section">
        <h2>Select an Appointment</h2>
        <p className="booking-subtitle">Choose a date and time that works for you.</p>

        <div className="date-picker-wrapper">
          <label htmlFor="date">Date</label>
          <input 
            type="date" 
            id="date"
            value={selectedDate} 
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]} // Cannot pick past dates
            disabled={!barber.acceptingBookings}
          />
        </div>

        <div className="slots-container">
          {!barber.acceptingBookings ? (
            <div className="slots-message warning">
              This barber is currently not accepting new bookings.
            </div>
          ) : isLoadingSlots ? (
            <div className="slots-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="slot-btn skeleton"></div>
              ))}
            </div>
          ) : slotsError ? (
            <div className="slots-message error">{slotsError}</div>
          ) : slots.length > 0 ? (
            <div className="slots-grid">
              {slots.map((slot, index) => {
                const isSelected = selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={index}
                    className={`slot-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="slots-message">
              No available slots on this date.
            </div>
          )}
        </div>

        {selectedSlot && barber.acceptingBookings && (
          <div className="booking-action">
            <div className="selected-summary">
              Selected: <strong>{new Date(selectedDate).toLocaleDateString()}</strong> at <strong>{selectedSlot.startTime}</strong>
            </div>
            <button className="btn-primary btn-confirm-booking" onClick={handleBookSlot}>
              Continue to Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
