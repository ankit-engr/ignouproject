"""
Seed script: creates demo users, projects, and tasks.
Run: python seed.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from projects.models import Project, Task
from datetime import date, timedelta

def seed():
    print("🌱 Seeding database...")

    # Create demo users
    users_data = [
        {'email': 'demo@example.com', 'password': 'Demo1234!', 'first_name': 'Demo', 'last_name': 'User'},
        {'email': 'alice@example.com', 'password': 'Alice1234!', 'first_name': 'Alice', 'last_name': 'Smith'},
    ]
    created_users = []
    for ud in users_data:
        user, created = User.objects.get_or_create(email=ud['email'])
        if created:
            user.set_password(ud['password'])
            user.first_name = ud['first_name']
            user.last_name = ud['last_name']
            user.save()
            print(f"  ✅ Created user: {ud['email']} / {ud['password']}")
        else:
            print(f"  ⏭  User already exists: {ud['email']}")
        created_users.append(user)

    demo_user = created_users[0]

    # Create projects
    projects_data = [
        {
            'title': 'Website Redesign',
            'description': 'Complete overhaul of company website with modern design and improved UX.',
            'status': 'active',
        },
        {
            'title': 'Mobile App v2',
            'description': 'Second version of the mobile application with new features and performance improvements.',
            'status': 'active',
        },
        {
            'title': 'Q4 Marketing Campaign',
            'description': 'End-of-year marketing push across all channels.',
            'status': 'completed',
        },
    ]

    for pd in projects_data:
        project, created = Project.objects.get_or_create(
            title=pd['title'], owner=demo_user,
            defaults={'description': pd['description'], 'status': pd['status']}
        )
        if created:
            print(f"  ✅ Created project: {pd['title']}")
        else:
            print(f"  ⏭  Project already exists: {pd['title']}")

        # Add tasks to each project
        today = date.today()
        tasks = [
            {'title': 'Initial planning & requirements', 'status': 'done', 'due_date': today - timedelta(days=14), 'description': 'Gather all requirements and create project plan.'},
            {'title': 'Design mockups', 'status': 'in-progress', 'due_date': today + timedelta(days=3), 'description': 'Create wireframes and high-fidelity mockups.'},
            {'title': 'Development sprint 1', 'status': 'todo', 'due_date': today + timedelta(days=10), 'description': 'Implement core features.'},
            {'title': 'QA Testing', 'status': 'todo', 'due_date': today + timedelta(days=20), 'description': 'Full regression testing.'},
        ]
        for td in tasks:
            task, tcreated = Task.objects.get_or_create(
                title=td['title'], project=project,
                defaults={k: v for k, v in td.items() if k != 'title'}
            )
            if tcreated:
                print(f"    ✅ Task: {td['title']}")

    print("\n✨ Seed complete!")
    print("  Login: demo@example.com / Demo1234!")
    print("  Login: alice@example.com / Alice1234!")

if __name__ == '__main__':
    seed()
