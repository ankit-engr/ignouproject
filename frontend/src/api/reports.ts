import api from './axios';
import { ReportsData } from '../types';

export const reportsApi = {
  get: async () => {
    const res = await api.get<ReportsData>('/reports/');
    return res.data;
  },
};
