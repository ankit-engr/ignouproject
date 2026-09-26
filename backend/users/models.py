from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_ADMIN = 'admin'
    ROLE_PROJECT_LEADER = 'project_leader'
    ROLE_PROJECT_MANAGER = 'project_manager'
    ROLE_TEAM_MEMBER = 'team_member'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_PROJECT_LEADER, 'Project Leader'),
        (ROLE_PROJECT_MANAGER, 'Project Manager'),
        (ROLE_TEAM_MEMBER, 'Team Member'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_TEAM_MEMBER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.email

    @property
    def role_display(self):
        return dict(self.ROLE_CHOICES).get(self.role, self.role)

    def can_manage_projects(self):
        return self.role in {
            self.ROLE_ADMIN,
            self.ROLE_PROJECT_LEADER,
            self.ROLE_PROJECT_MANAGER,
        }
