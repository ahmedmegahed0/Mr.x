import React, { useEffect, useState } from 'react';
import { getBarberBookings, BarberBookingDTO } from '../../api/barbers.api';
import './BarberDashboard.css';

export default function BarberDashboard() {
  const [bookings, setBookings] = useState<BarberBookingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodayBookings = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await getBarberBookings({
          fromDate: today,
          toDate: today,
          pageNumber: 1,
          pageSize: 50 // Assume they won't have more than 50 in a single day
        });
        
        // Sort by start time
        const sorted = data.items.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setBookings(sorted);
      } catch (err: any) {
        console.error('Failed to load today bookings', err);
        setError('Server is currently unreachable. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayBookings();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'confirmed';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  return (
    <div className="barber-dashboard">
      <header className="page-header">
        <div>
          <h1>Today's Agenda</h1>
          <p className="subtitle">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <div className="agenda-container">
        {isLoading ? (
          <div className="agenda-timeline">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="timeline-item skeleton">
                <div className="time-col skeleton-block"></div>
                <div className="details-col skeleton-block"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="agenda-timeline">
            {bookings.map((booking) => (
              <div className="timeline-item" key={booking.id}>
                <div className="time-col">
                  <span className="time-start">{booking.startTime}</span>
                  <span className="time-end">{booking.endTime}</span>
                </div>
                <div className="details-col">
                  <div className="customer-info">
                    <h3>{booking.customerName}</h3>
                    <p className="phone">{booking.customerPhone || 'No phone provided'}</p>
                  </div>
                  <div className="booking-meta">
                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="price">EGP {booking.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">🏖️</div>
            <h3>No appointments today.</h3>
            <p>Enjoy your free time or check your schedule for tomorrow.</p>
          </div>
        )}
      </div>
    </div>
  );
}
