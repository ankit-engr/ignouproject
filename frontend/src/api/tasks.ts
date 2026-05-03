import api from './axios';
import { Task, TaskFormData } from '../types';

export const tasksApi = {
  list: async (projectId: number, params?: { status?: string }) => {
    const res = await api.get<Task[]>(`/projects/${projectId}/tasks/`, { params });
    return res.data;
  },
  create: async (projectId: number, data: TaskFormData) => {
    const res = await api.post<Task>(`/projects/${projectId}/tasks/`, data);
    return res.data;
  },
  update: async (projectId: number, taskId: number, data: Partial<TaskFormData>) => {
    const res = await api.patch<Task>(`/projects/${projectId}/tasks/${taskId}/`, data);
    return res.data;
  },
  delete: async (projectId: number, taskId: number) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}/`);
  },
};
