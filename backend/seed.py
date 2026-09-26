"""
Seed script: Indian demo users, projects, assigned tasks, and deadlines.
Run: python seed.py

FlowTrack — An Agile-Oriented Full-Stack Project and Task Management System
IGNOU BCA (BCSP-064) | Developer: Ankit Singh | Enrollment: 2252096267
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from projects.models import Project, Task
from users.demo_accounts import DEMO_ACCOUNTS
from datetime import date, timedelta


def seed():
    print('Seeding FlowTrack (Indian demo data)...')

    # Full reset — remove every user/project/task so login list matches Team
    Task.objects.all().delete()
    Project.objects.all().delete()
    User.objects.all().delete()

    users_by_email = {}
    for ud in DEMO_ACCOUNTS:
        user = User.objects.create_user(
            email=ud['email'],
            password=ud['password'],
            first_name=ud['first_name'],
            last_name=ud['last_name'],
            role=ud['role'],
        )
        if ud['role'] == User.ROLE_ADMIN:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        users_by_email[ud['email']] = user
        print(f"  Created {ud['role']}: {ud['first_name']} {ud['last_name']} <{ud['email']}> / {ud['password']}")

    leader = users_by_email['rahul.mehta@flowtrack.in']
    manager = users_by_email['sneha.patil@flowtrack.in']
    amit = users_by_email['amit.yadav@flowtrack.in']
    neha = users_by_email['neha.gupta@flowtrack.in']

    today = date.today()

    projects_data = [
        {
            'title': 'DigiNagar Municipal Portal',
            'description': (
                'Web portal for Delhi NCR municipal services — birth certificate, '
                'property tax, and grievance redressal under Digital India guidelines.'
            ),
            'status': 'active',
            'deadline': today + timedelta(days=30),
            'owner': leader,
            'project_manager': manager,
            'tasks': [
                {
                    'title': 'SRS & stakeholder meeting (MCDs)',
                    'status': 'done',
                    'due_date': today - timedelta(days=14),
                    'description': 'Leader assigns Manager to gather MCD requirements.',
                    'assignee': manager,
                },
                {
                    'title': 'Coordinate bilingual UI delivery',
                    'status': 'in-progress',
                    'due_date': today + timedelta(days=3),
                    'description': 'Leader → Manager coordination task.',
                    'assignee': manager,
                },
                {
                    'title': 'Build Hindi–English form screens',
                    'status': 'in-progress',
                    'due_date': today + timedelta(days=5),
                    'description': 'Manager → Team Member implementation task.',
                    'assignee': neha,
                },
                {
                    'title': 'Implement Aadhaar eKYC sandbox call',
                    'status': 'todo',
                    'due_date': today + timedelta(days=10),
                    'description': 'Manager → Team Member coding task.',
                    'assignee': amit,
                },
            ],
        },
        {
            'title': 'KisanMitra Farmer Advisory App',
            'description': (
                'Android app for Indian farmers — MSP rates, weather alerts, '
                'PM-Kisan status check, and crop advisory in regional languages.'
            ),
            'status': 'active',
            'deadline': today + timedelta(days=45),
            'owner': manager,
            'project_manager': manager,
            'tasks': [
                {
                    'title': 'Crop calendar data model',
                    'status': 'done',
                    'due_date': today - timedelta(days=7),
                    'description': 'Manager assigns Team Member for data model.',
                    'assignee': amit,
                },
                {
                    'title': 'IMD weather API module',
                    'status': 'in-progress',
                    'due_date': today - timedelta(days=1),
                    'description': 'Team Member implements IMD API.',
                    'assignee': amit,
                },
                {
                    'title': 'MSP rate sync (Mandi board)',
                    'status': 'todo',
                    'due_date': today + timedelta(days=15),
                    'description': 'Team Member syncs MSP rates.',
                    'assignee': amit,
                },
                {
                    'title': 'Play Store release checklist',
                    'status': 'todo',
                    'due_date': today + timedelta(days=25),
                    'description': 'Team Member prepares Hindi/English listing.',
                    'assignee': neha,
                },
            ],
        },
        {
            'title': 'IGNOU Study Centre Portal',
            'description': (
                'Internal portal for PCTI Delhi study centre — assignment upload, '
                'counsellor schedule, and BCSP-064 project tracking for BCA learners.'
            ),
            'status': 'completed',
            'deadline': today - timedelta(days=5),
            'owner': leader,
            'project_manager': manager,
            'tasks': [
                {
                    'title': 'Learner registration module',
                    'status': 'done',
                    'due_date': today - timedelta(days=40),
                    'description': 'Leader → Manager delivery ownership.',
                    'assignee': manager,
                },
                {
                    'title': 'Assignment submission workflow',
                    'status': 'done',
                    'due_date': today - timedelta(days=25),
                    'description': 'Leader → Manager closed TEE upload flow.',
                    'assignee': manager,
                },
                {
                    'title': 'Counsellor timetable & reports',
                    'status': 'done',
                    'due_date': today - timedelta(days=10),
                    'description': 'Leader → Manager closed counselling reports.',
                    'assignee': manager,
                },
            ],
        },
    ]

    for pd in projects_data:
        project = Project.objects.create(
            title=pd['title'],
            owner=pd['owner'],
            project_manager=pd.get('project_manager'),
            description=pd['description'],
            status=pd['status'],
            deadline=pd['deadline'],
        )
        pm_name = pd['project_manager'].full_name if pd.get('project_manager') else '—'
        print(f'  Project: {pd["title"]} (PM: {pm_name}, deadline {pd["deadline"]})')

        for td in pd['tasks']:
            Task.objects.create(
                title=td['title'],
                project=project,
                description=td['description'],
                status=td['status'],
                due_date=td['due_date'],
                assignee=td['assignee'],
            )
            print(f'    Task: {td["title"]} → {td["assignee"].full_name} ({td["status"]})')

    print('\nSeed complete — Indian demo accounts:')
    print('  Admin:           Ankit Singh   | ankit.singh@flowtrack.in / Ankit@123')
    print('  Project Leader:  Rahul Mehta   | rahul.mehta@flowtrack.in / Rahul@123')
    print('  Project Manager: Sneha Patil   | sneha.patil@flowtrack.in / Sneha@123')
    print('  Team Member:     Amit Yadav    | amit.yadav@flowtrack.in / Amit@123')
    print('  Team Member:     Neha Gupta    | neha.gupta@flowtrack.in / Neha@123')


if __name__ == '__main__':
    seed()
