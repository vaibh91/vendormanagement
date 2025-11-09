from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from django.shortcuts import render, redirect

from .models import Vendor, Service
from .serializers import (
    VendorSerializer, ServiceSerializer, VendorListSerializer,
    ServiceStatusUpdateSerializer, UserRegistrationSerializer
)
from .utils.reminder_utils import check_and_send_reminders, get_services_with_color_codes
from .pagination import CustomPageNumberPagination


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint (public, no authentication required)
    POST /api/register/
    Body: {"username": "user", "email": "user@example.com", "password": "password", "password2": "password"}
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer


class VendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on Vendors
    """
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        """Optimize queryset with prefetch_related for nested services"""
        return Vendor.objects.prefetch_related('services').all()
    
    def get_serializer_class(self):
        if self.action == 'list_with_active_services':
            return VendorListSerializer
        return VendorSerializer
    
    @action(detail=False, methods=['get'])
    def list_with_active_services(self, request):
        """
        List all vendors with their active services only (paginated)
        GET /api/vendors/list_with_active_services/
        """
        vendors = Vendor.objects.prefetch_related('services').all()
        page = self.paginate_queryset(vendors)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(vendors, many=True)
        return Response(serializer.data)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations on Services
    """
    queryset = Service.objects.select_related('vendor').all()
    serializer_class = ServiceSerializer
    pagination_class = CustomPageNumberPagination
    
    def get_serializer_class(self):
        if self.action == 'update_status':
            return ServiceStatusUpdateSerializer
        return ServiceSerializer
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """
        Get all services expiring in the next 15 days (paginated)
        GET /api/services/expiring_soon/
        """
        today = timezone.now().date()
        days_ahead = today + timedelta(days=15)
        
        services = Service.objects.filter(
            expiry_date__gte=today,
            expiry_date__lte=days_ahead
        ).select_related('vendor')
        
        page = self.paginate_queryset(services)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(services, many=True)
        return Response({
            'count': services.count(),
            'services': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def payment_due_soon(self, request):
        """
        Get all services with payment due in the next 15 days (paginated)
        GET /api/services/payment_due_soon/
        """
        today = timezone.now().date()
        days_ahead = today + timedelta(days=15)
        
        services = Service.objects.filter(
            payment_due_date__gte=today,
            payment_due_date__lte=days_ahead
        ).select_related('vendor')
        
        page = self.paginate_queryset(services)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(services, many=True)
        return Response({
            'count': services.count(),
            'services': serializer.data
        })
    

    @action(detail=False, methods=['get'])
    def services_by_color(self, request):
        """
        Get all services grouped by color codes (requires authentication)
        GET /api/services-by-color/
        """
        color_groups = get_services_with_color_codes()
        
        # Serialize each group
        result = {}
        for color, services in color_groups.items():
            result[color] = {
                'count': len(services),
                'services': ServiceSerializer(services, many=True).data
            }
        
        return Response(result)

    @action(detail=False, methods=['post', 'get'])
    def check_reminders(self, request):
        days = request.data.get('days', 15)
        result = check_and_send_reminders(days=days)
        
        return Response({
            'message': 'Reminder check completed',
            'summary': result
        })
    

    @action(detail=False, methods=['get'])
    def active_services(self, request):
        """
        Get all active services (requires authentication)
        GET /api/services/active_services/
        """
        services = Service.objects.filter(expiry_date__gte=timezone.now())
        page = self.paginate_queryset(services)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(services, many=True)
        return Response({
            'count': services.count(),
            'active_services': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def expired_services(self, request):
        """
        Get all active services (requires authentication)
        GET /api/services/expired_services/
        """
        services = Service.objects.filter(expiry_date__lt=timezone.now())
        page = self.paginate_queryset(services)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(services, many=True)
        return Response({
            'count': services.count(),
            'expired_services': serializer.data
        })


# UI Views
def login_view(request):
    """Serve login page"""
    # Don't check Django session auth - we use JWT
    return render(request, 'vendormanagement/login.html')


def dashboard_view(request):
    """Serve dashboard page"""
    # Don't check Django session auth - JWT is handled client-side
    return render(request, 'vendormanagement/dashboard.html')
