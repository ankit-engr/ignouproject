from rest_framework import serializers
from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at', 'project')
        read_only_fields = ('id', 'created_at', 'updated_at', 'project')

    def validate_status(self, value):
        valid = ['todo', 'in-progress', 'done']
        if value not in valid:
            raise serializers.ValidationError(f'Status must be one of: {", ".join(valid)}')
        return value


class ProjectSerializer(serializers.ModelSerializer):
    task_count = serializers.ReadOnlyField()
    completed_task_count = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = ('id', 'title', 'description', 'status', 'task_count', 'completed_task_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_status(self, value):
        valid = ['active', 'completed']
        if value not in valid:
            raise serializers.ValidationError(f'Status must be one of: {", ".join(valid)}')
        return value


class ProjectDetailSerializer(ProjectSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ('tasks',)
