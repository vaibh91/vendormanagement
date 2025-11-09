function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
    clearMessage();
}

function showRegister() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    clearMessage();
}

function showMessage(text, type) {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

function clearMessage() {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = '';
    messageEl.className = 'message';
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const success = await login(username, password);
        if (success) {
            window.location.href = '/dashboard/';
        } else {
            showMessage('Invalid username or password', 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    
    if (password !== password2) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    try {
        const success = await register({ username, email, password, password2 });
        if (success) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(() => showLogin(), 2000);
        } else {
            showMessage('Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
    }
}

