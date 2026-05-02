import api from '../../services/api';

const hrService = {
  getDashboard: () => api.get('/dashboard/hr'),

  // Employees
  listEmployees: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/employees?${query}`);
  },
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.patch(`/employees/${id}`, data),
  sendCredentials: (id) => api.post(`/employees/${id}/send-credentials`),

  // Attendance
  getAttendance: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/attendance?${query}`);
  },
  getRegularizationQueue: () => api.get('/attendance/regularize'),
  updateRegularizationStatus: (id, status) => api.patch(`/attendance/regularize/${id}`, { status }),
  getEmployeeAttendance: (employeeId) => api.get(`/attendance/employee/${employeeId}`),
  getEmployeeLeaves: (employeeId) => api.get(`/leave/employee/${employeeId}`),

  // Leave
  getLeaveQueue: () => api.get('/leave/queue'),
  updateLeaveStatus: (id, status, adminNote) =>
    api.patch(`/leave/${id}/status`, { status, adminNote }),
  getAllocations: () => api.get('/leave/allocation'),
  allocateLeave: (data) => api.post('/leave/allocation', data),

  // Upcoming leaves for a date range (reports endpoint returns leaves)
  getUpcomingLeaves: (startDate, endDate, department) => {
    const params = new URLSearchParams({ startDate, endDate, department }).toString();
    return api.get(`/reports/leave?${params}`);
  },
};

export default hrService;
