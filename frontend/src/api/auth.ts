import api from './axios';
import { AuthTokens, User, UserRole } from '../types';

export interface CreatableRolesResponse {
  can_manage_users: boolean;
  roles: { value: UserRole; label: string }[];
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<AuthTokens>('/auth/login/', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get<User>('/auth/me/');
    return res.data;
  },
  listUsers: async () => {
    const res = await api.get<User[]>('/auth/users/');
    return res.data;
  },
  listAssignableUsers: async () => {
    const res = await api.get<User[]>('/auth/users/', { params: { assignable: 1 } });
    return res.data;
  },
  teamDirectory: async () => {
    const res = await api.get<Array<{
      id: number;
      email: string;
      full_name: string;
      role: UserRole;
      role_display: string;
      password: string | null;
    }>>('/auth/team-directory/');
    return res.data;
  },
  createUser: async (data: {
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: UserRole;
  }) => {
    const res = await api.post<User>('/auth/users/', data);
    return res.data;
  },
  creatableRoles: async () => {
    const res = await api.get<CreatableRolesResponse>('/auth/creatable-roles/');
    return res.data;
  },
};
