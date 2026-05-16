async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return;
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function isLoggedIn() { return !!localStorage.getItem('token'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function buildNav(activeLink) {
  const user = getUser();
  const nav = document.getElementById('nav-links');
  if (!nav) return;

  nav.innerHTML = '';

  const links = [{ href: '/', label: 'Szavazások' }];
  if (user) {
    links.push({ href: '/create-poll.html', label: 'Új szavazás' });
    if (user.role === 'admin') links.push({ href: '/admin.html', label: 'Admin' });
  }

  links.forEach(({ href, label }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    li.appendChild(a);
    nav.appendChild(li);
  });

  const li = document.createElement('li');
  if (user) {
    const span = document.createElement('span');
    span.textContent = user.username;
    span.style.color = 'rgba(255,255,255,.7)';
    span.style.fontSize = '.9rem';
    li.appendChild(span);
    nav.appendChild(li);

    const li2 = document.createElement('li');
    const btn = document.createElement('a');
    btn.href = '#';
    btn.textContent = 'Kilépés';
    btn.className = 'btn-nav';
    btn.onclick = e => { e.preventDefault(); logout(); };
    li2.appendChild(btn);
    nav.appendChild(li2);
  } else {
    const a = document.createElement('a');
    a.href = '/login.html';
    a.textContent = 'Belépés';
    a.className = 'btn-nav';
    li.appendChild(a);
    nav.appendChild(li);
  }
}
