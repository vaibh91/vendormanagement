from django.contrib import admin
from .models import Vendor, Service


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 1
    fields = ('service_name', 'start_date', 'expiry_date', 'payment_due_date', 'amount')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'contact_person', 'email', 'phone')
    inlines = [ServiceInline]
    fieldsets = [
        ('Vendor Information', {
            'fields': ('name', 'contact_person', 'email', 'phone', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('service_name', 'vendor', 'start_date', 'expiry_date', 'payment_due_date', 'amount', 'get_status_color_display')
    list_filter = ('vendor', 'expiry_date', 'payment_due_date')
    search_fields = ('service_name', 'vendor__name')
    date_hierarchy = 'expiry_date'
    fieldsets = [
        ('Service Information', {
            'fields': ('vendor', 'service_name', 'amount')
        }),
        ('Dates', {
            'fields': ('start_date', 'expiry_date', 'payment_due_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ]
    readonly_fields = ('created_at', 'updated_at', 'get_status_color_display')
    
    def get_status_color_display(self, obj):
        """Display status color in admin"""
        color = obj.get_status_color()
        color_map = {
            'red': '🔴 Red (Expired)',
            'orange': '🟠 Orange (Payment Overdue)',
            'yellow': '🟡 Yellow (Expiring Soon)',
            'green': '🟢 Green (Active)',
            'gray': '⚪ Gray (Other)'
        }
        return color_map.get(color, f'⚪ {color.capitalize()}')
    get_status_color_display.short_description = 'Status Color'
