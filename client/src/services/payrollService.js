import api from './api';

export const payrollService = {
  getDashboardStats:   () => api.get('/dashboard/payroll'),
  previewPayroll:      (month) => api.get(`/payroll/preview?month=${month}`),
  processPayroll:      (month) => api.post('/payroll/process', { month }),
  getPayslips:         (filters) => {
    const q = new URLSearchParams(filters).toString();
    return api.get(`/payslips${q ? `?${q}` : ''}`);
  },
  getPayslipById:      (id) => api.get(`/payslips/${id}`),
  generatePayslipPDF:  (id) => api.post(`/payslips/${id}/generate-pdf`),
  raiseDispute:        (payslipId, reason) => api.post('/payslip-disputes', { payslipId, reason }),
  getDisputes:         (status) => api.get(`/payslip-disputes${status ? `?status=${status}` : ''}`),
  resolveDispute:      (id, note) => api.patch(`/payslip-disputes/${id}/resolve`, { note }),
  reissueDispute:      (id, note) => api.patch(`/payslip-disputes/${id}/reissue`, { note }),
  rejectDispute:       (id, note) => api.patch(`/payslip-disputes/${id}/reject`, { note }),
  getReport:           (type, params) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/reports/${type}${q ? `?${q}` : ''}`);
  }
};

export default payrollService;
