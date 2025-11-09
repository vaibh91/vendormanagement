"""
Utility functions for sending reminders about expiring services and payment due dates
"""
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from vendormanagement.models import Service


def check_and_send_reminders(days=15):
    """
    Check services/contracts daily and send email notifications for those
    nearing expiry or payment due within specified days.
    
    Args:
        days: Number of days ahead to check (default: 15)
    
    Returns:
        dict: Summary of reminders sent
    """
    today = timezone.now().date()
    days_ahead = today + timedelta(days=days)
    
    # Find services expiring soon
    expiring_services = Service.objects.filter(
        expiry_date__gte=today,
        expiry_date__lte=days_ahead,
    ).select_related('vendor')
    
    # Find services with payment due soon
    payment_due_services = Service.objects.filter(
        payment_due_date__gte=today,
        payment_due_date__lte=days_ahead,
    ).select_related('vendor')
    
    # Combine and deduplicate (a service might be both expiring and payment due)
    all_services = {}
    for service in expiring_services:
        all_services[service.id] = {
            'service': service,
            'expiring': True,
            'payment_due': False
        }
    
    for service in payment_due_services:
        if service.id in all_services:
            all_services[service.id]['payment_due'] = True
        else:
            all_services[service.id] = {
                'service': service,
                'expiring': False,
                'payment_due': True
            }
    
    # Send emails
    emails_sent = 0
    emails_failed = 0
    
    for service_data in all_services.values():
        service = service_data['service']
        try:
            send_service_reminder(service, service_data['expiring'], service_data['payment_due'])
            emails_sent += 1
        except Exception as e:
            print(f"Failed to send email for service {service.id}: {str(e)}")
            emails_failed += 1
    
    return {
        'total_services_flagged': len(all_services),
        'emails_sent': emails_sent,
        'emails_failed': emails_failed,
        'expiring_count': len(expiring_services),
        'payment_due_count': len(payment_due_services)
    }


def send_service_reminder(service, is_expiring=False, is_payment_due=False):
    """
    Send email reminder for a service
    
    Args:
        service: Service instance
        is_expiring: Boolean indicating if service is expiring soon
        is_payment_due: Boolean indicating if payment is due soon
    """
    vendor = service.vendor
    
    # Build subject
    subjects = []
    if is_expiring:
        days_until = (service.expiry_date - timezone.now().date()).days
        subjects.append(f"Service Expiring in {days_until} days")
    if is_payment_due:
        days_until = (service.payment_due_date - timezone.now().date()).days
        subjects.append(f"Payment Due in {days_until} days")
    
    subject = f"Vendor Management Alert: {' & '.join(subjects)}"
    
    # Build message
    message_parts = [
        f"Dear {vendor.contact_person},",
        "",
        f"This is a reminder regarding the service '{service.service_name}' for vendor '{vendor.name}'.",
        "",
    ]
    
    if is_expiring:
        days_until = (service.expiry_date - timezone.now().date()).days
        message_parts.extend([
            f"⚠️ EXPIRY ALERT: This service will expire on {service.expiry_date.strftime('%Y-%m-%d')} ({days_until} days from now).",
            ""
        ])
    
    if is_payment_due:
        days_until = (service.payment_due_date - timezone.now().date()).days
        message_parts.extend([
            f"💰 PAYMENT DUE: Payment of ${service.amount} is due on {service.payment_due_date.strftime('%Y-%m-%d')} ({days_until} days from now).",
            ""
        ])
    
    message_parts.extend([
        "Service Details:",
        f"  - Service Name: {service.service_name}",
        f"  - Start Date: {service.start_date.strftime('%Y-%m-%d')}",
        f"  - Expiry Date: {service.expiry_date.strftime('%Y-%m-%d')}",
        f"  - Payment Due Date: {service.payment_due_date.strftime('%Y-%m-%d')}",
        f"  - Amount: ${service.amount}",
        "",
        "Please take necessary action.",
        "",
        "Best regards,",
        "Vendor Management System"
    ])
    
    message = "\n".join(message_parts)
    
    # Send email
    # In production, you might want to send to multiple recipients
    recipient_list = [vendor.email]
    
    # Also send to admin/manager (you can configure this in settings)
    admin_email = getattr(settings, 'ADMIN_EMAIL', None)
    if admin_email:
        recipient_list.append(admin_email)
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vendormanagement.com'),
            recipient_list=recipient_list,
            fail_silently=False,
        )
    except Exception as e:
        # Log error but don't crash
        print(f"Error sending email to {vendor.email}: {str(e)}")
        raise


def get_services_with_color_codes():
    """
    Get all services with their color codes for flagging
    Returns services grouped by color code
    """
    services = Service.objects.select_related('vendor').all()
    
    color_groups = {
        'red': [],
        'orange': [],
        'yellow': [],
        'green': [],
        'gray': []
    }
    
    for service in services:
        color = service.get_status_color()
        color_groups[color].append(service)
    
    return color_groups

