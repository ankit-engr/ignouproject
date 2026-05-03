import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.core.management import call_command

try:
    call_command('migrate', '--run-syncdb', verbosity=0)
except Exception:
    pass

try:
    from users.models import User
    from projects.models import Project, Task
    from datetime import date, timedelta

    if not User.objects.exists():
        users_data = [
            {'email': 'demo@example.com', 'password': 'Demo1234!', 'first_name': 'Demo', 'last_name': 'User'},
            {'email': 'alice@example.com', 'password': 'Alice1234!', 'first_name': 'Alice', 'last_name': 'Smith'},
        ]
        created_users = []
        for ud in users_data:
            user, _ = User.objects.get_or_create(email=ud['email'])
            user.set_password(ud['password'])
            user.first_name = ud['first_name']
            user.last_name = ud['last_name']
            user.save()
            created_users.append(user)

        demo_user = created_users[0]
        today = date.today()
        projects_data = [
            {'title': 'Website Redesign', 'description': 'Complete overhaul of company website.', 'status': 'active'},
            {'title': 'Mobile App v2', 'description': 'Second version with new features.', 'status': 'active'},
            {'title': 'Q4 Marketing Campaign', 'description': 'End-of-year marketing push.', 'status': 'completed'},
        ]
        tasks_tmpl = [
            {'title': 'Initial planning & requirements', 'status': 'done', 'due_date': today - timedelta(days=14), 'description': 'Gather all requirements.'},
            {'title': 'Design mockups', 'status': 'in-progress', 'due_date': today + timedelta(days=3), 'description': 'Create wireframes and mockups.'},
            {'title': 'Development sprint 1', 'status': 'todo', 'due_date': today + timedelta(days=10), 'description': 'Implement core features.'},
            {'title': 'QA Testing', 'status': 'todo', 'due_date': today + timedelta(days=20), 'description': 'Full regression testing.'},
        ]
        for pd in projects_data:
            project, _ = Project.objects.get_or_create(
                title=pd['title'], owner=demo_user,
                defaults={'description': pd['description'], 'status': pd['status']}
            )
            for td in tasks_tmpl:
                Task.objects.get_or_create(
                    title=td['title'], project=project,
                    defaults={k: v for k, v in td.items() if k != 'title'}
                )
except Exception:
    pass

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
