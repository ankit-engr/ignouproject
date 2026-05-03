from django.urls import path, include
from rest_framework_nested import routers
from .views import ProjectViewSet, TaskViewSet

router = routers.DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

tasks_router = routers.NestedDefaultRouter(router, r'projects', lookup='project')
tasks_router.register(r'tasks', TaskViewSet, basename='project-tasks')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tasks_router.urls)),
]
