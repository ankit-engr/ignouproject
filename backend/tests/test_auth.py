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

    def test_register_success(self):
        data = {'email': 'test@example.com', 'password': 'Test1234!', 'password2': 'Test1234!', 'first_name': 'Test', 'last_name': 'User'}
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', res.data)

    def test_register_password_mismatch(self):
        data = {'email': 'test@example.com', 'password': 'Test1234!', 'password2': 'Wrong!'}
        res = self.client.post(self.register_url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        User.objects.create_user(email='dup@example.com', password='Test1234!')
        data = {'email': 'dup@example.com', 'password': 'Test1234!', 'password2': 'Test1234!'}
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
