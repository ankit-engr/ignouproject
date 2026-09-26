from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, RegisterView, MeView, UserListCreateView,
    CreatableRolesView, TeamDirectoryView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('creatable-roles/', CreatableRolesView.as_view(), name='creatable-roles'),
    path('team-directory/', TeamDirectoryView.as_view(), name='team-directory'),
]
