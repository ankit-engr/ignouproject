import api from './axios';
import { AuthTokens, User } from '../types';

export const authApi = {
  register: async (data: { email: string; password: string; password2: string; first_name?: string; last_name?: string }) => {
    const res = await api.post<User>('/auth/register/', data);
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await api.post<AuthTokens>('/auth/login/', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get<User>('/auth/me/');
    return res.data;
  },
};
