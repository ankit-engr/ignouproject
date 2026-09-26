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
        today = date.today()
        rahul = User.objects.create_user(
            email='rahul.mehta@flowtrack.in',
            password='Rahul@123',
            first_name='Rahul',
            last_name='Mehta',
            role=User.ROLE_PROJECT_LEADER,
        )
        sneha = User.objects.create_user(
            email='sneha.patil@flowtrack.in',
            password='Sneha@123',
            first_name='Sneha',
            last_name='Patil',
            role=User.ROLE_PROJECT_MANAGER,
        )
        amit = User.objects.create_user(
            email='amit.yadav@flowtrack.in',
            password='Amit@123',
            first_name='Amit',
            last_name='Yadav',
            role=User.ROLE_TEAM_MEMBER,
        )
        project = Project.objects.create(
            owner=rahul,
            title='DigiNagar Municipal Portal',
            description='Citizen services portal for Delhi NCR under Digital India.',
            status='active',
            deadline=today + timedelta(days=30),
        )
        Task.objects.create(
            project=project,
            title='Aadhaar eKYC integration',
            status='todo',
            due_date=today + timedelta(days=10),
            description='UIDAI eKYC sandbox integration.',
            assignee=amit,
        )
        Task.objects.create(
            project=project,
            title='Hindi–English bilingual UI',
            status='in-progress',
            due_date=today + timedelta(days=3),
            description='Citizen forms with Devanagari support.',
            assignee=sneha,
        )
except Exception:
    pass

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
