import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBarberById, getBarberAvailability, BarberDTO, AvailabilitySlot } from '../../api/barbers.api';
import { createBooking } from '../../api/bookings.api';
import { getPublicServices, ServiceDTO } from '../../api/services.api';
import { useToast } from '../../context/ToastContext';
import './BookingWizard.css';

type Step = 1 | 2 | 3 | 4;

export default function BookingWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data
  const [barber, setBarber] = useState<BarberDTO | null>(null);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  
  // Form State
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      try {
        const [barberData, servicesData] = await Promise.all([
          getBarberById(id),
          getPublicServices()
        ]);
        setBarber(barberData);
        setServices(servicesData);

        // Restore pending booking if exists
        const pendingBookingRaw = sessionStorage.getItem('pendingBooking');
        if (pendingBookingRaw) {
          const pendingBooking = JSON.parse(pendingBookingRaw);
          if (pendingBooking.barberId === id) {
            setSelectedDate(pendingBooking.bookingDate || '');
            setSelectedSlot(pendingBooking.startTime || '');
            setSelectedServiceIds(pendingBooking.serviceIds || []);
            setCouponCode(pendingBooking.couponCode || '');
            setFullName(pendingBooking.fullName || '');
            setPhoneNumber(pendingBooking.phoneNumber || '');
            setStep(4); // Skip to confirmation
          }
          sessionStorage.removeItem('pendingBooking');
        }
      } catch (error) {
        console.error('Error fetching data for booking wizard', error);
        showToast('Failed to load barber or services', 'error');
        navigate('/barbers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [id, navigate, showToast]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!id || !selectedDate) return;
    
    const fetchAvailability = async () => {
      try {
        const slots = await getBarberAvailability(id, selectedDate);
        setAvailability(slots);
        setSelectedSlot(''); // Reset slot on date change
      } catch (error) {
        console.error('Failed to fetch availability', error);
        setAvailability([]);
      }
    };
    fetchAvailability();
  }, [id, selectedDate]);

  // Derived state
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const subTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleNext = () => {
    if (step === 1 && selectedServiceIds.length === 0) {
      showToast('Please select at least one service', 'error');
      return;
    }
    if (step === 2 && (!selectedDate || !selectedSlot)) {
      showToast('Please select a date and an available time slot', 'error');
      return;
    }
    if (step === 3 && (!fullName || !phoneNumber)) {
      showToast('Please provide your name and phone number', 'error');
      return;
    }
    setStep((prev) => (prev + 1) as Step);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as Step);
  };

  const toggleService = (serviceId: number) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleConfirm = async () => {
    if (!id) return;
    
    const bookingPayload: any = {
      barberId: isNaN(Number(id)) ? id : Number(id),
      bookingDate: selectedDate,
      startTime: selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot,
      serviceIds: selectedServiceIds,
      couponCode: couponCode || null,
      fullName,
      phoneNumber,
      customerName: fullName,
      customerPhone: phoneNumber
    };

    if (!isAuthenticated) {
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking(bookingPayload);
      showToast('Booking confirmed successfully!', 'success');
      navigate('/bookings');
    } catch (error: any) {
      console.error('Booking failed', error);
      if (error.response?.status === 409) {
        showToast(error.response?.data?.message || 'Selected slot or coupon is unavailable. Please try again.', 'error');
        // If conflict, force refresh of slots
        const slots = await getBarberAvailability(id, selectedDate).catch(() => []);
        setAvailability(slots);
        setSelectedSlot('');
        setStep(2); // Go back to step 2
      } else {
        const resData = error.response?.data;
        let errMsg = 'Failed to confirm booking.';
        if (typeof resData === 'string' && resData.trim() !== '') {
           errMsg = resData;
        } else if (resData?.message) {
           errMsg = resData.message;
        } else if (resData?.detail) {
           errMsg = resData.detail;
        } else if (resData?.title) {
           errMsg = resData.title;
           if (resData.errors) {
              const firstErr = Object.values(resData.errors)[0] as string[];
              if (firstErr && firstErr.length > 0) errMsg += ': ' + firstErr[0];
           }
        } else if (resData?.Message) {
           errMsg = resData.Message;
        }
        
        if (errMsg === 'An error occurred while processing your request.') {
            errMsg += ' (The server encountered an internal error. Please check if your data is valid or try again later.)';
        }
        showToast(errMsg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="wizard-loading">
        <div className="mrx-spinner mrx-spinner-large"></div>
      </div>
    );
  }

  if (!barber) return null;

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>Book Appointment</h1>
        <p>with {barber.fullName}</p>
        
        <div className="wizard-progress">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`progress-step ${step >= s ? 'active' : ''}`}></div>
          ))}
        </div>
      </div>

      <div className="wizard-body">
        {step === 1 && (
          <div className="wizard-step step-services">
            <h2>Select Services</h2>
            <div className="services-grid">
              {services.length === 0 ? (
                <p>No services available.</p>
              ) : (
                services.map(service => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <div 
                      key={service.id} 
                      className={`service-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleService(service.id)}
                    >
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        {service.description && <p>{service.description}</p>}
                      </div>
                      <div className="service-price">
                        ${service.price.toFixed(2)}
                      </div>
                      <div className="service-checkbox">
                        {isSelected && <span className="check-mark">✓</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {selectedServiceIds.length > 0 && (
              <div className="step-summary">
                <span>Selected {selectedServiceIds.length} service(s)</span>
                <span>Total: ${subTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step step-datetime">
            <h2>Select Date & Time</h2>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // today
              />
            </div>

            {selectedDate && (
              <div className="slots-container">
                <label>Available Slots</label>
                {availability.length === 0 ? (
                  <p className="no-slots">No available slots for this date.</p>
                ) : (
                  <div className="slots-grid">
                    {availability.map((slot, idx) => {
                      const isSelected = selectedSlot === slot.startTime;
                      return (
                        <button
                          key={idx}
                          className={`slot-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedSlot(slot.startTime)}
                        >
                          {slot.startTime.substring(0, 5)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step step-details">
            <h2>Your Details</h2>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+20 100 123 4567"
              />
            </div>
            <div className="form-group">
              <label>Coupon Code (Optional)</label>
              <input 
                type="text" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="SUMMER10"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step step-confirmation">
            <h2>Booking Summary</h2>
            
            <div className="summary-card">
              <div className="summary-section">
                <h3>Appointment</h3>
                <p><strong>Barber:</strong> {barber.fullName}</p>
                <p><strong>Date:</strong> {selectedDate}</p>
                <p><strong>Time:</strong> {selectedSlot.substring(0, 5)}</p>
              </div>
              
              <div className="summary-section">
                <h3>Services</h3>
                <ul className="summary-services">
                  {selectedServices.map(s => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                      <span>${s.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-section">
                <h3>Details</h3>
                <p><strong>Name:</strong> {fullName}</p>
                <p><strong>Phone:</strong> {phoneNumber}</p>
                {couponCode && <p><strong>Coupon:</strong> {couponCode}</p>}
              </div>

              <div className="summary-total">
                <span>Subtotal</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              
              {!isAuthenticated && (
                <div className="auth-warning">
                  <p>You will be redirected to Sign In to complete this booking.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="wizard-footer">
        {step > 1 ? (
          <button className="btn-secondary" onClick={handleBack} disabled={isSubmitting}>
            Back
          </button>
        ) : (
          <div></div> // Empty div for flex space-between
        )}
        
        {step < 4 ? (
          <button className="btn-primary" onClick={handleNext}>
            Continue
          </button>
        ) : (
          <button className="btn-primary btn-confirm" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Confirming...' : (isAuthenticated ? 'Confirm Booking' : 'Sign In to Confirm')}
          </button>
        )}
      </div>
    </div>
  );
}
