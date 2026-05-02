import api from './api';

export const settingsService = {
  get:    () => api.get('/settings'),
  update: (patch) => api.patch('/settings', patch),
};

export const payrollService = {
  preview:        ({ month, year, adjustments }) =>
    api.post(`/payroll/preview?month=${month}&year=${year}`, { adjustments: adjustments || [] }),
  process:        (payload) => api.post('/payroll/process', payload),
  listRuns:       () => api.get('/payroll/runs'),
  getRun:         (year, month, version) =>
    api.get(`/payroll/${year}/${month}${version ? `?version=${version}` : ''}`),
};

export const payslipsService = {
  listAll: ({ year, month } = {}) => {
    const q = [year && `year=${year}`, month && `month=${month}`].filter(Boolean).join('&');
    return api.get(`/payslips${q ? `?${q}` : ''}`);
  },
  get:    (id) => api.get(`/payslips/${id}`),
};

export default { settingsService, payrollService, payslipsService };
