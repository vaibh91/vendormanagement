from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Vendor, Service
from django.utils import timezone

class ServiceSerializer(serializers.ModelSerializer):

    status = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'vendor', 'service_name', 'start_date', 'expiry_date',
            'payment_due_date', 'amount',
            'created_at', 'updated_at', 'status', 'vendor_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'status', 'vendor_name']
    
    def get_status(self, obj):
        if obj.expiry_date < timezone.now().date():
            return 'Expired'
        elif (obj.expiry_date - timezone.now().date()).days<=15:
            return 'Expiring Soon'
        else:
            return 'Active'
    
    def get_vendor_name(self, obj):
        return obj.vendor.name

class VendorSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    active_services_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'status',
            'services', 'active_services_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'active_services_count']
    
    def get_active_services_count(self, obj):
        return obj.services.filter(expiry_date__gte=timezone.now()).count()


class VendorListSerializer(serializers.ModelSerializer):
    """Serializer for listing vendors with only active services"""
    active_services = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'status',
            'active_services', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_active_services(self, obj):
        active_services = obj.services.filter(expiry_date__gte=timezone.now())
        return ServiceSerializer(active_services, many=True).data


class ServiceStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating service status only"""
    class Meta:
        model = Service
        fields = ['expiry_date', 'payment_due_date']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user

