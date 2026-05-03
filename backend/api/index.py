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

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
