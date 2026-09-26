from django.db.models import Q, Count, Case, When, IntegerField
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from users.models import User
from .models import Project, Task
from .serializers import ProjectSerializer, ProjectDetailSerializer, TaskSerializer
from .permissions import (
    can_create_project,
    can_manage_project,
    can_manage_tasks,
    can_create_task,
    can_assign_tasks,
    can_delete_task,
    can_update_task,
    can_edit_task_fields,
    visible_tasks_queryset,
    is_admin,
    is_team_member,
)


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status', 'deadline']

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            queryset = Project.objects.all()
        else:
            queryset = Project.objects.filter(
                Q(owner=user) | Q(project_manager=user) | Q(tasks__assignee=user)
            ).distinct()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.select_related('owner', 'project_manager').prefetch_related('tasks__assignee')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        if not can_create_project(self.request.user):
            raise PermissionDenied('Only Admin, Project Leader, or Project Manager can create projects.')
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        project = self.get_object()
        if not can_manage_project(self.request.user, project):
            raise PermissionDenied('You do not have permission to edit this project.')
        serializer.save()

    def perform_destroy(self, instance):
        if not can_manage_project(self.request.user, instance):
            raise PermissionDenied('Only the project owner (Leader/Manager) or Admin can delete this project.')
        instance.delete()


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'due_date', 'status']
    pagination_class = None

    def _get_accessible_project(self):
        project_id = self.kwargs.get('project_pk')
        user = self.request.user
        if is_admin(user):
            return Project.objects.filter(id=project_id).first()
        return Project.objects.filter(
            Q(id=project_id) & (
                Q(owner=user) | Q(project_manager=user) | Q(tasks__assignee=user)
            )
        ).distinct().first()

    def get_queryset(self):
        project = self._get_accessible_project()
        if not project:
            return Task.objects.none()
        user = self.request.user
        queryset = Task.objects.filter(project=project).select_related('assignee')
        queryset = visible_tasks_queryset(user, project, queryset)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        assignee = self.request.query_params.get('assignee')
        if assignee:
            queryset = queryset.filter(assignee_id=assignee)
        return queryset

    def perform_create(self, serializer):
        project = self._get_accessible_project()
        if not project:
            raise PermissionDenied('Project not found or access denied.')
        user = self.request.user
        if not can_create_task(user, project):
            raise PermissionDenied(
                'Only Admin, Project Leader (owner), or Project Manager (owner/collaborator) can add tasks.'
            )
        if 'assignee' in serializer.validated_data and not can_assign_tasks(user, project):
            raise PermissionDenied('You cannot assign tasks.')
        serializer.save(project=project)

    def perform_update(self, serializer):
        task = self.get_object()
        user = self.request.user
        if not can_update_task(user, task):
            raise PermissionDenied('You can only update tasks assigned to you.')

        # Assignees without manage rights: status-only
        if not can_edit_task_fields(user, task):
            allowed = {'status'}
            incoming = set(serializer.validated_data.keys())
            if not incoming.issubset(allowed):
                raise PermissionDenied(
                    'You can only update task status on tasks assigned to you.'
                )
        else:
            if 'assignee' in serializer.validated_data and not can_assign_tasks(user, task.project):
                raise PermissionDenied('You cannot reassign tasks.')

        serializer.save()

    def perform_destroy(self, instance):
        if not can_delete_task(self.request.user, instance):
            raise PermissionDenied('Only Admin / Project Leader / Project Manager can delete tasks.')
        instance.delete()


class ReportsView(APIView):
    """Progress tracking and deadline reports — scoped by role."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        if is_admin(user):
            projects = Project.objects.all()
            tasks = Task.objects.all()
        elif is_team_member(user):
            projects = Project.objects.filter(tasks__assignee=user).distinct()
            tasks = Task.objects.filter(assignee=user)
        else:
            projects = Project.objects.filter(
                Q(owner=user) | Q(project_manager=user) | Q(tasks__assignee=user)
            ).distinct()
            tasks = Task.objects.filter(project__in=projects)

        projects = projects.annotate(
            _task_count=Count('tasks'),
            _done_count=Count(Case(When(tasks__status='done', then=1), output_field=IntegerField())),
        )

        total_projects = projects.count()
        active_projects = projects.filter(status='active').count()
        completed_projects = projects.filter(status='completed').count()
        overdue_projects = projects.filter(status='active', deadline__lt=today).count()

        total_tasks = tasks.count()
        todo_tasks = tasks.filter(status='todo').count()
        in_progress_tasks = tasks.filter(status='in-progress').count()
        done_tasks = tasks.filter(status='done').count()
        overdue_tasks = tasks.filter(~Q(status='done'), due_date__lt=today).count()
        unassigned_tasks = tasks.filter(assignee__isnull=True).exclude(status='done').count()
        overall_progress = round((done_tasks / total_tasks) * 100) if total_tasks else 0

        project_reports = []
        for p in projects.select_related('owner').order_by('deadline', '-created_at'):
            tc = p._task_count
            dc = p._done_count
            # For team members, show progress on their tasks within the project
            if is_team_member(user):
                my_tasks = tasks.filter(project=p)
                tc = my_tasks.count()
                dc = my_tasks.filter(status='done').count()
            project_reports.append({
                'id': p.id,
                'title': p.title,
                'status': p.status,
                'deadline': p.deadline,
                'is_overdue': bool(p.deadline and p.status != 'completed' and p.deadline < today),
                'task_count': tc,
                'completed_task_count': dc,
                'progress_percent': round((dc / tc) * 100) if tc else 0,
                'owner': {
                    'id': p.owner.id,
                    'full_name': p.owner.full_name,
                    'role': p.owner.role,
                    'role_display': p.owner.role_display,
                },
            })

        overdue_task_list = []
        for t in tasks.filter(~Q(status='done'), due_date__lt=today).select_related('assignee', 'project')[:50]:
            overdue_task_list.append({
                'id': t.id,
                'title': t.title,
                'status': t.status,
                'due_date': t.due_date,
                'project_id': t.project_id,
                'project_title': t.project.title,
                'assignee': {
                    'id': t.assignee.id,
                    'full_name': t.assignee.full_name,
                    'role_display': t.assignee.role_display,
                } if t.assignee else None,
            })

        by_assignee = []
        if not is_team_member(user):
            assignee_ids = tasks.exclude(assignee=None).values_list('assignee_id', flat=True).distinct()
            for uid in assignee_ids:
                u = User.objects.filter(id=uid).first()
                if not u:
                    continue
                utasks = tasks.filter(assignee=u)
                done = utasks.filter(status='done').count()
                total = utasks.count()
                by_assignee.append({
                    'id': u.id,
                    'full_name': u.full_name,
                    'email': u.email,
                    'role': u.role,
                    'role_display': u.role_display,
                    'total_tasks': total,
                    'done_tasks': done,
                    'in_progress_tasks': utasks.filter(status='in-progress').count(),
                    'overdue_tasks': utasks.filter(~Q(status='done'), due_date__lt=today).count(),
                    'progress_percent': round((done / total) * 100) if total else 0,
                })
            by_assignee.sort(key=lambda x: x['total_tasks'], reverse=True)

        role_counts = {
            label: User.objects.filter(role=key, is_active=True).count()
            for key, label in User.ROLE_CHOICES
        }

        return Response({
            'summary': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'completed_projects': completed_projects,
                'overdue_projects': overdue_projects,
                'total_tasks': total_tasks,
                'todo_tasks': todo_tasks,
                'in_progress_tasks': in_progress_tasks,
                'done_tasks': done_tasks,
                'overdue_tasks': overdue_tasks,
                'unassigned_tasks': unassigned_tasks,
                'overall_progress': overall_progress,
            },
            'projects': project_reports,
            'overdue_tasks': overdue_task_list,
            'by_assignee': by_assignee,
            'role_counts': role_counts,
            'generated_at': timezone.now().isoformat(),
        })
