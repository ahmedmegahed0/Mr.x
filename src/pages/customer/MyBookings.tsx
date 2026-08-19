import { useState, useEffect } from 'react';
import { getUpcomingBookings, getBookingHistory, cancelBooking, BookingDTO } from '../../api/bookings.api';
import { useToast } from '../../context/ToastContext';
import './MyBookings.css';

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [upcoming, setUpcoming] = useState<BookingDTO[]>([]);
  const [history, setHistory] = useState<BookingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination for history
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();

  const fetchUpcoming = async () => {
    try {
      const data = await getUpcomingBookings();
      setUpcoming(data);
    } catch (error) {
      console.error('Failed to fetch upcoming bookings', error);
      showToast('Failed to load upcoming bookings', 'error');
    }
  };

  const fetchHistory = async (pageNumber: number) => {
    try {
      const data = await getBookingHistory(pageNumber, 10);
      setHistory(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch booking history', error);
      showToast('Failed to load booking history', 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (activeTab === 'upcoming') {
        await fetchUpcoming();
      } else {
        await fetchHistory(page);
      }
      setIsLoading(false);
    };
    loadData();
  }, [activeTab, page]);

  const handleCancel = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }
    
    try {
      await cancelBooking(bookingId);
      showToast('Booking cancelled successfully', 'success');
      // Refresh the lists
      await fetchUpcoming();
    } catch (error: any) {
      console.error('Failed to cancel booking', error);
      showToast(error.response?.data?.message || 'Failed to cancel booking. It may be too late to cancel.', 'error');
    }
  };

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h1>My Appointments</h1>
        <p>Manage your upcoming visits and view your history.</p>
      </div>

      <div className="bookings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => { setActiveTab('upcoming'); setPage(1); }}
        >
          Upcoming
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); setPage(1); }}
        >
          History
        </button>
      </div>

      <div className="bookings-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="mrx-spinner"></div>
          </div>
        ) : activeTab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <div className="empty-state">
              <h3>No Upcoming Appointments</h3>
              <p>You don't have any barbershop visits scheduled right now.</p>
            </div>
          ) : (
            <div className="bookings-list">
              {upcoming.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-card-header">
                    <span className="booking-date">{new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                  </div>
                  <div className="booking-card-body">
                    <div className="booking-barber">
                      <h3>{booking.barberName}</h3>
                      <p>{booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}</p>
                    </div>
                    <div className="booking-price">
                      <span>Total</span>
                      <strong>${booking.totalPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="booking-services">
                    {booking.services.map(s => s.serviceName).join(' • ')}
                  </div>
                  <div className="booking-card-footer">
                    <button className="btn-cancel-booking" onClick={() => handleCancel(booking.id)}>
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="empty-state">
              <h3>No Booking History</h3>
              <p>Your past appointments will appear here.</p>
            </div>
          ) : (
            <>
              <div className="bookings-list">
                {history.map(booking => (
                  <div key={booking.id} className="booking-card history-card">
                    <div className="booking-card-header">
                      <span className="booking-date">{new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                    </div>
                    <div className="booking-card-body">
                      <div className="booking-barber">
                        <h3>{booking.barberName}</h3>
                      </div>
                      <div className="booking-price">
                        <strong>${booking.totalPrice.toFixed(2)}</strong>
                      </div>
                    </div>
                    <div className="booking-services">
                      {booking.services.map(s => s.serviceName).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button 
                    disabled={page === totalPages} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
