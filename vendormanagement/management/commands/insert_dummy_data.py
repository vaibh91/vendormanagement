import os
from vendormanagement.utils.data_utils import insert_dummy_data, get_function_file_path
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Insert dummy data into the database from CSV files'

    def handle(self, *args, **options):
        file_base_path = get_function_file_path(insert_dummy_data)
        file_base_path = "/".join(file_base_path.split("/")[:-2])+"/data"
        service_file_path = os.path.join(file_base_path, "Services.csv")
        vendor_file_path = os.path.join(file_base_path, "Vendors.csv")
        print(f"service_file_path: {service_file_path}")
        print(f"vendor_file_path: {vendor_file_path}")
        insert_dummy_data(vendor_file_path, service_file_path)