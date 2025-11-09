let currentVendorPage = 1;
let currentServicePage = 1;
let vendorPageSize = parseInt(localStorage.getItem('vendorPageSize')) || 20;
let servicePageSize = parseInt(localStorage.getItem('servicePageSize')) || 20;
let vendorsData = [];
let servicesData = [];

// Initialize - only run on dashboard page
if (window.location.pathname.includes('dashboard')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Check authentication before loading dashboard
        if (!isAuthenticated()) {
            window.location.href = '/';
            return;
        }
        // Load saved page sizes
        const vendorPageSizeEl = document.getElementById('vendorPageSize');
        const servicePageSizeEl = document.getElementById('servicePageSize');
        if (vendorPageSizeEl) {
            vendorPageSizeEl.value = vendorPageSize;
        }
        if (servicePageSizeEl) {
            servicePageSizeEl.value = servicePageSize;
        }
        loadDashboard();
    });
}

// Navigation
function showDashboard() {
    switchView('dashboardView');
    updateNavActive('Dashboard');
    loadDashboard();
}

function showVendors() {
    switchView('vendorsView');
    updateNavActive('Vendors');
    loadVendors();
}

function showServices() {
    switchView('servicesView');
    updateNavActive('Services');
    loadServices();
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function updateNavActive(activeText) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent === activeText) {
            link.classList.add('active');
        }
    });
}

// Dashboard
async function loadDashboard() {
    try {
        const vendors = await getVendors(1, 5);
        const expiring = await getExpiringSoon();
        const paymentDue = await getPaymentDueSoon();
        const activeServices = await getActiveServices();
        const expiredServices = await getExpiredServices();
        
        document.getElementById('totalVendors').textContent = vendors.count || 0;
        document.getElementById('activeServices').textContent = activeServices.count || 0;
        document.getElementById('expiringSoon').textContent = expiring.count || 0;
        document.getElementById('paymentDue').textContent = paymentDue.count || 0;
        document.getElementById('expiredServices').textContent = expiredServices.count || 0;
        
        displayRecentVendors(vendors.results);
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

function displayRecentVendors(vendors) {
    const container = document.getElementById('recentVendors');
    if (vendors.length === 0) {
        container.innerHTML = '<div class="empty-state">No vendors found</div>';
        return;
    }
    
    let html = '<table><thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    vendors.forEach(vendor => {
        html += `
            <tr>
                <td>${vendor.name}</td>
                <td>${vendor.contact_person}</td>
                <td>${vendor.email}</td>
                <td><span class="status-badge status-${vendor.status.toLowerCase()}">${vendor.status}</span></td>
                <td class="action-buttons">
                    <button onclick="editVendor(${vendor.id})" class="btn btn-secondary">Edit</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Vendors
async function loadVendors(page = 1) {
    try {
        currentVendorPage = page;
        const data = await getVendors(page, vendorPageSize);
        vendorsData = data.results;
        displayVendors(vendorsData);
        displayVendorPagination(data);
    } catch (error) {
        console.error('Vendors load error:', error);
        document.getElementById('vendorsList').innerHTML = '<div class="empty-state">Failed to load vendors</div>';
    }
}

function changeVendorPageSize() {
    const newSize = parseInt(document.getElementById('vendorPageSize').value);
    vendorPageSize = newSize;
    localStorage.setItem('vendorPageSize', newSize);
    currentVendorPage = 1; // Reset to first page
    loadVendors(1);
}

function displayVendors(vendors) {
    const container = document.getElementById('vendorsList');
    if (vendors.length === 0) {
        container.innerHTML = '<div class="empty-state">No vendors found</div>';
        return;
    }
    
    let html = '<table><thead><tr><th>Name</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Status</th><th>Services</th><th>Actions</th></tr></thead><tbody>';
    vendors.forEach(vendor => {
        html += `
            <tr>
                <td>${vendor.name}</td>
                <td>${vendor.contact_person}</td>
                <td>${vendor.email}</td>
                <td>${vendor.phone}</td>
                <td><span class="status-badge status-${vendor.status.toLowerCase()}">${vendor.status}</span></td>
                <td>${vendor.active_services_count || 0}</td>
                <td class="action-buttons">
                    <button onclick="editVendor(${vendor.id})" class="btn btn-secondary">Edit</button>
                    <button onclick="deleteVendorConfirm(${vendor.id})" class="btn btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function displayVendorPagination(data) {
    const container = document.getElementById('vendorsPagination');
    if (!data.next && !data.previous && currentVendorPage === 1) {
        container.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(data.count / vendorPageSize);
    let html = '';
    if (data.previous) {
        html += `<button onclick="loadVendors(${currentVendorPage - 1})">Previous</button>`;
    }
    html += `<span class="page-info">Page ${currentVendorPage} of ${totalPages} (${data.count} total)</span>`;
    if (data.next) {
        html += `<button onclick="loadVendors(${currentVendorPage + 1})">Next</button>`;
    }
    container.innerHTML = html;
}

function showAddVendor() {
    document.getElementById('vendorModalTitle').textContent = 'Add Vendor';
    document.getElementById('vendorForm').reset();
    document.getElementById('vendorId').value = '';
    document.getElementById('vendorModal').style.display = 'block';
}

async function editVendor(id) {
    try {
        const vendor = await getVendor(id);
        document.getElementById('vendorModalTitle').textContent = 'Edit Vendor';
        document.getElementById('vendorId').value = vendor.id;
        document.getElementById('vendorName').value = vendor.name;
        document.getElementById('vendorContact').value = vendor.contact_person;
        document.getElementById('vendorEmail').value = vendor.email;
        document.getElementById('vendorPhone').value = vendor.phone;
        document.getElementById('vendorStatus').value = vendor.status;
        document.getElementById('vendorModal').style.display = 'block';
    } catch (error) {
        alert('Failed to load vendor');
    }
}

async function saveVendor(event) {
    event.preventDefault();
    const id = document.getElementById('vendorId').value;
    const data = {
        name: document.getElementById('vendorName').value,
        contact_person: document.getElementById('vendorContact').value,
        email: document.getElementById('vendorEmail').value,
        phone: document.getElementById('vendorPhone').value,
        status: document.getElementById('vendorStatus').value
    };
    
    try {
        if (id) {
            await updateVendor(id, data);
        } else {
            await createVendor(data);
        }
        closeModal('vendorModal');
        loadVendors(currentVendorPage);
        if (document.getElementById('dashboardView').classList.contains('active')) {
            loadDashboard();
        }
    } catch (error) {
        alert('Failed to save vendor');
    }
}

async function deleteVendorConfirm(id) {
    if (confirm('Are you sure you want to delete this vendor?')) {
        try {
            await deleteVendor(id);
            loadVendors(currentVendorPage);
        } catch (error) {
            alert('Failed to delete vendor');
        }
    }
}

function filterVendors() {
    const search = document.getElementById('vendorSearch').value.toLowerCase();
    const statusFilter = document.getElementById('vendorStatusFilter').value;
    
    const filtered = vendorsData.filter(v => {
        const matchSearch = !search || 
            v.name.toLowerCase().includes(search) ||
            v.contact_person.toLowerCase().includes(search) ||
            v.email.toLowerCase().includes(search);
        const matchStatus = !statusFilter || v.status === statusFilter;
        return matchSearch && matchStatus;
    });
    
    displayVendors(filtered);
}

// Services
async function loadServices(page = 1) {
    try {
        currentServicePage = page;
        const data = await getServices(page, servicePageSize);
        servicesData = data.results;
        displayServices(servicesData);
        displayServicePagination(data);
        loadVendorOptions();
    } catch (error) {
        console.error('Services load error:', error);
        document.getElementById('servicesList').innerHTML = '<div class="empty-state">Failed to load services</div>';
    }
}

function changeServicePageSize() {
    const newSize = parseInt(document.getElementById('servicePageSize').value);
    servicePageSize = newSize;
    localStorage.setItem('servicePageSize', newSize);
    currentServicePage = 1; // Reset to first page
    loadServices(1);
}

async function loadVendorOptions() {
    try {
        const vendors = await getVendors(1, 1000);
        const select = document.getElementById('serviceVendor');
        select.innerHTML = '<option value="">Select Vendor</option>';
        vendors.results.forEach(v => {
            select.innerHTML += `<option value="${v.id}">${v.name}</option>`;
        });
    } catch (error) {
        console.error('Failed to load vendors for dropdown');
    }
}

function displayServices(services) {
    const container = document.getElementById('servicesList');
    if (services.length === 0) {
        container.innerHTML = '<div class="empty-state">No services found</div>';
        return;
    }
    
    let html = '<table><thead><tr><th>Service Name</th><th>Vendor</th><th>Start Date</th><th>Expiry Date</th><th>Payment Due</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    services.forEach(service => {
        const colorClass = service.status_color || 'gray';
        const vendorName = service.vendor_name;
        
        // Determine status text based on color and dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(service.expiry_date);
        const paymentDate = new Date(service.payment_due_date);
        
        let statusText = 'Active';
        let statusClass = 'active';
        
        if (expiryDate < today) {
            statusText = 'Expired';
            statusClass = 'expired';
        } else if (paymentDate < today) {
            statusText = 'Payment Pending';
            statusClass = 'pending';
        } else if (colorClass === 'yellow') {
            statusText = 'Expiring Soon';
            statusClass = 'pending';
        } else {
            statusText = 'Active';
            statusClass = 'active';
        }
        
        html += `
            <tr>
                <td>${service.service_name}</td>
                <td>${vendorName}</td>
                <td>${new Date(service.start_date).toLocaleDateString()}</td>
                <td>${new Date(service.expiry_date).toLocaleDateString()}</td>
                <td>${new Date(service.payment_due_date).toLocaleDateString()}</td>
                <td>$${parseFloat(service.amount).toFixed(2)}</td>
                <td>
                    <span class="color-indicator color-${colorClass}"></span>
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                </td>
                <td class="action-buttons">
                    <button onclick="editService(${service.id})" class="btn btn-secondary">Edit</button>
                    <button onclick="deleteServiceConfirm(${service.id})" class="btn btn-danger">Delete</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function displayServicePagination(data) {
    const container = document.getElementById('servicesPagination');
    if (!data.next && !data.previous && currentServicePage === 1) {
        container.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(data.count / servicePageSize);
    let html = '';
    if (data.previous) {
        html += `<button onclick="loadServices(${currentServicePage - 1})">Previous</button>`;
    }
    html += `<span class="page-info">Page ${currentServicePage} of ${totalPages} (${data.count} total)</span>`;
    if (data.next) {
        html += `<button onclick="loadServices(${currentServicePage + 1})">Next</button>`;
    }
    container.innerHTML = html;
}

function showAddService() {
    document.getElementById('serviceModalTitle').textContent = 'Add Service';
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    loadVendorOptions();
    document.getElementById('serviceModal').style.display = 'block';
}

async function editService(id) {
    try {
        const service = await getService(id);
        document.getElementById('serviceModalTitle').textContent = 'Edit Service';
        document.getElementById('serviceId').value = service.id;
        const vendorId = typeof service.vendor === 'object' ? service.vendor.id : service.vendor;
        document.getElementById('serviceVendor').value = vendorId;
        document.getElementById('serviceName').value = service.service_name;
        document.getElementById('serviceStartDate').value = service.start_date;
        document.getElementById('serviceExpiryDate').value = service.expiry_date;
        document.getElementById('servicePaymentDate').value = service.payment_due_date;
        document.getElementById('serviceAmount').value = service.amount;
        document.getElementById('serviceStatus').value = service.status;
        loadVendorOptions().then(() => {
            document.getElementById('serviceVendor').value = vendorId;
        });
        document.getElementById('serviceModal').style.display = 'block';
    } catch (error) {
        alert('Failed to load service');
    }
}

async function saveService(event) {
    event.preventDefault();
    const id = document.getElementById('serviceId').value;
    const data = {
        vendor: parseInt(document.getElementById('serviceVendor').value),
        service_name: document.getElementById('serviceName').value,
        start_date: document.getElementById('serviceStartDate').value,
        expiry_date: document.getElementById('serviceExpiryDate').value,
        payment_due_date: document.getElementById('servicePaymentDate').value,
        amount: parseFloat(document.getElementById('serviceAmount').value)
    };
    
    try {
        if (id) {
            await updateService(id, data);
        } else {
            await createService(data);
        }
        closeModal('serviceModal');
        loadServices(currentServicePage);
    } catch (error) {
        alert('Failed to save service');
    }
}

async function deleteServiceConfirm(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        try {
            await deleteService(id);
            loadServices(currentServicePage);
        } catch (error) {
            alert('Failed to delete service');
        }
    }
}

function filterServices() {
    const search = document.getElementById('serviceSearch').value.toLowerCase();
    const statusFilter = document.getElementById('serviceStatusFilter').value;
    
    const filtered = servicesData.filter(s => {
        const matchSearch = !search || s.service_name.toLowerCase().includes(search);
        
        // Filter by status based on color codes and dates
        let matchStatus = true;
        if (statusFilter) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(s.expiry_date);
            const paymentDate = new Date(s.payment_due_date);
            
            switch(statusFilter) {
                case 'Expired':
                    matchStatus = s.status=='Expired';
                    break;
                case 'Expiring Soon':
                    // Expiring or payment due within 15 days
                    matchStatus = s.status=='Expiring Soon';
                    break;
                case 'Active':
                    matchStatus = s.status=='Active'
                    break;
                default:
                    matchStatus = true;
            }
        }
        
        return matchSearch && matchStatus;
    });
    
    displayServices(filtered);
}

// Reminders
async function checkReminders() {
    if (confirm('Check and send reminder emails for services expiring or with payment due?')) {
        try {
            const result = await checkRemindersAPI(15);
            alert(`Reminder check completed!\n\nTotal flagged: ${result.summary.total_services_flagged}\nEmails sent: ${result.summary.emails_sent}\nEmails failed: ${result.summary.emails_failed}`);
        } catch (error) {
            alert('Failed to check reminders');
        }
    }
}

// Modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

