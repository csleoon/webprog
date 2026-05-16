document.addEventListener('DOMContentLoaded', async () => {
  const user = getUser();
  if (!isLoggedIn() || user?.role !== 'admin') {
    window.location.href = '/';
    return;
  }
  buildNav();

  const tbody = document.getElementById('polls-tbody');
  const alertBox = document.getElementById('alert');

  function showAlert(msg, type = 'error') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = msg;
    alertBox.hidden = false;
    setTimeout(() => { alertBox.hidden = true; }, 3000);
  }

  async function loadPolls() {
    tbody.innerHTML = '<tr><td colspan="5" class="loader">Betöltés...</td></tr>';
    const result = await apiFetch('/api/admin/polls');
    if (!result || !result.ok) {
      tbody.innerHTML = '<tr><td colspan="5">Nem sikerült betölteni.</td></tr>';
      return;
    }
    renderTable(result.data);
  }

  function renderTable(polls) {
    tbody.innerHTML = '';
    if (polls.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nincs szavazás.</td></tr>';
      return;
    }
    polls.forEach(poll => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${poll.id}</td>
        <td>${escHtml(poll.question)}</td>
        <td><span class="badge ${poll.isActive ? 'badge-active' : 'badge-inactive'}">${poll.isActive ? 'Aktív' : 'Inaktív'}</span></td>
        <td>${poll.totalVotes}</td>
        <td style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-sm btn-secondary toggle-btn" data-id="${poll.id}" data-active="${poll.isActive}">
            ${poll.isActive ? 'Deaktiválás' : 'Aktiválás'}
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${poll.id}">Törlés</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const isActive = btn.dataset.active === 'true';
        const result = await apiFetch(`/api/admin/polls/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !isActive }),
        });
        if (!result || !result.ok) { showAlert('Hiba történt.'); return; }
        showAlert(`Szavazás ${!isActive ? 'aktiválva' : 'deaktiválva'}.`, 'success');
        loadPolls();
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Biztosan törlöd ezt a szavazást? Ez visszafordíthatatlan!')) return;
        const id = parseInt(btn.dataset.id);
        const result = await apiFetch(`/api/admin/polls/${id}`, { method: 'DELETE' });
        if (!result || !result.ok) { showAlert('Hiba történt.'); return; }
        showAlert('Szavazás törölve.', 'success');
        loadPolls();
      });
    });
  }

  loadPolls();
});

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
