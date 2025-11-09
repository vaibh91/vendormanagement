from django.db import models
from django.utils import timezone


class Vendor(models.Model):
    VENDOR_STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    
    name = models.CharField(max_length=200, unique=True, help_text='Vendor name')
    contact_person = models.CharField(max_length=200, help_text='Vendor contact person')
    email = models.EmailField(max_length=100, help_text='Vendor email')
    phone = models.CharField(max_length=20, help_text='Vendor phone')
    status = models.CharField(max_length=10, choices=VENDOR_STATUS_CHOICES, default='Active', help_text='Vendor status')
    created_at = models.DateTimeField(auto_now_add=True, help_text='Vendor creation date')
    updated_at = models.DateTimeField(auto_now=True, help_text='Vendor last update date')

    def __str__(self):
        return self.name


class Service(models.Model):
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='services', help_text='Vendor')
    service_name = models.CharField(max_length=200, help_text='Service name')
    start_date = models.DateField('start date')
    expiry_date = models.DateField('expiry date', help_text='Service expiry date')
    payment_due_date = models.DateField('payment due date', help_text='Service payment due date')
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Service amount')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.service_name} - {self.vendor.name}"
    
    def is_expiring_soon(self, days=15):
        """Check if service is expiring within specified days"""
        from django.utils import timezone
        today = timezone.now().date()
        days_until_expiry = (self.expiry_date - today).days
        return 0 <= days_until_expiry <= days
    
    def is_payment_due_soon(self, days=15):
        """Check if payment is due within specified days"""
        from django.utils import timezone
        today = timezone.now().date()
        days_until_payment = (self.payment_due_date - today).days
        return 0 <= days_until_payment <= days
    
    def get_status_color(self):
        """Get color code based on service status and dates"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if self.expiry_date < today:
            return 'red'
        elif self.payment_due_date < today:
            return 'orange'
        elif self.is_expiring_soon() or self.is_payment_due_soon():
            return 'yellow'
        else:
            return 'gray'
