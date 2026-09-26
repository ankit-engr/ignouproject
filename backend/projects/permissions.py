"""
ERP role helpers for FlowTrack.

Admin           — full system access
Project Leader  — create projects; create/assign tasks (to Managers); own-project control
Project Manager — create projects; on owned OR collaborating projects: create/assign/manage
                  tasks (assign Team Members); update task work
Team Member     — no create; view/update ONLY tasks assigned to them
"""
from users.models import User


MANAGEMENT_ROLES = {
    User.ROLE_ADMIN,
    User.ROLE_PROJECT_LEADER,
    User.ROLE_PROJECT_MANAGER,
}


def is_admin(user) -> bool:
    return bool(user and user.role == User.ROLE_ADMIN)


def is_manager_role(user) -> bool:
    return bool(user and user.role in MANAGEMENT_ROLES)


def is_team_member(user) -> bool:
    return bool(user and user.role == User.ROLE_TEAM_MEMBER)


def is_project_manager(user) -> bool:
    return bool(user and user.role == User.ROLE_PROJECT_MANAGER)


def is_project_leader(user) -> bool:
    return bool(user and user.role == User.ROLE_PROJECT_LEADER)


def can_create_project(user) -> bool:
    """Admin, Project Leader, Project Manager may create projects."""
    return is_manager_role(user)


def can_manage_project(user, project) -> bool:
    """Edit/delete project settings — owner or Admin only."""
    if not user or not project:
        return False
    if is_admin(user):
        return True
    if is_team_member(user):
        return False
    return project.owner_id == user.id


def _is_designated_manager(user, project) -> bool:
    """User is the project's chosen Project Manager."""
    return bool(
        user and project and project.project_manager_id
        and project.project_manager_id == user.id
        and user.role == User.ROLE_PROJECT_MANAGER
    )


def _is_collaborating_manager(user, project) -> bool:
    """Project Manager assigned on tasks OR designated on the project."""
    if not is_project_manager(user) or not project:
        return False
    if _is_designated_manager(user, project):
        return True
    return project.tasks.filter(assignee_id=user.id).exists()


def can_manage_tasks(user, project) -> bool:
    """
    Create / assign / delete / fully edit tasks.
    - Admin: always
    - Owner (Leader or Manager): always on own project
    - Project Manager collaborating (assigned on project): yes
    - Team Member: never
    """
    if not user or not project:
        return False
    if is_admin(user):
        return True
    if is_team_member(user):
        return False
    if project.owner_id == user.id:
        return True
    return _is_collaborating_manager(user, project)


def can_view_project(user, project) -> bool:
    if not user or not project:
        return False
    if is_admin(user):
        return True
    if project.owner_id == user.id:
        return True
    if project.project_manager_id == user.id:
        return True
    return project.tasks.filter(assignee=user).exists()


def can_create_task(user, project) -> bool:
    return can_manage_tasks(user, project)


def can_assign_tasks(user, project) -> bool:
    return can_manage_tasks(user, project)


def can_delete_task(user, task) -> bool:
    return can_manage_tasks(user, task.project)


def can_update_task(user, task) -> bool:
    if can_manage_tasks(user, task.project):
        return True
    # Team Member — only their assigned tasks
    if is_team_member(user) and task.assignee_id == user.id:
        return True
    # Project Manager working a task assigned to them (status/progress)
    if is_project_manager(user) and task.assignee_id == user.id:
        return True
    return False


def can_edit_task_fields(user, task) -> bool:
    """Full edit (title, assignee, due date) vs status-only for assignees."""
    return can_manage_tasks(user, task.project)


def visible_tasks_queryset(user, project, base_qs):
    """Team Members only see their own tasks; others with access see all."""
    if is_team_member(user) and not can_manage_tasks(user, project):
        return base_qs.filter(assignee=user)
    return base_qs
