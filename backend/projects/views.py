from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Project, Task
from .serializers import ProjectSerializer, ProjectDetailSerializer, TaskSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']

    def get_queryset(self):
        queryset = Project.objects.filter(owner=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_object(self):
        obj = super().get_object()
        if obj.owner != self.request.user:
            raise PermissionDenied('You do not have permission to access this project.')
        return obj


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'due_date', 'status']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        # Ensure project belongs to user
        project = Project.objects.filter(id=project_id, owner=self.request.user).first()
        if not project:
            return Task.objects.none()
        queryset = Task.objects.filter(project=project)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        project = Project.objects.filter(id=project_id, owner=self.request.user).first()
        if not project:
            raise PermissionDenied('Project not found or access denied.')
        serializer.save(project=project)


# Disable pagination for task lists
TaskViewSet.pagination_class = None
