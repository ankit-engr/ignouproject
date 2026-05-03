from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from projects.models import Project, Task


class ProjectTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='user@example.com', password='Test1234!')
        self.other = User.objects.create_user(email='other@example.com', password='Test1234!')
        self.client.force_authenticate(user=self.user)

    def test_create_project(self):
        res = self.client.post('/api/projects/', {'title': 'Test', 'description': 'Desc', 'status': 'active'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Test')

    def test_list_own_projects_only(self):
        Project.objects.create(owner=self.user, title='Mine', status='active')
        Project.objects.create(owner=self.other, title='Theirs', status='active')
        res = self.client.get('/api/projects/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

    def test_update_project(self):
        p = Project.objects.create(owner=self.user, title='Old', status='active')
        res = self.client.patch(f'/api/projects/{p.id}/', {'title': 'New'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], 'New')

    def test_delete_project(self):
        p = Project.objects.create(owner=self.user, title='Delete Me', status='active')
        res = self.client.delete(f'/api/projects/{p.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_access_other_project(self):
        p = Project.objects.create(owner=self.other, title='Private', status='active')
        res = self.client.get(f'/api/projects/{p.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_projects(self):
        Project.objects.create(owner=self.user, title='Alpha Project', status='active')
        Project.objects.create(owner=self.user, title='Beta Project', status='active')
        res = self.client.get('/api/projects/?search=Alpha')
        self.assertEqual(res.data['count'], 1)

    def test_filter_projects_by_status(self):
        Project.objects.create(owner=self.user, title='Active', status='active')
        Project.objects.create(owner=self.user, title='Done', status='completed')
        res = self.client.get('/api/projects/?status=active')
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['status'], 'active')

    def test_project_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get('/api/projects/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_project_status(self):
        res = self.client.post('/api/projects/', {'title': 'Test', 'status': 'invalid'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class TaskTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='user@example.com', password='Test1234!')
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(owner=self.user, title='Project', status='active')

    def _tasks_url(self):
        return f'/api/projects/{self.project.id}/tasks/'

    def test_create_task(self):
        res = self.client.post(self._tasks_url(), {'title': 'Task 1', 'status': 'todo'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Task 1')

    def test_filter_tasks_by_status(self):
        Task.objects.create(project=self.project, title='T1', status='todo')
        Task.objects.create(project=self.project, title='T2', status='done')
        res = self.client.get(self._tasks_url() + '?status=todo')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Response is a list (not paginated for tasks)
        statuses = [t['status'] for t in res.data]
        self.assertTrue(all(s == 'todo' for s in statuses))
        self.assertEqual(len(statuses), 1)

    def test_update_task_status(self):
        task = Task.objects.create(project=self.project, title='Old', status='todo')
        res = self.client.patch(f'{self._tasks_url()}{task.id}/', {'status': 'done'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'done')

    def test_delete_task(self):
        task = Task.objects.create(project=self.project, title='Delete', status='todo')
        res = self.client.delete(f'{self._tasks_url()}{task.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthenticated_access_denied(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self._tasks_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_task_status(self):
        res = self.client.post(self._tasks_url(), {'title': 'T', 'status': 'invalid'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_task_with_due_date(self):
        res = self.client.post(self._tasks_url(), {'title': 'Dated', 'status': 'todo', 'due_date': '2025-12-31'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['due_date'], '2025-12-31')
