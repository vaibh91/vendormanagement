# Vendor Management System

A comprehensive Django REST Framework-based Vendor Management System with JWT authentication, automated reminders, and full CRUD operations for vendors and their services/contracts.

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Step 1: Clone/Download the Project
```bash
cd /path/to/assignment
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Create Superuser (Optional)
```bash
python manage.py createsuperuser
```
This allows you to access the Django admin panel at `/admin/`

### Step 6: Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`

### Step 7: Configure Email Settings (Optional)
Edit `project/settings.py` and uncomment/configure SMTP settings for production:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = 'your-email@gmail.com'
ADMIN_EMAIL = 'admin@example.com'  # For reminder notifications
```

### Step 8: Insert Dummy Data

```
python manage.py insert_dummy_data.py
```

## Authentication

### JWT Authentication
All vendor and service management endpoints require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

#### 1. Register a New User
**POST** `/api/register/`  
**No authentication required**

Request Body:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "password2": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### 2. Obtain JWT Token (Login)
**POST** `/api/token/`  
**No authentication required**

Request Body:
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 3. Refresh JWT Token
**POST** `/api/token/refresh/`

Request Body:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Returns a new access token.

#### 4. Verify JWT Token
**POST** `/api/token/verify/`

Request Body:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Token Configuration
- **Access Token Lifetime**: 1 hour
- **Refresh Token Lifetime**: 7 days
- **Token Rotation**: Enabled
- **Header Format**: `Authorization: Bearer <token>`


### Add Cron Jobs to send expired and payment due emails

```
0 9 * * * /path/to/assignment/venv/bin/python manage.py check_reminders --days 15
```

## API Documentation

### Base URL
All API endpoints are prefixed with `/api/`

**Note:** All endpoints below require JWT authentication unless otherwise specified.

### Pagination

All list endpoints support pagination with a default page size of 20 items.

**Query Parameters:**
- `?page=1` - Get specific page
- `?page_size=20` - Change page size

**Response Format:**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/vendors/?page=2",
  "previous": null,
  "results": [...]
}
```

### Vendors Endpoints

#### List All Vendors (Paginated)
**GET** `/api/vendors/`  
**Requires authentication**

Returns paginated list of vendors with their services.

**Query Parameters:** `?page=1&page_size=20`

#### Get Vendor Details
**GET** `/api/vendors/{id}/`  
**Requires authentication**

Returns vendor with all services.

#### Create Vendor
**POST** `/api/vendors/`  
**Requires authentication**

Request Body:
```json
{
  "name": "Vendor Name",
  "contact_person": "John Doe",
  "email": "vendor@example.com",
  "phone": "+1234567890",
  "status": "Active"
}
```

#### Update Vendor
**PUT/PATCH** `/api/vendors/{id}/`  
**Requires authentication**

#### Delete Vendor
**DELETE** `/api/vendors/{id}/`  
**Requires authentication**

#### List Vendors with Active Services Only (Paginated)
**GET** `/api/vendors/list_with_active_services/`  
**Requires authentication**

Returns paginated list of vendors with only their active services.

**Query Parameters:** `?page=1&page_size=20`

### Services Endpoints

#### List All Services (Paginated)
**GET** `/api/services/`  
**Requires authentication**

Returns paginated list of services with vendor information.

**Query Parameters:** `?page=1&page_size=20`

#### Get Service Details
**GET** `/api/services/{id}/`  
**Requires authentication**

Returns service with vendor information and status color.

#### Create Service
**POST** `/api/services/`  
**Requires authentication**

Request Body:
```json
{
  "vendor": 1,
  "service_name": "Service Name",
  "start_date": "2024-01-01",
  "expiry_date": "2024-12-31",
  "payment_due_date": "2024-12-15",
  "amount": "1000.00"
}
```

#### Update Service
**PUT/PATCH** `/api/services/{id}/`  
**Requires authentication**

#### Delete Service
**DELETE** `/api/services/{id}/`  
**Requires authentication**

#### Get Services Expiring in Next 15 Days (Paginated)
**GET** `/api/services/expiring_soon/`  
**Requires authentication**

Returns paginated list of services expiring within 15 days.

**Query Parameters:** `?page=1&page_size=20`

#### Get Services with Payment Due in Next 15 Days (Paginated)
**GET** `/api/services/payment_due_soon/`  
**Requires authentication**

Returns paginated list of services with payment due within 15 days.

**Query Parameters:** `?page=1&page_size=20`


#### Check and Send Reminders
**GET/POST** `/api/services/check_reminders/`  
**Requires authentication**

**POST** `/api/services/check_reminders/` with body: `{"days": 15}`  
**GET** `/api/services/check_reminders/` (uses default 15 days)

Checks services and sends email notifications for those expiring or with payment due within the specified number of days (default: 15).

#### Get Services Grouped by Color Codes
**GET** `/api/services/services_by_color/`  
**Requires authentication**

Returns services grouped by status color:
- `red`: Expired services
- `orange`: Payment overdue
- `yellow`: Expiring/payment due soon (within 15 days)
- `green`: Active and healthy
- `gray`: Other statuses

## Dependencies

See `requirements.txt` for complete list:
- Django 5.2.8
- djangorestframework 3.16.1
- djangorestframework-simplejwt 5.5.1
- PyJWT 2.10.1
- pandas 2.3.3

## License

This project is part of an assignment for vendor management system implementation.
