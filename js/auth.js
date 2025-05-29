// Authentication functionality for Planio
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Log connection info for debugging
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Key (first 10 chars):', SUPABASE_KEY.substring(0, 10) + '...');
    console.log('Connecting to Supabase...');
    
    // Elements
    const authMessage = document.getElementById('auth-message');
    
    // Check if user is already authenticated
    try {
        checkAuth();
    } catch (error) {
        console.error('Error during authentication check:', error);
        // If we're on a page that requires authentication, show a message
        if (window.location.pathname.includes('dashboard') || 
            window.location.pathname.includes('employee')) {
            showAuthMessage('error', 'Verbindungsproblem mit dem Authentifizierungsserver. Bitte versuchen Sie es später erneut.');
        }
    }
    
    // Sign In Form
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked || false;
            
            // Show loading state
            toggleLoading(signinForm, true);
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                    options: {
                        rememberMe: remember
                    }
                });
                
                if (error) throw error;
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                showMessage('error', `Anmeldung fehlgeschlagen: ${error.message}`);
                toggleLoading(signinForm, false);
            }
        });
    }
    
    // Sign Up Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        // Password strength meter
        const passwordInput = document.getElementById('password');
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        if (passwordInput && strengthBar && strengthText) {
            passwordInput.addEventListener('input', () => {
                updatePasswordStrength(passwordInput.value);
            });
        }
        
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const termsAccepted = document.getElementById('terms').checked;
            
            // Validate form
            if (password !== confirmPassword) {
                showMessage('error', 'Die Passwörter stimmen nicht überein.');
                return;
            }
            
            if (!termsAccepted) {
                showMessage('error', 'Sie müssen die Nutzungsbedingungen akzeptieren.');
                return;
            }
            
            // Show loading state
            toggleLoading(signupForm, true);
            
            try {
                console.log('Attempting to sign up with:', { email, firstName, lastName });
                
                // Sign up with Supabase
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName
                        }
                    }
                });
                
                console.log('Signup response:', data);
                
                if (error) {
                    console.error('Signup error:', error);
                    throw error;
                }
                
                // Create employee record
                if (data.user) {
                    const { error: employeeError } = await supabase
                        .from('employees')
                        .insert([
                            {
                                first_name: firstName,
                                last_name: lastName,
                                email: email,
                                position: 'Mitarbeiter',
                                department: 'team-a',
                                status: 'active'
                            }
                        ]);
                    
                    if (employeeError) {
                        console.error('Error creating employee record:', employeeError);
                    }
                }
                
                // Show success message and redirect
                showMessage('success', 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.');
                
                // Redirect to confirmation page after a delay
                setTimeout(() => {
                    window.location.href = 'confirm-email.html';
                }, 2000);
            } catch (error) {
                showMessage('error', `Registrierung fehlgeschlagen: ${error.message}`);
                toggleLoading(signupForm, false);
            }
        });
    }
    
    // Reset Password Request Form
    const resetRequestForm = document.getElementById('reset-request-form');
    if (resetRequestForm) {
        resetRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            
            // Show loading state
            toggleLoading(resetRequestForm, true);
            
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password.html?type=recovery`
                });
                
                if (error) throw error;
                
                // Show confirmation step
                document.getElementById('request-reset').classList.remove('active');
                document.getElementById('confirm-reset').classList.add('active');
            } catch (error) {
                showMessage('error', `Fehler beim Senden des Links: ${error.message}`);
                toggleLoading(resetRequestForm, false);
            }
        });
    }
    
    // New Password Form
    const newPasswordForm = document.getElementById('new-password-form');
    if (newPasswordForm) {
        // Check if we're in recovery mode
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type === 'recovery') {
            document.getElementById('request-reset').classList.remove('active');
            document.getElementById('new-password').classList.add('active');
            
            // Password strength meter
            const passwordInput = document.getElementById('new-password');
            const strengthBar = document.getElementById('strength-bar');
            const strengthText = document.getElementById('strength-text');
            
            if (passwordInput && strengthBar && strengthText) {
                passwordInput.addEventListener('input', () => {
                    updatePasswordStrength(passwordInput.value);
                });
            }
            
            newPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                // Validate form
                if (newPassword !== confirmPassword) {
                    showMessage('error', 'Die Passwörter stimmen nicht überein.');
                    return;
                }
                
                // Show loading state
                toggleLoading(newPasswordForm, true);
                
                try {
                    const { error } = await supabase.auth.updateUser({
                        password: newPassword
                    });
                    
                    if (error) throw error;
                    
                    // Show success step
                    document.getElementById('new-password').classList.remove('active');
                    document.getElementById('reset-success').classList.add('active');
                } catch (error) {
                    showMessage('error', `Fehler beim Ändern des Passworts: ${error.message}`);
                    toggleLoading(newPasswordForm, false);
                }
            });
        }
    }
    
    // Email Confirmation
    if (window.location.pathname.includes('confirm-email.html')) {
        // Check if we're in confirmation mode
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type === 'signup') {
            // Handle email confirmation
            handleEmailConfirmation();
        }
        
        // Resend confirmation link
        const resendLink = document.getElementById('resend-link');
        if (resendLink) {
            resendLink.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    const { data, error } = await supabase.auth.getSession();
                    
                    if (error) throw error;
                    
                    if (data.session) {
                        const { error: resendError } = await supabase.auth.resend({
                            type: 'signup',
                            email: data.session.user.email
                        });
                        
                        if (resendError) throw resendError;
                        
                        alert('Bestätigungslink wurde erneut gesendet. Bitte überprüfen Sie Ihre E-Mail.');
                    } else {
                        window.location.href = 'signin.html';
                    }
                } catch (error) {
                    console.error('Error resending confirmation link:', error);
                    alert(`Fehler beim erneuten Senden des Links: ${error.message}`);
                }
            });
        }
        
        // Request new link
        const requestNewLink = document.getElementById('request-new-link');
        if (requestNewLink) {
            requestNewLink.addEventListener('click', () => {
                window.location.href = 'signin.html';
            });
        }
    }
    
    // Magic Link
    const magicLinkBtn = document.getElementById('magic-link-btn');
    const magicLinkModal = document.getElementById('magic-link-modal');
    const magicLinkForm = document.getElementById('magic-link-form');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    if (magicLinkBtn && magicLinkModal) {
        magicLinkBtn.addEventListener('click', () => {
            magicLinkModal.classList.add('active');
        });
        
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                magicLinkModal.classList.remove('active');
            });
        });
        
        if (magicLinkForm) {
            magicLinkForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('magic-email').value;
                
                try {
                    const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: {
                            redirectTo: `${window.location.origin}/dashboard.html`
                        }
                    });
                    
                    if (error) throw error;
                    
                    alert('Magic Link wurde gesendet. Bitte überprüfen Sie Ihre E-Mail.');
                    magicLinkModal.classList.remove('active');
                } catch (error) {
                    alert(`Fehler beim Senden des Magic Links: ${error.message}`);
                }
            });
        }
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const { error } = await supabase.auth.signOut();
                
                if (error) throw error;
                
                window.location.href = 'signin.html';
            } catch (error) {
                console.error('Error signing out:', error);
                alert(`Fehler beim Abmelden: ${error.message}`);
            }
        });
    }
    
    // User menu dropdown
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
    
    // Helper functions
    async function checkAuth() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            // If we're on an auth page but already logged in, redirect to dashboard
            if (session) {
                const authPages = ['signin.html', 'signup.html', 'reset-password.html'];
                const currentPage = window.location.pathname.split('/').pop();
                
                if (authPages.includes(currentPage)) {
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                // Update user info if on dashboard
                if (window.location.pathname.includes('dashboard.html') || 
                    window.location.pathname.includes('index.html') ||
                    window.location.pathname.includes('employee.html')) {
                    updateUserInfo(session.user);
                }
            } else {
                // If we're on a protected page but not logged in, redirect to signin
                const protectedPages = ['dashboard.html', 'index.html', 'employee.html'];
                const currentPage = window.location.pathname.split('/').pop();
                
                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'signin.html';
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }
    
    async function handleEmailConfirmation() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                // Show confirmation success
                document.getElementById('confirmation-pending').classList.remove('active');
                document.getElementById('confirmation-success').classList.add('active');
            }
        } catch (error) {
            console.error('Error handling email confirmation:', error);
            
            // Show confirmation error
            document.getElementById('confirmation-pending').classList.remove('active');
            document.getElementById('confirmation-error').classList.add('active');
        }
    }
    
    async function updateUserInfo(user) {
        try {
            // Get user metadata
            const firstName = user.user_metadata?.first_name || 'Benutzer';
            const lastName = user.user_metadata?.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            
            // Update user name and avatar
            const userNameElements = document.querySelectorAll('#user-name, #welcome-name');
            const userAvatarElements = document.querySelectorAll('#user-avatar');
            
            userNameElements.forEach(el => {
                if (el) el.textContent = fullName;
            });
            
            userAvatarElements.forEach(el => {
                if (el) el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6c5ce7&color=fff`;
            });
            
            // Get employee data
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('position, department')
                .eq('email', user.email)
                .single();
            
            if (employeeError && employeeError.code !== 'PGRST116') {
                console.error('Error fetching employee data:', employeeError);
            }
            
            // Update user role
            const userRoleElements = document.querySelectorAll('#user-role');
            
            userRoleElements.forEach(el => {
                if (el) el.textContent = employeeData?.position || 'Mitarbeiter';
            });
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    }
    
    function updatePasswordStrength(password) {
        let strength = 0;
        let feedback = '';
        
        // Length check
        if (password.length >= 8) {
            strength += 1;
        }
        
        // Contains lowercase
        if (/[a-z]/.test(password)) {
            strength += 1;
        }
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) {
            strength += 1;
        }
        
        // Contains number
        if (/[0-9]/.test(password)) {
            strength += 1;
        }
        
        // Contains special character
        if (/[^A-Za-z0-9]/.test(password)) {
            strength += 1;
        }
        
        // Update UI
        strengthBar.className = 'strength-bar';
        
        if (password.length === 0) {
            strengthBar.style.width = '0';
            strengthText.textContent = 'Passwort-Stärke';
        } else if (strength < 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Schwach';
        } else if (strength < 3) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Mittel';
        } else if (strength < 5) {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Stark';
        } else {
            strengthBar.classList.add('very-strong');
            strengthText.textContent = 'Sehr stark';
        }
    }
    
    function showMessage(type, message) {
        if (!authMessage) return;
        
        authMessage.textContent = message;
        authMessage.className = `auth-message ${type}`;
        authMessage.classList.remove('hidden');
        
        // Scroll to message
        authMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function toggleLoading(form, isLoading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }
});
