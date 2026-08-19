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
      {/* Cinematic Hero */}
      <div className="directory-hero">
        <div className="hero-content">
          <span className="directory-eyebrow">Meet The Masters</span>
          <h1>Master Barbers</h1>
          <p>Select your preferred craftsman to view their availability and book your next premium grooming session.</p>
        </div>
      </div>

      <div className="directory-container">
        {isLoading ? (
          <div className="barbers-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="barber-card skeleton">
                <div className="skeleton-image"></div>
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
              <div 
                className="barber-card" 
                key={barber.id}
                onClick={() => {
                  if (barber.acceptingBookings) {
                    navigate(`/barbers/${barber.id}`);
                  }
                }}
              >
                {/* Background Image */}
                <div className="barber-image-wrapper">
                  {barber.profilePictureUrl ? (
                    <img 
                      src={barber.profilePictureUrl} 
                      alt={barber.fullName} 
                      className="barber-image" 
                      draggable={false}
                    />
                  ) : (
                    <div className="barber-image-placeholder">
                      {barber.fullName.charAt(0)}
                    </div>
                  )}
                  
                  {!barber.acceptingBookings && (
                    <div className="unavailable-overlay">
                      <span>Fully Booked</span>
                    </div>
                  )}
                </div>
                
                {/* Overlay Content */}
                <div className="barber-card-content">
                  <h2>{barber.fullName}</h2>
                  <p className="barber-role">Master Barber</p>
                  
                  <div className="barber-status">
                    <span className={`status-dot ${barber.acceptingBookings ? 'active' : 'inactive'}`}></span>
                    <span className="status-text">
                      {barber.acceptingBookings ? 'Available Today' : 'Unavailable'}
                    </span>
                  </div>

                  <button 
                    className="btn-book"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/barbers/${barber.id}`);
                    }}
                    disabled={!barber.acceptingBookings}
                  >
                    BOOK APPOINTMENT &rarr;
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
