// API Configuration
const API_BASE_URL = '/api';

// Token management
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle token refresh on 401
        if (response.status === 401 && refreshToken) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                return fetch(url, { ...options, headers });
            } else {
                logout();
                return response;
            }
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

async function refreshAccessToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access;
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
    }
    return null;
}

// Authentication
async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        accessToken = data.access;
        refreshToken = data.refresh;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        return true;
    }
    return false;
}

async function register(userData) {
    const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    return response.ok;
}

function logout() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
}

// Vendor API
async function getVendors(page = 1, pageSize = 20) {
    const response = await apiRequest(`/vendors/?page=${page}&page_size=${pageSize}`);
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch vendors');
}

async function getActiveServices() {
    const response = await apiRequest('/services/active_services/');
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch active services');
}

async function getExpiredServices() {

    const response = await apiRequest('/services/expired_services/');
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch expired services');
}

async function getVendor(id) {
    const response = await apiRequest(`/vendors/${id}/`);
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch vendor');
}

async function createVendor(vendorData) {
    const response = await apiRequest('/vendors/', {
        method: 'POST',
        body: JSON.stringify(vendorData)
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to create vendor');
}

async function updateVendor(id, vendorData) {
    const response = await apiRequest(`/vendors/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(vendorData)
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to update vendor');
}

async function deleteVendor(id) {
    const response = await apiRequest(`/vendors/${id}/`, {
        method: 'DELETE'
    });
    return response.ok;
}

// Service API
async function getServices(page = 1, pageSize = 20) {
    const response = await apiRequest(`/services/?page=${page}&page_size=${pageSize}`);
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch services');
}

async function getService(id) {
    const response = await apiRequest(`/services/${id}/`);
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch service');
}

async function createService(serviceData) {
    const response = await apiRequest('/services/', {
        method: 'POST',
        body: JSON.stringify(serviceData)
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to create service');
}

async function updateService(id, serviceData) {
    const response = await apiRequest(`/services/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(serviceData)
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to update service');
}

async function deleteService(id) {
    const response = await apiRequest(`/services/${id}/`, {
        method: 'DELETE'
    });
    return response.ok;
}

async function getExpiringSoon() {
    const response = await apiRequest('/services/expiring_soon/');
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch expiring services');
}

async function getPaymentDueSoon() {
    const response = await apiRequest('/services/payment_due_soon/');
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to fetch payment due services');
}

async function checkRemindersAPI(days = 15) {
    const response = await apiRequest('/services/check_reminders/', {
        method: 'POST',
        body: JSON.stringify({ days })
    });
    if (response.ok) {
        return await response.json();
    }
    throw new Error('Failed to check reminders');
}

// Check if user is authenticated
function isAuthenticated() {
    // Try to get token from localStorage if not already loaded
    if (!accessToken) {
        accessToken = localStorage.getItem('accessToken');
        refreshToken = localStorage.getItem('refreshToken');
    }
    return !!accessToken;
}

// Redirect to login if not authenticated
function requireAuth() {
    // Don't redirect if we're already on the login page
    if (window.location.pathname === '/' || window.location.pathname.includes('login')) {
        return false;
    }
    
    if (!isAuthenticated()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

