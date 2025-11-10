from vendormanagement.models import Vendor, Service
import pandas as pd
import os
import inspect



# instead of absolute path use relative path from this files path itself

def get_function_file_path(func):
    """
    Returns the absolute path of the file where the given function is defined.
    """
    if not inspect.isfunction(func):
        raise TypeError("Input must be a function.")
    
    file_path = inspect.getfile(func)
    return os.path.abspath(file_path)

def insert_dummy_data(vendor_file_path, service_file_path):
    
    df_vendors = pd.read_csv(vendor_file_path)
    df_services = pd.read_csv(service_file_path)

    for index, row in df_vendors.iterrows():
        Vendor.objects.create(name=row['name'], contact_person=row['contact_person'], email=row['email'], phone=row['phone'], status=row['status'])
    for index, row in df_services.iterrows():
        Service.objects.create(vendor=Vendor.objects.get(name=row['vendor']), service_name=row['service_name'], start_date=row['start_date'], expiry_date=row['expiry_date'], payment_due_date=row['payment_due_date'], amount=row['amount'])
