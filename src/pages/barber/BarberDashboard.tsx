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
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const fetchBookingsForDate = async (date: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const dateString = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const data = await getBarberBookings({
        fromDate: dateString,
        toDate: dateString,
        pageNumber: 1,
        pageSize: 50,
      });
      const sorted = data.items.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setBookings(sorted);
    } catch (err: any) {
      console.error('Failed to load bookings', err);
      setError('Server is currently unreachable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsForDate(currentDate);
  }, [currentDate]);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  /** Quick-change booking status */
  const handleStatusChange = async (bookingId: number, status: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      
      let label = '';
      if (status === BookingStatus.Arrived) label = 'Arrived';
      else if (status === BookingStatus.DidNotArrive) label = 'Did Not Arrive';
      else if (status === BookingStatus.Confirmed) label = 'Confirmed (Undo)';
      
      showToast(`Booking #${bookingId} marked as ${label}`, 'success');
      // Refresh the agenda
      fetchBookingsForDate(currentDate);
    } catch (err: any) {
      console.error('Update status failed:', err.response?.data || err);
      
      const errorMessage = err.response?.data?.message || err.response?.data || '';
      
      if (err.code === 'ERR_NETWORK') {
        showToast('Service is currently unavailable. Please try again later.', 'error');
      } else {
        showToast(`Failed to update booking #${bookingId}. ${errorMessage}`, 'error');
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

  // Determine header title based on selected date vs today
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentViewDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  const isPastDay = currentViewDateOnly < todayDateOnly;
  const isToday = currentDate.getDate() === today.getDate() && 
                  currentDate.getMonth() === today.getMonth() && 
                  currentDate.getFullYear() === today.getFullYear();
                  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = currentDate.getDate() === tomorrow.getDate() && 
                     currentDate.getMonth() === tomorrow.getMonth() && 
                     currentDate.getFullYear() === tomorrow.getFullYear();
                     
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = currentDate.getDate() === yesterday.getDate() && 
                      currentDate.getMonth() === yesterday.getMonth() && 
                      currentDate.getFullYear() === yesterday.getFullYear();

  let headerTitle = "Agenda";
  if (isToday) headerTitle = "Today's Agenda";
  else if (isTomorrow) headerTitle = "Tomorrow's Agenda";
  else if (isYesterday) headerTitle = "Yesterday's Agenda";

  return (
    <div className="barber-dashboard">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{headerTitle}</h1>
          <p className="subtitle">{currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="date-navigation" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={handlePrevDay} style={{ padding: '0.5rem 1rem' }}>
            &larr; Prev
          </button>
          {!isToday && (
            <button className="btn-secondary" onClick={handleToday} style={{ padding: '0.5rem 1rem' }}>
              Today
            </button>
          )}
          <button className="btn-secondary" onClick={handleNextDay} style={{ padding: '0.5rem 1rem' }}>
            Next &rarr;
          </button>
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
              const statusLower = booking.status?.toLowerCase();
              const canMarkArrived = !isPastDay && !['arrived', 'didnotarrive', 'cancelled'].includes(statusLower);

              return (
                <div className="timeline-item" key={booking.id}>
                  <div className="time-col">
                    <span className="time-start">{booking.startTime.substring(0, 5)}</span>
                    <span className="time-end">{booking.endTime.substring(0, 5)}</span>
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
                      {canMarkArrived && (
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
            <h3>No appointments found.</h3>
            <p>Enjoy your free time or check your schedule for another day.</p>
          </div>
        )}
      </div>
    </div>
  );
}
