"""Hierarchical user-creation and task-assignment rules for FlowTrack."""
from users.models import User

# Who may create which roles
CREATABLE_BY = {
    User.ROLE_ADMIN: [
        User.ROLE_ADMIN,
        User.ROLE_PROJECT_LEADER,
        User.ROLE_PROJECT_MANAGER,
        User.ROLE_TEAM_MEMBER,
    ],
    User.ROLE_PROJECT_LEADER: [
        User.ROLE_PROJECT_MANAGER,
        User.ROLE_TEAM_MEMBER,
    ],
    User.ROLE_PROJECT_MANAGER: [
        User.ROLE_TEAM_MEMBER,
    ],
    User.ROLE_TEAM_MEMBER: [],
}

# Task assignment chain (ERP):
#   Admin           → anyone
#   Project Leader  → Project Manager only (delegates work)
#   Project Manager → Team Member only (executes via team)
#   Team Member     → nobody
ASSIGNABLE_ROLES_BY = {
    User.ROLE_ADMIN: [
        User.ROLE_ADMIN,
        User.ROLE_PROJECT_LEADER,
        User.ROLE_PROJECT_MANAGER,
        User.ROLE_TEAM_MEMBER,
    ],
    User.ROLE_PROJECT_LEADER: [
        User.ROLE_PROJECT_MANAGER,
    ],
    User.ROLE_PROJECT_MANAGER: [
        User.ROLE_TEAM_MEMBER,
    ],
    User.ROLE_TEAM_MEMBER: [],
}


def can_manage_users(actor) -> bool:
    return bool(actor and actor.role in CREATABLE_BY and CREATABLE_BY[actor.role])


def roles_creatable_by(actor) -> list:
    if not actor:
        return []
    return list(CREATABLE_BY.get(actor.role, []))


def can_create_role(actor, role: str) -> bool:
    return role in roles_creatable_by(actor)


def roles_assignable_by(actor) -> list:
    if not actor:
        return []
    return list(ASSIGNABLE_ROLES_BY.get(actor.role, []))


def can_assign_to_user(actor, target) -> bool:
    """True if actor may assign a task to target (strict hierarchy)."""
    if not actor or not target:
        return False
    # Admin may assign to anyone including self
    if actor.role == User.ROLE_ADMIN:
        return True
    return target.role in roles_assignable_by(actor)


def assignable_users_queryset(actor):
    """Users the actor is allowed to pick in Assign To."""
    if not actor:
        return User.objects.none()
    if actor.role == User.ROLE_ADMIN:
        return User.objects.filter(is_active=True).order_by('role', 'first_name', 'email')
    roles = roles_assignable_by(actor)
    if not roles:
        return User.objects.none()
    return User.objects.filter(is_active=True, role__in=roles).order_by('role', 'first_name', 'email')
