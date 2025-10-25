// src/services/partnershipService.js

import api from './api';

const PartnershipService = {

    getAllPartnerships: () => api.get('/partnerships'),

    getPartnershipById: (id) => api.get(`/partnerships/${id}`),

    createPartnership: (data) => api.post('/partnerships', data),

    updatePartnership: (id, data) => api.put(`/partnerships/${id}`, data),

    getPartnersForPartnership: (partnershipId) =>
        api.get(`/partnerships/${partnershipId}/partners`),

    getPartnerById: (partnershipId, partnerId) =>
        api.get(`/partnerships/${partnershipId}/participants/${partnerId}`),

    addPartnerToPartnership: (partnershipId, partnerData) =>
        api.post(`/partnerships/${partnershipId}/participants`, partnerData),

    updatePartnerInPartnership: (partnershipId, partnerId, partnerData) =>
        api.put(`/partnerships/${partnershipId}/participants/${partnerId}`, partnerData),

    removePartnerFromPartnership: (partnershipId, partnerId) =>
        api.delete(`/partnerships/${partnershipId}/participants/${partnerId}`),
};

export default PartnershipService;