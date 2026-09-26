"""Known India-demo login credentials (shown on login page)."""
from users.models import User

DEMO_ACCOUNTS = [
    {
        'email': 'ankit.singh@flowtrack.in',
        'password': 'Ankit@123',
        'first_name': 'Ankit',
        'last_name': 'Singh',
        'role': User.ROLE_ADMIN,
    },
    {
        'email': 'rahul.mehta@flowtrack.in',
        'password': 'Rahul@123',
        'first_name': 'Rahul',
        'last_name': 'Mehta',
        'role': User.ROLE_PROJECT_LEADER,
    },
    {
        'email': 'sneha.patil@flowtrack.in',
        'password': 'Sneha@123',
        'first_name': 'Sneha',
        'last_name': 'Patil',
        'role': User.ROLE_PROJECT_MANAGER,
    },
    {
        'email': 'amit.yadav@flowtrack.in',
        'password': 'Amit@123',
        'first_name': 'Amit',
        'last_name': 'Yadav',
        'role': User.ROLE_TEAM_MEMBER,
    },
    {
        'email': 'neha.gupta@flowtrack.in',
        'password': 'Neha@123',
        'first_name': 'Neha',
        'last_name': 'Gupta',
        'role': User.ROLE_TEAM_MEMBER,
    },
]

DEMO_PASSWORDS = {a['email']: a['password'] for a in DEMO_ACCOUNTS}
