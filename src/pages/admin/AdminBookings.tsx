import React, { useEffect, useState } from 'react';
import { getBookings, BookingDTO, BookingsFilterParams } from '../../api/admin.api';
import './AdminBookings.css';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filters, setFilters] = useState<BookingsFilterParams>({
    pageNumber: 1,
    pageSize: 10,
    date: '',
    status: '',
    // Optional: barberId or customerId could be added here
  });

  const fetchBookings = async (currentFilters: BookingsFilterParams) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Remove empty strings to not send them as query params
      const cleanFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([_, v]) => v !== '')
      );
      
      const response = await getBookings(cleanFilters);
      const rawResponse = response as any;
      
      const extractArray = (obj: any): any[] => {
        if (!obj) return [];
        if (Array.isArray(obj)) return obj;
        if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
        if (obj.items) return extractArray(obj.items);
        if (obj.Items) return extractArray(obj.Items);
        if (obj.data) return extractArray(obj.data);
        if (obj.Data) return extractArray(obj.Data);
        return [];
      };
      
      const items = extractArray(rawResponse);
      setBookings(items);
      setTotalCount(rawResponse?.totalCount ?? rawResponse?.TotalCount ?? items.length);
      setTotalPages(rawResponse?.totalPages ?? rawResponse?.TotalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
      setFetchError('Server is currently unreachable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(filters);
  }, [filters.pageNumber, filters.pageSize]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when applying filters
    setFilters(prev => ({ ...prev, pageNumber: 1 }));
    fetchBookings({ ...filters, pageNumber: 1 });
  };

  const handleClearFilters = () => {
    const cleared = { pageNumber: 1, pageSize: 10, date: '', status: '' };
    setFilters(cleared);
    fetchBookings(cleared);
  };

  const handlePrevPage = () => {
    if (filters.pageNumber! > 1) {
      setFilters(prev => ({ ...prev, pageNumber: prev.pageNumber! - 1 }));
    }
  };

  const handleNextPage = () => {
    if (filters.pageNumber! < totalPages) {
      setFilters(prev => ({ ...prev, pageNumber: prev.pageNumber! + 1 }));
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'confirmed';
      case 'completed': return 'completed';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  return (
    <div className="admin-bookings">
      <header className="admin-page-header">
        <h1>Bookings Management</h1>
      </header>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Date</label>
          <input 
            type="date" 
            name="date" 
            value={filters.date || ''} 
            onChange={handleFilterChange} 
            onBlur={handleApplyFilters}
          />
        </div>
        
        <div className="filter-group">
          <label>Status</label>
          <select name="status" value={filters.status || ''} onChange={(e) => { handleFilterChange(e); setTimeout(() => fetchBookings({ ...filters, status: e.target.value, pageNumber: 1 }), 0); }}>
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button className="btn-clear-filters" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Barber</th>
              <th>Total Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '120px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '60px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                </tr>
              ))
            ) : fetchError ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#EF5350', background: 'rgba(239, 83, 80, 0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <span style={{ fontWeight: '500' }}>{fetchError}</span>
                  </div>
                </td>
              </tr>
            ) : bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>#{booking.id}</td>
                  <td>{new Date(booking.bookingDate).toLocaleString()}</td>
                  <td>{booking.customerName}</td>
                  <td>{booking.barberName}</td>
                  <td>${booking.totalPrice.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#8C867E' }}>
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!isLoading && totalCount > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {(filters.pageNumber! - 1) * filters.pageSize! + 1} - {Math.min(filters.pageNumber! * filters.pageSize!, totalCount)} of {totalCount}
            </div>
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                onClick={handlePrevPage} 
                disabled={filters.pageNumber! <= 1}
              >
                Prev
              </button>
              <button 
                className="btn-page" 
                onClick={handleNextPage} 
                disabled={filters.pageNumber! >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
