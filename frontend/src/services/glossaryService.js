import api from './api';

export const glossaryService = {
  listTerms: async (section = null, search = null) => {
    const params = new URLSearchParams();
    if (section && section !== 'all') params.append('section', section);
    if (search) params.append('search', search);
    
    const response = await api.get(`/api/v1/glossary?${params}`);
    return response.data?.data?.terms || [];
  },

  getTerm: async (id) => {
    const response = await api.get(`/api/v1/glossary/${id}`);
    return response.data?.data?.term || null;
  },
};
