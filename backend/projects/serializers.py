from rest_framework import serializers
from users.serializers import UserBriefSerializer
from users.models import User
from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_detail = UserBriefSerializer(source='assignee', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        source='assignee',
        queryset=User.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'due_date',
            'assignee_id', 'assignee_detail', 'is_overdue',
            'created_at', 'updated_at', 'project',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'project', 'assignee_detail', 'is_overdue')

    def validate_status(self, value):
        valid = ['todo', 'in-progress', 'done']
        if value not in valid:
            raise serializers.ValidationError(f'Status must be one of: {", ".join(valid)}')
        return value

    def validate_due_date(self, value):
        return value or None

    def validate_assignee_id(self, value):
        """Enforce hierarchy: Leader→Manager/Member, Manager→Member, Admin→all."""
        if value is None:
            return value
        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        from users.permissions import can_assign_to_user
        from users.models import User as U
        labels = dict(U.ROLE_CHOICES)
        if actor and not can_assign_to_user(actor, value):
            raise serializers.ValidationError(
                f'As {labels.get(actor.role, actor.role)} you cannot assign tasks to '
                f'{value.full_name} ({labels.get(value.role, value.role)}). '
                f'Follow the role hierarchy.'
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['assignee'] = data.pop('assignee_detail')
        data['assignee_id'] = instance.assignee_id
        return data


class ProjectSerializer(serializers.ModelSerializer):
    task_count = serializers.ReadOnlyField()
    completed_task_count = serializers.ReadOnlyField()
    progress_percent = serializers.ReadOnlyField()
    is_overdue = serializers.BooleanField(read_only=True)
    owner_detail = UserBriefSerializer(source='owner', read_only=True)
    project_manager_detail = UserBriefSerializer(source='project_manager', read_only=True)
    project_manager_id = serializers.PrimaryKeyRelatedField(
        source='project_manager',
        queryset=User.objects.filter(is_active=True, role=User.ROLE_PROJECT_MANAGER),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Project
        fields = (
            'id', 'title', 'description', 'status', 'deadline',
            'project_manager_id', 'project_manager_detail',
            'task_count', 'completed_task_count', 'progress_percent', 'is_overdue',
            'owner_detail', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at', 'task_count',
            'completed_task_count', 'progress_percent', 'is_overdue',
            'owner_detail', 'project_manager_detail',
        )

    def validate_status(self, value):
        valid = ['active', 'completed']
        if value not in valid:
            raise serializers.ValidationError(f'Status must be one of: {", ".join(valid)}')
        return value

    def validate_deadline(self, value):
        return value or None

    def validate_project_manager_id(self, value):
        if value is None:
            return value
        if value.role != User.ROLE_PROJECT_MANAGER:
            raise serializers.ValidationError('Selected user must have the Project Manager role.')
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['owner'] = data.pop('owner_detail')
        data['project_manager'] = data.pop('project_manager_detail')
        data['project_manager_id'] = instance.project_manager_id
        return data


class ProjectDetailSerializer(ProjectSerializer):
    tasks = serializers.SerializerMethodField()

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ('tasks',)

    def get_tasks(self, obj):
        from .permissions import can_manage_tasks, visible_tasks_queryset
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        qs = obj.tasks.select_related('assignee').all()
        if user and user.is_authenticated:
            qs = visible_tasks_queryset(user, obj, qs)
        return TaskSerializer(qs, many=True, context=self.context).data
