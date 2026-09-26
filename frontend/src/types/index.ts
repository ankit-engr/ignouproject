export type UserRole = 'admin' | 'project_leader' | 'project_manager' | 'team_member';

export interface UserBrief {
  id: number;
  email?: string;
  full_name: string;
  role: UserRole;
  role_display: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export type ProjectStatus = 'active' | 'completed';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Project {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  task_count: number;
  completed_task_count: number;
  progress_percent: number;
  is_overdue: boolean;
  owner: UserBrief;
  project_manager: UserBrief | null;
  project_manager_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  tasks: Task[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null;
  assignee_id: number | null;
  assignee: UserBrief | null;
  is_overdue: boolean;
  project: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProjectFormData {
  title: string;
  description: string;
  status: ProjectStatus;
  deadline: string;
  project_manager_id: number | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string;
  assignee_id: number | null;
}

export interface ReportsSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  unassigned_tasks: number;
  overall_progress: number;
}

export interface ProjectReportRow {
  id: number;
  title: string;
  status: ProjectStatus;
  deadline: string | null;
  is_overdue: boolean;
  task_count: number;
  completed_task_count: number;
  progress_percent: number;
  owner: UserBrief;
}

export interface OverdueTaskRow {
  id: number;
  title: string;
  status: TaskStatus;
  due_date: string;
  project_id: number;
  project_title: string;
  assignee: UserBrief | null;
}

export interface AssigneeWorkload {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  role_display: string;
  total_tasks: number;
  done_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  progress_percent: number;
}

export interface ReportsData {
  summary: ReportsSummary;
  projects: ProjectReportRow[];
  overdue_tasks: OverdueTaskRow[];
  by_assignee: AssigneeWorkload[];
  role_counts: Record<string, number>;
  generated_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  project_leader: 'Project Leader',
  project_manager: 'Project Manager',
  team_member: 'Team Member',
};
