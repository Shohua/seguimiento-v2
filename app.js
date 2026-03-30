// ═══════════════════════════════════════════
//  CONSTANTS & STATE
// ═══════════════════════════════════════════
const KEY = 'como_siendo_v3';
const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_FULL = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

let answers = { q1:null, q2:null, q3:null, q4:null, q5:null };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getData() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { entries:{} }; }
  catch(e) { return { entries:{} }; }
}
function saveData(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
(function init() {
  const now = new Date();
  document.getElementById('fecha-display').textContent =
    `${DAYS_ES[now.getDay()]}, ${now.getDate()} de ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`;

  renderRacha();
  checkTodayPrefill();
})();

// ═══════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════
function switchTab(t) {
  ['hoy','historial'].forEach(id => {
    document.getElementById('view-'+id).classList.toggle('active', id===t);
    document.getElementById('tab-'+id.replace('historial','hist')).classList.toggle('active', id===t);
  });
  if (t === 'historial') renderHistorial();
}

// ═══════════════════════════════════════════
//  RACHA LOGIC
// ═══════════════════════════════════════════
function renderRacha() {
  const data = getData();
  const now = new Date();

  // Build last 14 days
  const grid = document.getElementById('days-grid');
  grid.innerHTML = '';
  const today = todayKey();
  const svUsed = getSalvividasUsedThisMonth(data);
  const SV_MAX = 2;

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const hasEntry = !!data.entries[k];
    const isToday = k === today;

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    const dot = document.createElement('div');
    dot.className = 'day-dot' + (hasEntry ? ' filled' : '') + (isToday ? ' today' : '');
    dot.title = k;
    const num = document.createElement('div');
    num.className = 'day-num';
    num.textContent = d.getDate();
    cell.appendChild(dot);
    cell.appendChild(num);
    grid.appendChild(cell);
  }

  // Calculate streak
  const streak = calcStreak(data, today);
  const el = document.getElementById('racha-num');
  el.textContent = streak;
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 400);

  // Emoji & title
  const flame = document.getElementById('racha-flame');
  const title = document.getElementById('racha-title');
  if (streak === 0) { flame.textContent = '🌱'; title.textContent = 'días seguidos'; }
  else if (streak < 4) { flame.textContent = '✨'; title.textContent = 'días seguidos'; }
  else if (streak < 10) { flame.textContent = '🔥'; title.textContent = 'días seguidos'; }
  else if (streak < 20) { flame.textContent = '⚡'; title.textContent = 'días increíbles'; }
  else { flame.textContent = '🌟'; title.textContent = 'días siendo fiel a ti'; }

  // Salvavidas
  const remaining = SV_MAX - svUsed;
  document.getElementById('sv-count').textContent = remaining;
  document.getElementById('sv-badge').title = `Salvavidas: puedes saltarte hasta ${SV_MAX} días por mes sin romper la racha. Te quedan ${remaining} este mes.`;
}

function calcStreak(data, today) {
  const SV_MAX = 2;
  let streak = 0;
  let svUsed = 0;
  const now = new Date();

  const hasToday = !!data.entries[today];
  let consecutiveStart = hasToday ? 0 : 1;

  for (let i = consecutiveStart; i < 366; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const monthK = `${d.getFullYear()}-${d.getMonth()}`;

    if (data.entries[k]) {
      streak++;
    } else {
      const usedInMonth = (data.salvavidas || {})[monthK] || 0;
      if (usedInMonth + (svUsed) < SV_MAX) {
        svUsed++;
      } else {
        break;
      }
    }
  }

  if (hasToday) streak = Math.max(streak, 1);
  return streak;
}

function getSalvividasUsedThisMonth(data) {
  const now = new Date();
  const monthK = `${now.getFullYear()}-${now.getMonth()}`;
  return (data.salvavidas || {})[monthK] || 0;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ═══════════════════════════════════════════
//  PREFILL IF TODAY EXISTS
// ═══════════════════════════════════════════
function checkTodayPrefill() {
  const data = getData();
  const today = todayKey();
  const entry = data.entries[today];
  if (!entry) return;

  document.getElementById('edit-notice').classList.add('visible');

  if (entry.q1) {
    const btns = document.querySelectorAll('.scale-btns')[0].querySelectorAll('.sbtn');
    btns[entry.q1-1]?.classList.add('sel');
    answers.q1 = entry.q1;
  }
  if (entry.q5) {
    const btns = document.querySelectorAll('.scale-btns')[1].querySelectorAll('.sbtn');
    btns[entry.q5-1]?.classList.add('sel');
    answers.q5 = entry.q5;
  }
  prefillYN('q2', entry.q2);
  prefillYN('q3', entry.q3);
  prefillYN('q4', entry.q4);
  if (entry.q6) document.getElementById('q6').value = entry.q6;
  if (entry.q7) document.getElementById('q7').value = entry.q7;
  answers.q2 = entry.q2;
  answers.q3 = entry.q3;
  answers.q4 = entry.q4;
}

function prefillYN(q, val) {
  if (!val) return;
  const map = {'Sí':'yes','Un poco':'maybe','No':'no','No me moví':'no'};
  const allYN = document.querySelectorAll('.yesno');
  const qIdx = ['q2','q3','q4'].indexOf(q);
  if (qIdx < 0 || !allYN[qIdx]) return;
  const btns = allYN[qIdx].querySelectorAll('.ybtn');
  btns.forEach(b => {
    const bval = b.textContent.trim();
    if (bval === val) {
      const cls = map[val] || 'no';
      b.classList.add('sel-'+cls);
    }
  });
}

// ═══════════════════════════════════════════
//  SELECTORS
// ═══════════════════════════════════════════
function selScale(btn, q, v) {
  btn.closest('.scale-btns').querySelectorAll('.sbtn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  answers[q] = v;
}

function selYN(btn, q, v, type) {
  btn.closest('.yesno').querySelectorAll('.ybtn').forEach(b =>
    b.classList.remove('sel-yes','sel-maybe','sel-no'));
  btn.classList.add('sel-'+type);
  answers[q] = v;
}

// ═══════════════════════════════════════════
//  SAVE
// ═══════════════════════════════════════════
function guardar() {
  if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4 || !answers.q5) {
    showToast('Responde todas las preguntas antes de guardar 🙏', 'warn');
    return;
  }

  const data = getData();
  const today = todayKey();
  const isEdit = !!data.entries[today];

  const entry = {
    fecha: today,
    ts: Date.now(),
    q1: answers.q1,
    q2: answers.q2,
    q3: answers.q3,
    q4: answers.q4,
    q5: answers.q5,
    q6: document.getElementById('q6').value.trim(),
    q7: document.getElementById('q7').value.trim(),
  };

  data.entries[today] = entry;
  saveData(data);

  renderRacha();
  showToast(isEdit ? '✓ Entrada actualizada. Bien por revisarte.' : '✓ Día guardado. Gracias por este momento.', 'success');

  document.getElementById('edit-notice').classList.add('visible');
}

// ═══════════════════════════════════════════
//  HISTORIAL
// ═══════════════════════════════════════════
function renderHistorial() {
  const data = getData();
  const entries = Object.values(data.entries).sort((a,b) => b.fecha.localeCompare(a.fecha));
  const list = document.getElementById('hist-list');
  const empty = document.getElementById('hist-empty');

  list.querySelectorAll('.entry').forEach(e => e.remove());

  if (!entries.length) { empty.style.display='block'; return; }
  empty.style.display='none';

  entries.forEach((e) => {
    const d = new Date(e.fecha + 'T12:00:00');
    const dayN = d.getDate();
    const monS = MONTHS[d.getMonth()];

    const tratoPill = e.q1 >= 4 ? 'pill-g' : e.q1 <= 2 ? 'pill-r' : 'pill-a';
    const juicioPill = e.q5 <= 2 ? 'pill-g' : e.q5 >= 4 ? 'pill-r' : 'pill-a';

    const preview = e.q6 ? `"${e.q6.slice(0,60)}${e.q6.length>60?'…':''}"` : '';

    const el = document.createElement('div');
    el.className = 'entry';
    el.innerHTML = `
      <div class="entry-header" onclick="toggleEntry(this.parentElement)">
        <div class="entry-date-badge">
          <div class="day">${dayN}</div>
          <div class="mon">${monS}</div>
        </div>
        <div class="entry-summary">
          <div class="pills">
            <span class="pill ${tratoPill}">Trato ${e.q1}/5</span>
            <span class="pill ${juicioPill}">Juicio ${e.q5}/5</span>
            <span class="pill pill-n">Disfruté: ${e.q2}</span>
          </div>
          ${preview ? `<div class="entry-preview">${preview}</div>` : ''}
        </div>
        <div class="entry-chevron">⌄</div>
      </div>
      <div class="entry-body">
        <div class="detail-grid">
          <div class="drow"><span class="drow-label">¿Cómo me traté?</span><span class="drow-val">${e.q1}/5</span></div>
          <div class="drow"><span class="drow-label">Juicio interno</span><span class="drow-val">${e.q5}/5</span></div>
          <div class="drow"><span class="drow-label">¿Disfruté algo?</span><span class="drow-val">${e.q2}</span></div>
          <div class="drow"><span class="drow-label">¿Me moví?</span><span class="drow-val">${e.q3}</span></div>
          <div class="drow"><span class="drow-label">¿Conecté con alguien?</span><span class="drow-val">${e.q4}</span></div>
          ${e.q6 ? `<div class="drow drow-reflection"><span class="drow-label">Lo que me gustó de mí</span><span class="drow-val">${e.q6}</span></div>` : ''}
          ${e.q7 ? `<div class="drow drow-reflection"><span class="drow-label">Agradecimientos</span><span class="drow-val">${e.q7}</span></div>` : ''}
        </div>
        <div class="entry-actions">
          <button class="btn-sm" onclick="exportOne('${e.fecha}')">⬇ Exportar este día</button>
        </div>
      </div>`;
    list.appendChild(el);
  });
}

function toggleEntry(el) {
  el.classList.toggle('open');
}

// ═══════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════
function entryToText(e) {
  const d = new Date(e.fecha + 'T12:00:00');
  let t = `${'─'.repeat(42)}\n`;
  t += `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}\n`;
  t += `${'─'.repeat(42)}\n`;
  t += `¿Cómo me traté?            ${e.q1}/5\n`;
  t += `Juicio interno             ${e.q5}/5\n`;
  t += `¿Disfruté algo?            ${e.q2}\n`;
  t += `¿Me moví?                  ${e.q3}\n`;
  t += `¿Conecté con alguien?      ${e.q4}\n`;
  if (e.q6) t += `\nLo que me gustó de mí:\n"${e.q6}"\n`;
  if (e.q7) t += `\nAgradecimientos:\n${e.q7}\n`;
  return t + '\n';
}

function exportAll() {
  const data = getData();
  const entries = Object.values(data.entries).sort((a,b) => b.fecha.localeCompare(a.fecha));
  if (!entries.length) { showToast('No hay registros aún.', 'warn'); return; }

  let txt = 'CÓMO ESTOY SIENDO — HISTORIAL COMPLETO\n';
  txt += `Exportado: ${new Date().toLocaleString('es-CL')}\n`;
  txt += `Total de días registrados: ${entries.length}\n\n`;
  entries.forEach(e => { txt += entryToText(e); });
  download(txt, `mi_diario_${todayKey()}.txt`);
  showToast('✓ Historial exportado', 'success');
}

function exportOne(fecha) {
  const data = getData();
  const e = data.entries[fecha];
  if (!e) return;
  download(entryToText(e), `dia_${fecha}.txt`);
  showToast('✓ Día exportado', 'success');
}

function download(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════
let toastTimer;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' '+type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
