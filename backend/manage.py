#!/usr/bin/env python
"""Django's command-line utility for administrative tasks.

FlowTrack — An Agile-Oriented Full-Stack Project and Task Management System
IGNOU BCA (BCSP-064) | Developer: Ankit Singh | Enrollment: 2252096267
"""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
