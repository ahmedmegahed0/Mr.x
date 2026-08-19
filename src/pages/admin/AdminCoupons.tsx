import React, { useEffect, useState } from 'react';
import { getCoupons, createCoupon, deleteCoupon, CouponDTO, CreateCouponRequest } from '../../api/admin.api';
import AdminModal from '../../components/admin/AdminModal';
import { useToast } from '../../context/ToastContext';
import './AdminCoupons.css';

export default function AdminCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    discountPercentage: 0,
    startDate: new Date().toISOString().split('T')[0], // Today
    expiryDate: '',
    usageLimit: null,
  });

  const fetchCoupons = async (page: number) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await getCoupons({ pageNumber: page, pageSize });
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
      setCoupons(items);
      setTotalCount(rawResponse?.totalCount ?? rawResponse?.TotalCount ?? items.length);
      setTotalPages(rawResponse?.totalPages ?? rawResponse?.TotalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      setCoupons([]);
      setFetchError('Server is currently unreachable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons(pageNumber);
  }, [pageNumber]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
        showToast('Coupon deleted successfully', 'success');
        fetchCoupons(pageNumber);
      } catch (error: any) {
        if (error.code === 'ERR_NETWORK') {
          showToast('Service is currently unavailable. Please try again later.', 'error');
        } else {
          showToast('Failed to delete coupon', 'error');
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCoupon(formData);
      showToast('Coupon created successfully', 'success');
      setIsModalOpen(false);
      setFormData({
        code: '',
        discountPercentage: 0,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        usageLimit: null,
      });
      fetchCoupons(1);
      setPageNumber(1);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        showToast('Service is currently unavailable. Please try again later.', 'error');
      } else if (error.response?.status === 409) {
        showToast('A coupon with this code already exists.', 'error');
      } else {
        showToast('Failed to create coupon. Check your inputs.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-coupons">
      <header className="admin-page-header">
        <h1>Coupons Management</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Create Coupon</button>
      </header>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount %</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Usage Limit</th>
              <th>Times Used</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '60px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '60px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '60px' }}></div></td>
                  <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                </tr>
              ))
            ) : fetchError ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#EF5350', background: 'rgba(239, 83, 80, 0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <span style={{ fontWeight: '500' }}>{fetchError}</span>
                  </div>
                </td>
              </tr>
            ) : coupons.length > 0 ? (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td style={{ fontWeight: 600, color: '#A98B62' }}>{coupon.code}</td>
                  <td>{coupon.discountPercentage}%</td>
                  <td>{new Date(coupon.startDate).toLocaleDateString()}</td>
                  <td>{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                  <td>{coupon.usageLimit !== null ? coupon.usageLimit : 'Unlimited'}</td>
                  <td>{coupon.timesUsed}</td>
                  <td>
                    <span className={`status-badge ${coupon.isActive ? 'active' : 'expired'}`}>
                      {coupon.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action btn-delete" onClick={() => handleDelete(coupon.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#8C867E' }}>
                  No coupons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!isLoading && totalCount > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {(pageNumber - 1) * pageSize + 1} - {Math.min(pageNumber * pageSize, totalCount)} of {totalCount}
            </div>
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} 
                disabled={pageNumber <= 1}
              >
                Prev
              </button>
              <button 
                className="btn-page" 
                onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))} 
                disabled={pageNumber >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Coupon">
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Coupon Code</label>
            <input 
              type="text" 
              name="code" 
              required 
              placeholder="e.g. SUMMER20"
              value={formData.code} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="admin-form-group">
            <label>Discount Percentage (%)</label>
            <input 
              type="number" 
              name="discountPercentage" 
              required 
              min="1" max="100"
              value={formData.discountPercentage} 
              onChange={handleInputChange} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                required 
                value={formData.startDate} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="admin-form-group">
              <label>Expiry Date</label>
              <input 
                type="date" 
                name="expiryDate" 
                required 
                value={formData.expiryDate} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Usage Limit (Optional)</label>
            <input 
              type="number" 
              name="usageLimit" 
              min="1"
              placeholder="Leave empty for unlimited"
              value={formData.usageLimit || ''} 
              onChange={handleInputChange} 
            />
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
