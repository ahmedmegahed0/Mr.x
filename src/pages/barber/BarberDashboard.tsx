import { useEffect, useState } from 'react';
import { getBarberBookings, BarberBookingDTO } from '../../api/barbers.api';
import { updateBookingStatus, BookingStatus } from '../../api/bookings.api';
import { useToast } from '../../context/ToastContext';
import './BarberDashboard.css';

export default function BarberDashboard() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BarberBookingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchTodayBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await getBarberBookings({
        fromDate: today,
        toDate: today,
        pageNumber: 1,
        pageSize: 50,
      });
      const sorted = data.items.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setBookings(sorted);
    } catch (err: any) {
      console.error('Failed to load today bookings', err);
      setError('Server is currently unreachable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayBookings();
  }, []);

  /** Quick-change booking status (Arrived / DidNotArrive) */
  const handleStatusChange = async (bookingId: number, status: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      const label = status === BookingStatus.Arrived ? 'Arrived' : 'Did Not Arrive';
      showToast(`Booking #${bookingId} marked as ${label}`, 'success');
      // Refresh the agenda
      fetchTodayBookings();
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        showToast('Service is currently unavailable. Please try again later.', 'error');
      } else {
        showToast(`Failed to update booking #${bookingId} status.`, 'error');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':    return 'confirmed';
      case 'completed':    return 'completed';
      case 'cancelled':    return 'cancelled';
      case 'arrived':      return 'arrived';
      case 'didnotarrive': return 'didnotarrive';
      default:             return '';
    }
  };

  const canChangeStatus = (status: string) =>
    !['arrived', 'didnotarrive', 'cancelled'].includes(status?.toLowerCase());

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
            {bookings.map((booking) => {
              const isUpdating = updatingId === booking.id;
              const actionable = canChangeStatus(booking.status);
              return (
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

                      {/* ── Quick Status Actions ── */}
                      {actionable && (
                        <div className="barber-status-actions">
                          <button
                            className="btn-status arrived"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(booking.id, BookingStatus.Arrived)}
                            title="Mark as Arrived"
                          >
                            {isUpdating ? '…' : '✔ Arrived'}
                          </button>
                          <button
                            className="btn-status didnotarrive"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(booking.id, BookingStatus.DidNotArrive)}
                            title="Mark as Did Not Arrive"
                          >
                            {isUpdating ? '…' : '✖ No-Show'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
