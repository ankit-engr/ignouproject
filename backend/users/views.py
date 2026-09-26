from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from .serializers import RegisterSerializer, UserSerializer, ManagedUserCreateSerializer
from .permissions import can_manage_users, roles_creatable_by, assignable_users_queryset, roles_assignable_by
from .demo_accounts import DEMO_PASSWORDS


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        data = request.data.copy()
        if 'role' in data and request.user.role != User.ROLE_ADMIN:
            data.pop('role')
        serializer = UserSerializer(request.user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserListCreateView(APIView):
    """
    GET  — team roster (all authenticated users)
    POST — create user (Admin / Project Leader / Project Manager only, hierarchical)
    """
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get(self, request):
        # ?assignable=1 → only users this actor may assign tasks to (hierarchy)
        if request.query_params.get('assignable') in ('1', 'true', 'yes'):
            users = assignable_users_queryset(request.user)
        else:
            users = User.objects.filter(is_active=True).order_by('role', 'first_name', 'email')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        if not can_manage_users(request.user):
            raise PermissionDenied(
                'Only Admin, Project Leader, or Project Manager can create team accounts.'
            )
        serializer = ManagedUserCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class CreatableRolesView(APIView):
    """Roles the current user is allowed to create."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = roles_creatable_by(request.user)
        assignable = roles_assignable_by(request.user)
        labels = dict(User.ROLE_CHOICES)
        return Response({
            'can_manage_users': can_manage_users(request.user),
            'roles': [
                {'value': r, 'label': labels.get(r, r)}
                for r in roles
            ],
            'assignable_roles': [
                {'value': r, 'label': labels.get(r, r)}
                for r in assignable
            ],
        })


class TeamDirectoryView(APIView):
    """
    Public team directory for the login page.
    Lists every active user (Admin, Leader, Manager, Team Member) with demo passwords when known.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        role_order = {
            User.ROLE_ADMIN: 0,
            User.ROLE_PROJECT_LEADER: 1,
            User.ROLE_PROJECT_MANAGER: 2,
            User.ROLE_TEAM_MEMBER: 3,
        }
        users = list(User.objects.filter(is_active=True))
        users.sort(key=lambda u: (role_order.get(u.role, 9), u.first_name.lower(), u.email))
        payload = []
        for u in users:
            payload.append({
                'id': u.id,
                'email': u.email,
                'full_name': u.full_name,
                'role': u.role,
                'role_display': u.role_display,
                'password': DEMO_PASSWORDS.get(u.email),
            })
        return Response(payload)
