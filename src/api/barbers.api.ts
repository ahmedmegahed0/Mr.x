import api from './axiosInstance';

export interface WorkingHour {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openingTime: string; // HH:mm:ss or HH:mm
  closingTime: string;
  isClosed: boolean;
}

export interface BarberDTO {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  bookingDurationMinutes: number;
  acceptingBookings: boolean;
  isActive: boolean;
  profilePictureUrl?: string;
  workingHours: WorkingHour[];
}

export interface AvailabilitySlot {
  startTime: string; // ISO string or HH:mm
  endTime: string;
}

export interface BarberBookingDTO {
  id: number;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  barberId: string;
  barberName: string;
  bookingDate: string; // ISO string
  startTime: string;
  endTime: string;
  subTotal: number;
  discount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------
// PUBLIC ENDPOINTS
// ---------------------------------------------------------

export const getBarbers = async (): Promise<BarberDTO[]> => {
  const response = await api.get('/api/barbers');
  return response.data;
};

export const getBarberById = async (id: string): Promise<BarberDTO> => {
  const response = await api.get(`/api/barbers/${id}`);
  return response.data;
};

export const getBarberAvailability = async (id: string, date: string): Promise<AvailabilitySlot[]> => {
  const response = await api.get(`/api/barbers/${id}/availability`, {
    params: { date }
  });
  return response.data;
};

// ---------------------------------------------------------
// BARBER PORTAL ENDPOINTS
// ---------------------------------------------------------

export const getBarberProfile = async (): Promise<BarberDTO> => {
  const response = await api.get('/api/barbers/me');
  return response.data;
};

export const updateBookingSettings = async (settings: { bookingDurationMinutes: number; acceptingBookings: boolean }): Promise<void> => {
  await api.put('/api/barbers/me/booking-settings', settings);
};

export const updateWorkingHours = async (payload: { workingHours: WorkingHour[] }): Promise<void> => {
  await api.put('/api/barbers/me/working-hours', payload);
};

export const getBarberBookings = async (params: {
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedResult<BarberBookingDTO>> => {
  const response = await api.get('/api/barbers/me/bookings', { params });
  return response.data;
};
