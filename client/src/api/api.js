import axios from "axios";

// Default backend base (can be overridden with VITE_API_BASE)
const BACKEND = import.meta.env.VITE_API_BASE || "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: BACKEND,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  // register requires multipart/form-data (eSign image)
  register: formData =>
    api.post(`/auth/register`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  login: payload => api.post(`/auth/login`, payload),
  verifyEmail: token => api.get(`/auth/verify-email/${token}`),
};

// Users
export const users = {
  me: () => api.get(`/users/me`),
  getPublic: userId => api.get(`/users/${userId}/public`),
  getPrivate: userId => api.get(`/users/${userId}/private`),
  search: query => api.get(`/users/search?q=${query}`),
  // updateMe can accept either a JSON payload or FormData (for avatar upload)
  updateMe: payload => {
    if (payload instanceof FormData) {
      return api.patch(`/users/update-me`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.patch(`/users/update-me`, payload);
  },
  toggleRole: payload => api.post(`/users/toggle-my-role`, payload),
  canToggleRole: () => api.get(`/users/can-toggle-role`),
};

// Dashboard endpoints
export const dashboard = {
  myStats: () => api.get(`/dashboard/my-stats`),
  myPending: () => api.get(`/dashboard/my-pending-actions`),
  myActiveContracts: () => api.get(`/dashboard/my-active-contracts`),
  myEndorsers: () => api.get(`/dashboard/my-endorsers`),
  myEndorsees: () => api.get(`/dashboard/my-endorsees`),
  tiHistory: () => api.get(`/dashboard/ti-history`),
  eligibleGuarantors: () => api.get(`/dashboard/eligible-guarantors`),
  eligibleBrochures: () => api.get(`/dashboard/eligible-brochures`),
};

// Brochures
export const brochures = {
  list: () => api.get(`/brochures`),
  getById: id => api.get(`/brochures/${id}`),
  getMy: () => api.get(`/brochures/my`),
  create: payload => api.post(`/brochures`, payload),
  update: (id, payload) => api.patch(`/brochures/${id}`, payload),
  toggleStatus: id => api.patch(`/brochures/${id}/toggle-status`),
  delete: id => api.delete(`/brochures/${id}`),
};

// Loan requests (borrower + lender flows)
export const loanRequests = {
  create: payload => api.post(`/loan-requests`, payload),
  getMy: () => api.get(`/loan-requests/my`),
  getById: id => api.get(`/loan-requests/${id}`),
  cancel: id => api.patch(`/loan-requests/${id}/cancel`),
  listForLender: () => api.get(`/lender/requests`),
  acceptByLender: loanReqId => api.post(`/lender/requests/${loanReqId}/accept`),
};

// Contracts
export const contracts = {
  get: id => api.get(`/contracts/${id}`),
  getMy: () => api.get(`/contracts/my`),
  getEMISchedule: id => api.get(`/contracts/${id}/emi-schedule`),
  getPaymentHistory: id => api.get(`/contracts/${id}/payment-history`),
  downloadPdf: id =>
    api.get(`/contracts/${id}/download-pdf`, { responseType: "blob" }),
  sign: id => api.post(`/contracts/${id}/sign`),
  confirmReceipt: id => api.post(`/contracts/${id}/confirm-receipt`),
  initiateDisbursalPayment: id =>
    api.post(`/contracts/${id}/initiate-disbursal`),
  confirmDisbursal: (id, formData) =>
    api.post(`/contracts/${id}/confirm-disbursal`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  receiverUpi: id => api.get(`/contracts/${id}/receiver-upi`),
  disbursalProof: id =>
    api.get(`/contracts/${id}/disbursal-proof`, { responseType: "blob" }),
  triggerDefaultCheck: payload =>
    api.post(`/contracts/admin/trigger-default-check`, payload),
  guarantorPay: id => api.post(`/contracts/${id}/guarantor-pay`),
  simulatePaymentCallback: payload => api.post(`/payments/callback`, payload),
};

// Guarantor requests
export const guarantorRequests = {
  create: payload => api.post(`/guarantor-requests`, payload),
  pending: () => api.get(`/guarantor-requests/pending`),
  respond: (id, payload) => api.patch(`/guarantor-requests/${id}`, payload),
};

// Endorsements
export const endorsements = {
  create: payload => api.post(`/endorsements`, payload),
  given: () => api.get(`/endorsements/given`),
  received: () => api.get(`/endorsements/received`),
  remove: id => api.delete(`/endorsements/${id}`),
};

// Payments
export const payments = {
  pay: payload => api.post(`/payments/pay`, payload),
  uploadProof: formData =>
    api.post(`/payments/proof-upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  acknowledgeProof: paymentId => api.post(`/payments/acknowledge/${paymentId}`),
  disburse: payload => api.post(`/payments/disburse`, payload),
  callback: payload => api.post(`/payments/callback`, payload),
};

// Notifications
export const notifications = {
  list: params => api.get(`/notifications`, { params }),
  getUnreadCount: () => api.get(`/notifications/unread-count`),
  markAsRead: id => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch(`/notifications/mark-all-read`),
  delete: id => api.delete(`/notifications/${id}`),
  create: payload => api.post(`/notifications`, payload),
};

// Debts
export const debts = {
  getMyDebts: () => api.get(`/debts/my`),
  getSummary: () => api.get(`/debts/summary`),
};

// Lender-specific endpoints
export const lender = {
  getStats: () => api.get(`/lender/stats`),
  getMyBrochures: () => api.get(`/lender/brochures`),
  getPendingRequests: params => api.get(`/lender/requests`, { params }),
  getMyContracts: params => api.get(`/lender/contracts`, { params }),
  acceptRequest: requestId => api.post(`/lender/requests/${requestId}/accept`),
  rejectRequest: requestId => api.post(`/lender/requests/${requestId}/reject`),
};
// Support
export const support = {
  submit: (formData) =>
    api.post(`/support`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
