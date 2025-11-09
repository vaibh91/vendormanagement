from vendormanagement.models import Vendor, Service
import pandas as pd

def insert_dummy_data():
    df_vendors = pd.read_csv('vendormanagement/data/Vendors.csv')
    df_services = pd.read_csv('vendormanagement/data/Services.csv')

    for index, row in df_vendors.iterrows():
        Vendor.objects.create(name=row['name'], contact_person=row['contact_person'], email=row['email'], phone=row['phone'], status=row['status'])
    for index, row in df_services.iterrows():
        Service.objects.create(vendor=Vendor.objects.get(name=row['vendor']), service_name=row['service_name'], start_date=row['start_date'], expiry_date=row['expiry_date'], payment_due_date=row['payment_due_date'], amount=row['amount'])