from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.users_url = reverse('user-list')

    def test_public_register_closed(self):
        data = {
            'email': 'test@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'Test',
            'last_name': 'User',
        }
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        User.objects.create_user(email='login@example.com', password='Test1234!')
        res = self.client.post(self.login_url, {'email': 'login@example.com', 'password': 'Test1234!'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('user', res.data)

    def test_login_wrong_password(self):
        User.objects.create_user(email='user@example.com', password='Test1234!')
        res = self.client.post(self.login_url, {'email': 'user@example.com', 'password': 'wrong'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint(self):
        user = User.objects.create_user(email='me@example.com', password='Test1234!')
        self.client.force_authenticate(user=user)
        res = self.client.get(reverse('me'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'me@example.com')
        self.assertIn('role', res.data)

    def test_admin_can_create_leader(self):
        admin = User.objects.create_user(
            email='admin@example.com', password='Test1234!', role=User.ROLE_ADMIN
        )
        self.client.force_authenticate(user=admin)
        res = self.client.post(self.users_url, {
            'email': 'leader@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'Rahul',
            'last_name': 'Mehta',
            'role': 'project_leader',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['role'], 'project_leader')

    def test_leader_can_create_manager_not_admin(self):
        leader = User.objects.create_user(
            email='leader@example.com', password='Test1234!', role=User.ROLE_PROJECT_LEADER
        )
        self.client.force_authenticate(user=leader)
        ok = self.client.post(self.users_url, {
            'email': 'mgr@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'Sneha',
            'last_name': 'Patil',
            'role': 'project_manager',
        })
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)
        bad = self.client.post(self.users_url, {
            'email': 'admin2@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'X',
            'last_name': 'Y',
            'role': 'admin',
        })
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_manager_can_create_member_only(self):
        manager = User.objects.create_user(
            email='mgr@example.com', password='Test1234!', role=User.ROLE_PROJECT_MANAGER
        )
        self.client.force_authenticate(user=manager)
        ok = self.client.post(self.users_url, {
            'email': 'member@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'Amit',
            'last_name': 'Yadav',
            'role': 'team_member',
        })
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)
        bad = self.client.post(self.users_url, {
            'email': 'leader2@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'X',
            'last_name': 'Y',
            'role': 'project_leader',
        })
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_team_member_cannot_create_users(self):
        member = User.objects.create_user(
            email='member@example.com', password='Test1234!', role=User.ROLE_TEAM_MEMBER
        )
        self.client.force_authenticate(user=member)
        res = self.client.post(self.users_url, {
            'email': 'x@example.com',
            'password': 'Test1234!',
            'password2': 'Test1234!',
            'first_name': 'X',
            'last_name': 'Y',
            'role': 'team_member',
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class TaskAssignmentHierarchyTests(TestCase):
    def setUp(self):
        from projects.models import Project
        self.client = APIClient()
        self.leader = User.objects.create_user(
            email='lead@example.com', password='Test1234!', role=User.ROLE_PROJECT_LEADER
        )
        self.manager = User.objects.create_user(
            email='mgr@example.com', password='Test1234!', role=User.ROLE_PROJECT_MANAGER
        )
        self.member = User.objects.create_user(
            email='mem@example.com', password='Test1234!', role=User.ROLE_TEAM_MEMBER
        )
        self.other_leader = User.objects.create_user(
            email='lead2@example.com', password='Test1234!', role=User.ROLE_PROJECT_LEADER
        )
        self.project = Project.objects.create(owner=self.leader, title='P', status='active')
        self.mgr_project = Project.objects.create(owner=self.manager, title='M', status='active')
        self.url = f'/api/projects/{self.project.id}/tasks/'
        self.mgr_url = f'/api/projects/{self.mgr_project.id}/tasks/'

    def test_leader_assigns_manager_only(self):
        self.client.force_authenticate(user=self.leader)
        ok = self.client.post(self.url, {
            'title': 'For manager', 'status': 'todo', 'assignee_id': self.manager.id,
        })
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)
        bad = self.client.post(self.url, {
            'title': 'For member', 'status': 'todo', 'assignee_id': self.member.id,
        })
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_collaborating_manager_can_create_member_tasks(self):
        """After Leader assigns Manager, Manager can add Team Member tasks on that project."""
        self.client.force_authenticate(user=self.leader)
        self.client.post(self.url, {
            'title': 'Delegate to manager', 'status': 'todo', 'assignee_id': self.manager.id,
        })
        self.client.force_authenticate(user=self.manager)
        res = self.client.post(self.url, {
            'title': 'Member coding', 'status': 'todo', 'assignee_id': self.member.id,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_member_sees_only_own_tasks(self):
        from projects.models import Task
        Task.objects.create(project=self.mgr_project, title='Mine', status='todo', assignee=self.member)
        Task.objects.create(project=self.mgr_project, title='Other', status='todo')  # unassigned
        self.client.force_authenticate(user=self.member)
        res = self.client.get(f'/api/projects/{self.mgr_project.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [t['title'] for t in res.data['tasks']]
        self.assertEqual(titles, ['Mine'])

    def test_leader_cannot_assign_other_leader(self):
        self.client.force_authenticate(user=self.leader)
        res = self.client.post(self.url, {
            'title': 'Bad', 'status': 'todo', 'assignee_id': self.other_leader.id,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_manager_assigns_member_only(self):
        self.client.force_authenticate(user=self.manager)
        ok = self.client.post(self.mgr_url, {
            'title': 'Member work', 'status': 'todo', 'assignee_id': self.member.id,
        })
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)
        # Manager cannot assign to a Project Leader
        bad = self.client.post(self.mgr_url, {
            'title': 'Bad', 'status': 'todo', 'assignee_id': self.leader.id,
        })
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        # Manager cannot assign to another Project Manager
        other_mgr = User.objects.create_user(
            email='mgr2@example.com', password='Test1234!', role=User.ROLE_PROJECT_MANAGER
        )
        bad2 = self.client.post(self.mgr_url, {
            'title': 'Bad2', 'status': 'todo', 'assignee_id': other_mgr.id,
        })
        self.assertEqual(bad2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assignable_users_endpoint(self):
        self.client.force_authenticate(user=self.leader)
        res = self.client.get('/api/auth/users/?assignable=1')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        roles = {u['role'] for u in res.data}
        self.assertEqual(roles, {'project_manager'})

        self.client.force_authenticate(user=self.manager)
        res2 = self.client.get('/api/auth/users/?assignable=1')
        roles2 = {u['role'] for u in res2.data}
        self.assertEqual(roles2, {'team_member'})
