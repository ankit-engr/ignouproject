from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from .permissions import can_create_role, roles_creatable_by


class RegisterSerializer(serializers.ModelSerializer):
    """Public self-registration is disabled — users are created by Admin/Leader/Manager."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.ROLE_TEAM_MEMBER, required=False)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        raise serializers.ValidationError(
            'Public registration is closed. Ask Admin, Project Leader, or Project Manager to create your account.'
        )


class ManagedUserCreateSerializer(serializers.ModelSerializer):
    """Create users according to hierarchical role rules."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        request = self.context.get('request')
        actor = getattr(request, 'user', None)
        role = attrs.get('role')
        if not can_create_role(actor, role):
            allowed = roles_creatable_by(actor)
            labels = dict(User.ROLE_CHOICES)
            allowed_names = ', '.join(labels.get(r, r) for r in allowed) or 'none'
            raise serializers.ValidationError({
                'role': f'Your role cannot create "{labels.get(role, role)}". You may create: {allowed_names}.'
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, role=role, **validated_data)
        if role == User.ROLE_ADMIN:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        return user


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'role_display')


class UserBriefSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'role_display')
