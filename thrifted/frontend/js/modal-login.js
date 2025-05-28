document.addEventListener('DOMContentLoaded', () => {
    // Password validation and dynamic feedback for signup modal
    const passwordInput = document.getElementById('signupPassword');
    const passwordRequirements = document.getElementById('passwordRequirements');

    if (passwordInput && passwordRequirements) {
        passwordInput.addEventListener('input', () => {
            const value = passwordInput.value;
            const lengthValid = value.length >= 8;
            const uppercaseValid = /[A-Z]/.test(value);
            const lowercaseValid = /[a-z]/.test(value);
            const numberValid = /[0-9]/.test(value);
            const specialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(value);

            let message = 'Password must be at least 8 characters, include uppercase and lowercase letters, a number, and a special character.';
            let color = '#666';

            if (lengthValid && uppercaseValid && lowercaseValid && numberValid && specialCharValid) {
                message = 'Password meets all requirements.';
                color = 'green';
            } else {
                message = 'Password must be at least 8 characters, include uppercase and lowercase letters, a number, and a special character.';
                color = '#666';
            }

            passwordRequirements.textContent = message;
            passwordRequirements.style.color = color;
        });
    }

    // Modal handling
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeLogin = document.getElementById('closeLogin');
    const closeSignup = document.getElementById('closeSignup');

    loginBtn.onclick = () => {
        loginModal.style.display = 'block';
    };

    signupBtn.onclick = () => {
        signupModal.style.display = 'block';
    };

    closeLogin.addEventListener('click', () => {
        console.log('closeLogin clicked');
        loginModal.style.display = 'none';
        clearLoginForm();
    });

    if (closeSignup) {
        closeSignup.addEventListener('click', () => {
            console.log('closeSignup clicked');
            signupModal.style.display = 'none';
            clearSignupForm();
        });
    }

    window.onclick = (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            clearLoginForm();
        }
        if (event.target === signupModal) {
            signupModal.style.display = 'none';
            clearSignupForm();
        }
    };

    // Clear forms and messages
    function clearLoginForm() {
        document.getElementById('loginForm').reset();
        document.getElementById('loginMessage').textContent = '';
    }

    function clearSignupForm() {
        document.getElementById('signupForm').reset();
        document.getElementById('signupMessage').textContent = '';
    }

    // Add password length validation to login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const handleOrEmail = document.getElementById('loginUsernameOrEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        const messageElem = document.getElementById('loginMessage');
        if (!handleOrEmail || !password) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Please enter both handle/email and password.';
            return;
        }
        if (password.length < 8) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Password must be at least 8 characters long.';
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handleOrEmail, password })
            });
            const data = await response.json();
            if (response.ok) {
                messageElem.style.color = 'green';
                messageElem.textContent = data.message;
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    clearLoginForm();
                    // Optionally reload or redirect after login
                    location.reload();
                }, 1500);
            } else {
                messageElem.style.color = 'red';
                messageElem.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Error connecting to server';
        }
    });

    // Handle signup form submission with automatic login
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const handle = document.getElementById('signupHandle').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();

        const messageElem = document.getElementById('signupMessage');
        const passwordRequirementsRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!handle || !email || !password) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Please enter handle, email, and password.';
            return;
        }
        if (!passwordRequirementsRegex.test(password)) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Password does not meet the requirements.';
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, handle, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                messageElem.style.color = 'green';
                messageElem.textContent = data.message;

                // Automatically log in the user after successful signup
                const loginResponse = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handleOrEmail: handle, password })
                });
                const loginData = await loginResponse.json();
                if (loginResponse.ok) {
                    setTimeout(() => {
                        signupModal.style.display = 'none';
                        clearSignupForm();
                        // Optionally reload or redirect after login
                        location.reload();
                    }, 1500);
                } else {
                    messageElem.style.color = 'red';
                    messageElem.textContent = loginData.message || 'Automatic login failed after signup';
                }
            } else {
                messageElem.style.color = 'red';
                messageElem.textContent = data.message || 'Signup failed';
            }
        } catch (error) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Error connecting to server';
        }
    });
});
