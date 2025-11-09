"""
Management command to check services and send reminder emails
Run daily via cron job or task scheduler:
    python manage.py check_reminders
"""
from django.core.management.base import BaseCommand
from vendormanagement.utils.reminder_utils import check_and_send_reminders


class Command(BaseCommand):
    help = 'Check services/contracts and send email reminders for those expiring or with payment due within 15 days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=15,
            help='Number of days ahead to check (default: 15)',
        )

    def handle(self, *args, **options):
        days = options['days']
        
        self.stdout.write(self.style.SUCCESS(f'Checking services for reminders (next {days} days)...'))
        
        result = check_and_send_reminders(days=days)
        
        self.stdout.write(self.style.SUCCESS(
            f'\nReminder check completed:\n'
            f'  - Total services flagged: {result["total_services_flagged"]}\n'
            f'  - Services expiring soon: {result["expiring_count"]}\n'
            f'  - Services with payment due: {result["payment_due_count"]}\n'
            f'  - Emails sent: {result["emails_sent"]}\n'
            f'  - Emails failed: {result["emails_failed"]}'
        ))

