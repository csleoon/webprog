document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn() && getUser()) { window.location.href = '/'; return; }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginSection = document.getElementById('section-login');
  const registerSection = document.getElementById('section-register');

  function showAlert(container, msg, type = 'error') {
    const existing = container.querySelector('.alert');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.textContent = msg;
    container.prepend(div);
  }

  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginSection.hidden = false;
    registerSection.hidden = true;
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerSection.hidden = false;
    loginSection.hidden = true;
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const result = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!result) return;
    if (!result.ok) {
      showAlert(loginForm, result.data.error || 'Hiba történt.');
      return;
    }
    localStorage.setItem('token', result.data.token);
    localStorage.setItem('user', JSON.stringify(result.data.user));
    window.location.href = '/';
  });

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = registerForm.username.value.trim();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value;
    const result = await apiFetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (!result) return;
    if (!result.ok) {
      showAlert(registerForm, result.data.error || 'Hiba történt.');
      return;
    }
    showAlert(registerForm, 'Sikeres regisztráció! Átirányítás...', 'success');
    localStorage.setItem('token', result.data.token);
    localStorage.setItem('user', JSON.stringify(result.data.user));
    setTimeout(() => { window.location.href = '/'; }, 800);
  });
});
