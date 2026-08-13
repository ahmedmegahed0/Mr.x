import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBarbers, BarberDTO } from '../../api/barbers.api';
import './BarberDirectory.css';

export default function BarberDirectory() {
  const [barbers, setBarbers] = useState<BarberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const data = await getBarbers();
        setBarbers(data.filter(b => b.isActive)); // Only show active barbers
      } catch (err: any) {
        console.error('Failed to load barbers', err);
        setError('Unable to load barbers at this time. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBarbers();
  }, []);

  return (
    <div className="barber-directory">
      <div className="directory-hero">
        <div className="hero-content">
          <h1>Master Barbers</h1>
          <p>Select your preferred barber to view their availability and book an appointment.</p>
        </div>
      </div>

      <div className="directory-container">
        {isLoading ? (
          <div className="barbers-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="barber-card skeleton">
                <div className="skeleton-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line text"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="directory-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : barbers.length > 0 ? (
          <div className="barbers-grid">
            {barbers.map(barber => (
              <div className="barber-card" key={barber.id}>
                <div className="barber-image-wrapper">
                  {barber.profilePictureUrl ? (
                    <img src={barber.profilePictureUrl} alt={barber.fullName} className="barber-image" />
                  ) : (
                    <div className="barber-image-placeholder">
                      {barber.fullName.charAt(0)}
                    </div>
                  )}
                  {!barber.acceptingBookings && (
                    <div className="unavailable-overlay">
                      <span>Currently Unavailable</span>
                    </div>
                  )}
                </div>
                
                <div className="barber-card-content">
                  <h2>{barber.fullName}</h2>
                  <div className="barber-status">
                    <span className={`status-dot ${barber.acceptingBookings ? 'active' : 'inactive'}`}></span>
                    <span className="status-text">
                      {barber.acceptingBookings ? 'Accepting Bookings' : 'Fully Booked'}
                    </span>
                  </div>
                  <button 
                    className="btn-book"
                    onClick={() => navigate(`/barbers/${barber.id}`)}
                    disabled={!barber.acceptingBookings}
                  >
                    View Profile & Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="directory-empty">
            <p>No barbers are currently available. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
