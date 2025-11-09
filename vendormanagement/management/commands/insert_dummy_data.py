from vendormanagement.utils.data_utils import insert_dummy_data
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Insert dummy data into the database from CSV files'

    def handle(self, *args, **options):
        insert_dummy_data()