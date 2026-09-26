from django.contrib import admin
from .models import Project, Task


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'status', 'deadline', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'owner__email')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assignee', 'status', 'due_date')
    list_filter = ('status',)
    search_fields = ('title', 'project__title', 'assignee__email')
    raw_id_fields = ('assignee',)
