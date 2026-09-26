import { User, UserRole, Project, ProjectDetail, Task } from '../types';

export const MANAGEMENT_ROLES: UserRole[] = ['admin', 'project_leader', 'project_manager'];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  project_leader: 'Project Leader',
  project_manager: 'Project Manager',
  team_member: 'Team Member',
};

/** Who may create which user accounts */
export const CREATABLE_BY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'project_leader', 'project_manager', 'team_member'],
  project_leader: ['project_manager', 'team_member'],
  project_manager: ['team_member'],
  team_member: [],
};

/** Who may be assigned a task by whom (ERP chain) */
export const ASSIGNABLE_BY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'project_leader', 'project_manager', 'team_member'],
  project_leader: ['project_manager'],
  project_manager: ['team_member'],
  team_member: [],
};

export function isAdmin(user?: User | null): boolean {
  return user?.role === 'admin';
}

export function isManagerRole(user?: User | null): boolean {
  return !!user && MANAGEMENT_ROLES.includes(user.role);
}

export function isTeamMember(user?: User | null): boolean {
  return user?.role === 'team_member';
}

export function isProjectManager(user?: User | null): boolean {
  return user?.role === 'project_manager';
}

export function canManageUsers(user?: User | null): boolean {
  return !!user && (CREATABLE_BY[user.role]?.length ?? 0) > 0;
}

export function rolesCreatableBy(user?: User | null): UserRole[] {
  if (!user) return [];
  return CREATABLE_BY[user.role] || [];
}

export function rolesAssignableBy(user?: User | null): UserRole[] {
  if (!user) return [];
  return ASSIGNABLE_BY[user.role] || [];
}

export function canCreateProject(user?: User | null): boolean {
  return isManagerRole(user);
}

/** Edit/delete project — owner or Admin */
export function canManageProject(user?: User | null, project?: Project | null): boolean {
  if (!user || !project) return false;
  if (isAdmin(user)) return true;
  if (isTeamMember(user)) return false;
  return project.owner?.id === user.id;
}

/**
 * Create/assign/delete tasks.
 * Owner, Admin, designated Project Manager, or PM collaborator via assigned task.
 */
export function canManageTasks(
  user?: User | null,
  project?: Project | ProjectDetail | null,
): boolean {
  if (!user || !project) return false;
  if (isAdmin(user)) return true;
  if (isTeamMember(user)) return false;
  if (project.owner?.id === user.id) return true;
  if (
    isProjectManager(user) &&
    (project.project_manager_id === user.id || project.project_manager?.id === user.id)
  ) {
    return true;
  }
  const tasks = 'tasks' in project ? project.tasks : undefined;
  if (isProjectManager(user) && tasks?.some(
    (t) => t.assignee_id === user.id || t.assignee?.id === user.id,
  )) {
    return true;
  }
  return false;
}

export function canCreateTask(user?: User | null, project?: Project | null): boolean {
  return canManageTasks(user, project);
}

export function canAssignTasks(user?: User | null, project?: Project | null): boolean {
  return canManageTasks(user, project);
}

export function canDeleteTask(user?: User | null, task?: Task | null, project?: Project | null): boolean {
  return canManageTasks(user, project);
}

export function canUpdateTask(user?: User | null, task?: Task | null, project?: Project | null): boolean {
  if (canManageTasks(user, project)) return true;
  if (!user || !task) return false;
  const assigned = task.assignee_id === user.id || task.assignee?.id === user.id;
  if (isTeamMember(user) && assigned) return true;
  if (isProjectManager(user) && assigned) return true;
  return false;
}

export function canEditTaskFully(user?: User | null, project?: Project | null): boolean {
  return canManageTasks(user, project);
}

export function roleHelpText(role?: UserRole): string {
  switch (role) {
    case 'admin':
      return 'ERP Admin: create any user, project, or task; assign anyone; full reports.';
    case 'project_leader':
      return 'Create projects, choose a Project Manager, assign work to Managers; manage owned projects.';
    case 'project_manager':
      return 'Manage tasks on projects where you are the designated Manager; assign Team Members.';
    case 'team_member':
      return 'View and update only tasks assigned to you. Cannot create projects or users.';
    default:
      return '';
  }
}
