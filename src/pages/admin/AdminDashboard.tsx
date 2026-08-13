import { useEffect, useState } from 'react';
import { 
  getDashboardStats, 
  getMonthlyReport, 
  getTopBarbers, 
  getTopServices,
  DashboardStatsDTO,
  MonthlyReportDTO,
  TopBarberDTO,
  TopServiceDTO
} from '../../api/admin.api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportDTO[]>([]);
  const [topBarbers, setTopBarbers] = useState<TopBarberDTO[]>([]);
  const [topServices, setTopServices] = useState<TopServiceDTO[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'ThisMonth' | 'PreviousMonth' | 'ThisYear' | 'Custom'>('ThisYear');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsData, monthlyReportData, barbersData, servicesData] = await Promise.all([
          getDashboardStats().catch(() => null),
          getMonthlyReport({ period }).catch(() => []),
          getTopBarbers(5).catch(() => []),
          getTopServices(5).catch(() => [])
        ]);

        if (statsData) setStats(statsData);
        setMonthlyData(monthlyReportData);
        setTopBarbers(barbersData);
        setTopServices(servicesData);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  const maxRevenue = monthlyData.length 
    ? Math.max(...monthlyData.map(d => d.totalRevenue)) 
    : 1;

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <h1>Dashboard Overview</h1>
      </header>

      {/* Metrics Row */}
      <div className="dashboard-metrics">
        <div className="metric-card">
          <span className="metric-title">Total Revenue</span>
          {isLoading ? <div className="skeleton skeleton-title"></div> : <h3 className="metric-value">${stats?.totalRevenue?.toLocaleString() ?? '0'}</h3>}
        </div>
        <div className="metric-card">
          <span className="metric-title">Total Bookings</span>
          {isLoading ? <div className="skeleton skeleton-title"></div> : <h3 className="metric-value">{stats?.totalBookings?.toLocaleString() ?? '0'}</h3>}
        </div>
        <div className="metric-card">
          <span className="metric-title">Total Customers</span>
          {isLoading ? <div className="skeleton skeleton-title"></div> : <h3 className="metric-value">{stats?.totalCustomers?.toLocaleString() ?? '0'}</h3>}
        </div>
        <div className="metric-card">
          <span className="metric-title">Total Barbers</span>
          {isLoading ? <div className="skeleton skeleton-title"></div> : <h3 className="metric-value">{stats?.totalBarbers?.toLocaleString() ?? '0'}</h3>}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main Chart Area */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">Revenue Performance</h2>
            <div className="panel-actions">
              <select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                <option value="ThisMonth">This Month</option>
                <option value="PreviousMonth">Previous Month</option>
                <option value="ThisYear">This Year</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="skeleton" style={{ height: '250px' }}></div>
          ) : (
            <div className="bar-chart-container">
              {monthlyData.length === 0 ? (
                <div style={{ margin: 'auto', color: '#6F6962' }}>No data available for this period.</div>
              ) : (
                monthlyData.map((data, idx) => {
                  const heightPercent = (data.totalRevenue / maxRevenue) * 100;
                  return (
                    <div className="bar-wrapper" key={idx}>
                      <div className="bar" style={{ height: `${heightPercent}%` }} title={`Revenue: $${data.totalRevenue}`}></div>
                      <span className="bar-label">{data.month.substring(0, 3)}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Side Widgets */}
        <div className="dashboard-widgets" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Barbers */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Top Barbers</h2>
            </div>
            {isLoading ? (
              <div className="skeleton skeleton-text" style={{ height: '100px' }}></div>
            ) : (
              <ul className="list-widget">
                {topBarbers.map(barber => (
                  <li key={barber.barberId}>
                    <div>
                      <div className="list-item-main">{barber.barberName}</div>
                      <div className="list-item-sub">{barber.bookingCount} Bookings</div>
                    </div>
                    <div className="list-item-value">${barber.revenue.toLocaleString()}</div>
                  </li>
                ))}
                {topBarbers.length === 0 && <li className="list-item-sub">No data available</li>}
              </ul>
            )}
          </div>

          {/* Top Services */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Top Services</h2>
            </div>
            {isLoading ? (
              <div className="skeleton skeleton-text" style={{ height: '100px' }}></div>
            ) : (
              <ul className="list-widget">
                {topServices.map(service => (
                  <li key={service.serviceId}>
                    <div>
                      <div className="list-item-main">{service.serviceName}</div>
                      <div className="list-item-sub">{service.requestCount} Requests</div>
                    </div>
                    <div className="list-item-value">${service.revenue.toLocaleString()}</div>
                  </li>
                ))}
                {topServices.length === 0 && <li className="list-item-sub">No data available</li>}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
