from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    VendorViewSet, ServiceViewSet, RegisterView,
    login_view, dashboard_view
)

router = DefaultRouter()
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'services', ServiceViewSet, basename='service')

urlpatterns = [
    # UI Routes
    path('', login_view, name='login'),
    path('dashboard/', dashboard_view, name='dashboard'),
    
    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/register/', RegisterView.as_view(), name='register'),
    
    # API endpoints
    path('api/', include(router.urls))
]

