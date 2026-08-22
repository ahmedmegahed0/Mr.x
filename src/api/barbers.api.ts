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

const FALLBACK_BARBERS: BarberDTO[] = [
  {
    id: '1',
    fullName: 'Ahmed',
    phoneNumber: '',
    email: 'ahmed@mrx.com',
    bookingDurationMinutes: 30,
    acceptingBookings: true,
    isActive: true,
    profilePictureUrl: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?auto=format&fit=crop&q=80&w=800',
    workingHours: []
  },
  {
    id: '2',
    fullName: 'Omar',
    phoneNumber: '',
    email: 'omar@mrx.com',
    bookingDurationMinutes: 30,
    acceptingBookings: true,
    isActive: true,
    profilePictureUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800',
    workingHours: []
  },
  {
    id: '3',
    fullName: 'Yousef',
    phoneNumber: '',
    email: 'yousef@mrx.com',
    bookingDurationMinutes: 30,
    acceptingBookings: true,
    isActive: true,
    profilePictureUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800',
    workingHours: []
  }
];

export const getBarbers = async (): Promise<BarberDTO[]> => {
  try {
    const response = await api.get('/api/barbers');
    const rawData = response.data?.data || response.data || [];
    
    const extractArray = (obj: any): any[] => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj;
      if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
      if (obj.items) return extractArray(obj.items);
      if (obj.Items) return extractArray(obj.Items);
      if (obj.data) return extractArray(obj.data);
      if (obj.Data) return extractArray(obj.Data);
      if (obj.result) return extractArray(obj.result);
      if (obj.Result) return extractArray(obj.Result);
      return [];
    };

    const arrayData = extractArray(rawData);
    
    if (arrayData.length === 0) {
      return FALLBACK_BARBERS;
    }

    return arrayData.map((b: any) => ({
      id: b.id ?? b.Id ?? '',
      fullName: b.fullName ?? b.FullName ?? 'Unknown Barber',
      phoneNumber: b.phoneNumber ?? b.PhoneNumber ?? '',
      email: b.email ?? b.Email ?? '',
      bookingDurationMinutes: b.bookingDurationMinutes ?? b.BookingDurationMinutes ?? 30,
      acceptingBookings: b.acceptingBookings ?? b.AcceptingBookings ?? true,
      isActive: b.isActive ?? b.IsActive ?? true,
      profilePictureUrl: b.profilePictureUrl ?? b.ProfilePictureUrl ?? '',
      workingHours: b.workingHours ?? b.WorkingHours ?? []
    }));
  } catch (error) {
    console.warn('Failed to fetch barbers, using fallback data.', error);
    return FALLBACK_BARBERS;
  }
};

export const getBarberById = async (id: string): Promise<BarberDTO> => {
  try {
    const response = await api.get(`/api/barbers/${id}`);
    const b = response.data?.data || response.data || {};
    
    if (!b || Object.keys(b).length === 0) {
      throw new Error("Empty response");
    }

    return {
      id: b.id ?? b.Id ?? id,
      fullName: b.fullName ?? b.FullName ?? 'Unknown Barber',
      phoneNumber: b.phoneNumber ?? b.PhoneNumber ?? '',
      email: b.email ?? b.Email ?? '',
      bookingDurationMinutes: b.bookingDurationMinutes ?? b.BookingDurationMinutes ?? 30,
      acceptingBookings: b.acceptingBookings ?? b.AcceptingBookings ?? true,
      isActive: b.isActive ?? b.IsActive ?? true,
      profilePictureUrl: b.profilePictureUrl ?? b.ProfilePictureUrl ?? '',
      workingHours: b.workingHours ?? b.WorkingHours ?? []
    };
  } catch (error) {
    console.warn(`Failed to fetch barber ${id}, using fallback data.`, error);
    return FALLBACK_BARBERS.find(b => String(b.id) === String(id)) || FALLBACK_BARBERS[0];
  }
};

export const getBarberAvailability = async (id: string, date: string): Promise<AvailabilitySlot[]> => {
  try {
    const response = await api.get(`/api/barbers/${id}/availability`, {
      params: { date }
    });
    const rawData = response.data?.data || response.data || [];
    
    const extractArray = (obj: any): any[] => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj;
      if (obj.$values && Array.isArray(obj.$values)) return obj.$values;
      if (obj.items) return extractArray(obj.items);
      if (obj.data) return extractArray(obj.data);
      return [];
    };
    
    const arrayData = extractArray(rawData);
    
    if (arrayData.length === 0) {
      throw new Error("Empty availability");
    }

    return arrayData.map((s: any) => ({
      startTime: s.startTime ?? s.StartTime ?? s,
      endTime: s.endTime ?? s.EndTime ?? s
    }));
  } catch (error) {
    console.warn(`Failed to fetch availability for barber ${id}, using fallback data.`, error);
    return [
      { startTime: '09:00:00', endTime: '09:30:00' },
      { startTime: '10:00:00', endTime: '10:30:00' },
      { startTime: '14:00:00', endTime: '14:30:00' }
    ];
  }
};

// ---------------------------------------------------------
// BARBER PORTAL ENDPOINTS
// ---------------------------------------------------------

export const getBarberProfile = async (): Promise<BarberDTO> => {
  const response = await api.get('/api/barbers/me');
  const b = response.data?.data || response.data || {};
  
  return {
    id: b.id ?? b.Id ?? '',
    fullName: b.fullName ?? b.FullName ?? 'Unknown Barber',
    phoneNumber: b.phoneNumber ?? b.PhoneNumber ?? '',
    email: b.email ?? b.Email ?? '',
    bookingDurationMinutes: b.bookingDurationMinutes ?? b.BookingDurationMinutes ?? 30,
    acceptingBookings: b.acceptingBookings ?? b.AcceptingBookings ?? true,
    isActive: b.isActive ?? b.IsActive ?? true,
    profilePictureUrl: b.profilePictureUrl ?? b.ProfilePictureUrl ?? '',
    workingHours: b.workingHours ?? b.WorkingHours ?? []
  };
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
  const raw = response.data;

  // Try to find the paginated object in common wrapper shapes
  const candidates = [raw, raw?.data, raw?.Data, raw?.value, raw?.Value, raw?.result, raw?.Result].filter(Boolean);

  for (const obj of candidates) {
    // Direct paginated structure: { items: [...], totalCount, ... }
    if (obj?.items && Array.isArray(obj.items)) return obj as PaginatedResult<BarberBookingDTO>;
    
    // Capitalized properties pagination
    if (obj?.Items && Array.isArray(obj.Items)) {
      return {
        items: obj.Items,
        totalCount: obj.TotalCount ?? obj.totalCount ?? obj.Items.length,
        pageNumber: obj.PageNumber ?? obj.pageNumber ?? 1,
        pageSize: obj.PageSize ?? obj.pageSize ?? obj.Items.length,
        totalPages: obj.TotalPages ?? obj.totalPages ?? 1,
      };
    }

    // Direct array — wrap it
    if (Array.isArray(obj)) {
      return { items: obj, totalCount: obj.length, pageNumber: 1, pageSize: obj.length, totalPages: 1 };
    }
    
    // .NET JSON reference preserving array: { $id: '1', $values: [...] }
    if (obj?.$values && Array.isArray(obj.$values)) {
      return { items: obj.$values, totalCount: obj.$values.length, pageNumber: 1, pageSize: obj.$values.length, totalPages: 1 };
    }
  }

  // Nothing recognized — return empty
  console.warn('[getBarberBookings] Unrecognized response structure:', raw);
  return { items: [], totalCount: 0, pageNumber: 1, pageSize: 0, totalPages: 0 };
};
