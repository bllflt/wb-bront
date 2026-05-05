// src/services/partnershipService.js

import api from './api';

const PartnershipService = {

    getAllPartnerships: () => api.get('partnerships'),

    getNamedFactions: () => api.get('partnerships?faction=true'),


    getPartnershipById: (id) => api.get(`partnerships/${id}`),

    createPartnership: (data) => api.post('partnerships', data),

    updatePartnership: (id, data) => api.put(`partnerships/${id}`, data),

    deletePartnership: (id) => api.delete(`partnerships/${id}`),

    getPartnersForPartnership: (partnershipId) =>
        api.get(`partnerships/${partnershipId}/participants`),

    getPartnerById: (partnershipId, partnerId) =>
        api.get(`partnerships/${partnershipId}/participants/${partnerId}`),

    // The backend now expects an array of participants when adding.
    // Wrap single objects for backward compatibility so callers can pass
    // either a single partner object or an array.
    addPartnerToPartnership: (partnershipId, partnerData) => {
        const payload = Array.isArray(partnerData) ? partnerData : [partnerData];
        return api.post(`/partnerships/${partnershipId}/participants`, payload);
    },

    updatePartnerInPartnership: (partnershipId, partnerId, partnerData) =>
        api.put(`/partnerships/${partnershipId}/participants/${partnerId}`, partnerData),

    removePartnerFromPartnership: (partnershipId, partnerId) =>
        api.delete(`/partnerships/${partnershipId}/participants/${partnerId}`),
};

export default PartnershipService;