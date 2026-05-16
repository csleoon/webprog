document.addEventListener('DOMContentLoaded', async () => {
  buildNav();

  const grid = document.getElementById('polls-grid');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');

  grid.innerHTML = '<p class="loader">Szavazások betöltése...</p>';

  let votedPollIds = new Set();

  if (isLoggedIn()) {
    const me = await apiFetch('/api/me');
    if (me && me.ok) {
      votedPollIds = new Set(me.data.votes.map(v => v.pollId));
      if (me.data.votes.length > 0 && historySection) {
        historySection.hidden = false;
        historyList.innerHTML = '';
        me.data.votes.forEach(v => {
          const li = document.createElement('li');
          li.className = 'history-item';
          li.innerHTML = `
            <div class="poll-question">${escHtml(v.option.poll.question)}</div>
            <div class="voted-option">Szavazatom: ${escHtml(v.option.text)}</div>
            <div class="cast-at">${new Date(v.castAt).toLocaleString('hu-HU')}</div>
          `;
          historyList.appendChild(li);
        });
      }
    }
  }

  const result = await apiFetch('/api/polls');
  if (!result || !result.ok) {
    grid.innerHTML = '<p class="loader">Nem sikerült betölteni a szavazásokat.</p>';
    return;
  }

  const polls = result.data;
  if (polls.length === 0) {
    grid.innerHTML = '<p class="loader">Jelenleg nincs aktív szavazás.</p>';
    return;
  }

  grid.innerHTML = '';
  polls.forEach(poll => grid.appendChild(renderPollCard(poll, votedPollIds)));
});

function renderPollCard(poll, votedPollIds) {
  const alreadyVoted = votedPollIds.has(poll.id);
  const card = document.createElement('div');
  card.className = 'poll-card';
  card.dataset.pollId = poll.id;

  const h3 = document.createElement('h3');
  h3.textContent = poll.question;
  card.appendChild(h3);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${poll.totalVotes} szavazat${poll.creator ? ` · ${poll.creator.username}` : ''}`;
  card.appendChild(meta);

  poll.options.forEach(opt => {
    const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
      <div class="option-label">
        <span>${escHtml(opt.text)}</span>
        <span>${opt.voteCount} (${pct}%)</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
    `;

    if (!alreadyVoted && isLoggedIn()) {
      const btn = document.createElement('button');
      btn.className = 'vote-btn';
      btn.textContent = 'Szavazok';
      btn.dataset.optionId = opt.id;
      btn.addEventListener('click', () => castVote(btn, poll, opt.id));
      row.appendChild(btn);
    }

    card.appendChild(row);
  });

  if (alreadyVoted) {
    const badge = document.createElement('span');
    badge.className = 'voted-badge';
    badge.textContent = 'Már szavaztál';
    card.appendChild(badge);
  } else if (!isLoggedIn()) {
    const note = document.createElement('p');
    note.style.fontSize = '.85rem';
    note.style.color = '#666';
    note.innerHTML = '<a href="/login.html">Belépés</a> szükséges a szavazáshoz.';
    card.appendChild(note);
  }

  return card;
}

async function castVote(btn, poll, optionId) {
  btn.disabled = true;
  btn.textContent = '...';

  const result = await apiFetch('/api/vote', {
    method: 'POST',
    body: JSON.stringify({ optionId }),
  });

  if (!result) return;

  if (!result.ok) {
    alert(result.data.error || 'Hiba a szavazás során.');
    btn.disabled = false;
    btn.textContent = 'Szavazok';
    return;
  }

  const updated = await apiFetch(`/api/polls/${poll.id}`);
  if (updated && updated.ok) {
    const card = document.querySelector(`[data-poll-id="${poll.id}"]`);
    const newCard = renderPollCard(updated.data, new Set([poll.id]));
    card.replaceWith(newCard);
  }
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
