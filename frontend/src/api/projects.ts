import api from './axios';
import { Project, ProjectDetail, ProjectFormData, PaginatedResponse } from '../types';

export const projectsApi = {
  list: async (params?: { page?: number; search?: string; status?: string }) => {
    const res = await api.get<PaginatedResponse<Project>>('/projects/', { params });
    return res.data;
  },
  get: async (id: number) => {
    const res = await api.get<ProjectDetail>(`/projects/${id}/`);
    return res.data;
  },
  create: async (data: ProjectFormData) => {
    const res = await api.post<Project>('/projects/', data);
    return res.data;
  },
  update: async (id: number, data: Partial<ProjectFormData>) => {
    const res = await api.patch<Project>(`/projects/${id}/`, data);
    return res.data;
  },
  delete: async (id: number) => {
    await api.delete(`/projects/${id}/`);
  },
};
