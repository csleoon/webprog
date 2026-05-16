document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return; }
  buildNav();

  const form = document.getElementById('create-poll-form');
  const optionsList = document.getElementById('options-list');
  const addBtn = document.getElementById('add-option-btn');
  const alertBox = document.getElementById('alert');

  function showAlert(msg, type = 'error') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = msg;
    alertBox.hidden = false;
  }

  function addOptionInput(value = '') {
    const row = document.createElement('div');
    row.className = 'option-input-row';
    row.innerHTML = `
      <input type="text" placeholder="Lehetőség szövege" value="${escHtml(value)}" required />
      <button type="button" class="remove-option-btn" title="Eltávolítás">✕</button>
    `;
    row.querySelector('.remove-option-btn').addEventListener('click', () => {
      if (optionsList.children.length > 2) row.remove();
    });
    optionsList.appendChild(row);
  }

  addOptionInput();
  addOptionInput();

  addBtn.addEventListener('click', () => addOptionInput());

  form.addEventListener('submit', async e => {
    e.preventDefault();
    alertBox.hidden = true;

    const question = form.question.value.trim();
    const inputs = [...optionsList.querySelectorAll('input')];
    const options = inputs.map(i => i.value.trim()).filter(Boolean);

    if (options.length < 2) {
      showAlert('Legalább 2 lehetőség szükséges.');
      return;
    }

    const result = await apiFetch('/api/polls', {
      method: 'POST',
      body: JSON.stringify({ question, options }),
    });

    if (!result) return;
    if (!result.ok) {
      showAlert(result.data.error || 'Hiba történt.');
      return;
    }
    showAlert('Szavazás sikeresen létrehozva! Átirányítás...', 'success');
    setTimeout(() => { window.location.href = '/'; }, 900);
  });
});

function escHtml(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
