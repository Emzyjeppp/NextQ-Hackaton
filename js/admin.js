// QSmart Admin Controller
const engine = window.qsmartEngine;

let state = {
    counterId: null,
    filter: 'semua',
    activeTicket: null
};

const STATUS_LABEL = {
    waiting:  { text: 'Menunggu', color: 'bg-sky-500/15 text-sky-300 border-sky-500/40' },
    called:   { text: 'Dipanggil', color: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
    serving:  { text: 'Dilayani', color: 'bg-violet-500/15 text-violet-300 border-violet-500/40' },
    done:     { text: 'Selesai', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
    expired:  { text: 'Lewat', color: 'bg-rose-500/15 text-rose-300 border-rose-500/40' }
};

const els = {
    selectCounter: document.getElementById('selectCounter'),
    statWaiting: document.getElementById('statWaiting'),
    statCalling: document.getElementById('statCalling'),
    statDone: document.getElementById('statDone'),
    statAvgDuration: document.getElementById('statAvgDuration'),
    activeTicketCode: document.getElementById('activeTicketCode'),
    activeTicketInfo: document.getElementById('activeTicketInfo'),
    graceWrapper: document.getElementById('graceWrapper'),
    graceCountdownText: document.getElementById('graceCountdownText'),
    btnCallNext: document.getElementById('btnCallNext'),
    btnServe: document.getElementById('btnServe'),
    btnFinish: document.getElementById('btnFinish'),
    btnSkip: document.getElementById('btnSkip'),
    queueFilter: document.getElementById('queueFilter'),
    queueTableBody: document.getElementById('queueTableBody'),
    toast: document.getElementById('toast'),
    btnResetDemo: document.getElementById('btnResetDemo')
};

// ---------- Init ----------
function init() {
    renderCounterOptions();
    bindEvents();
    engine.subscribe(() => {
        render();
    });
    setInterval(render, 1000); // refresh grace countdown & stats
    render();
}

function renderCounterOptions() {
    const counters = engine.getCounters();
    els.selectCounter.innerHTML = '';
    counters.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} – ${serviceName(c.serviceId)}`;
        els.selectCounter.appendChild(opt);
    });
    state.counterId = counters.length ? counters[0].id : null;
    els.selectCounter.value = state.counterId || '';
}

function bindEvents() {
    els.selectCounter.addEventListener('change', () => {
        state.counterId = els.selectCounter.value || null;
        render();
    });
    els.queueFilter.addEventListener('change', () => {
        state.filter = els.queueFilter.value;
        renderTable();
    });
    els.btnCallNext.addEventListener('click', onCallNext);
    els.btnServe.addEventListener('click', onServe);
    els.btnFinish.addEventListener('click', onFinish);
    els.btnSkip.addEventListener('click', onSkipActive);
    els.btnResetDemo.addEventListener('click', () => {
        engine.resetDemoData();
        showToast('Data demo berhasil di-reset');
    });
}

// ---------- Helpers ----------
function serviceName(serviceId) {
    const s = engine.getServices().find(x => x.id === serviceId);
    return s ? s.name : '—';
}

function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDuration(seconds) {
    if (seconds == null || isNaN(seconds)) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m} mnt ${String(s).padStart(2, '0')} dtk`;
}

function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.add('hidden'), 2500);
}

// ---------- Render ----------
function render() {
    const tickets = engine.getTickets();
    updateStats(tickets);
    updateActiveTicket(tickets);
    renderTable();
}

function updateStats(tickets) {
    els.statWaiting.textContent = tickets.filter(t => t.status === 'waiting').length;
    els.statCalling.textContent = tickets.filter(t => t.status === 'called').length;
    els.statDone.textContent = tickets.filter(t => t.status === 'done').length;

    const doneTickets = tickets.filter(t =>
        t.status === 'done' && t.served_at && t.done_at
    );
    let total = 0, count = 0;
    doneTickets.forEach(t => {
        const dur = (new Date(t.done_at).getTime() - new Date(t.served_at).getTime()) / 1000;
        if (dur >= 10) { total += dur; count++; }
    });
    els.statAvgDuration.textContent = count > 0 ? fmtDuration(total / count) : '—';
}

function getActiveTicket(tickets) {
    if (!state.counterId) return null;
    const active = tickets
        .filter(t => t.counter_id === state.counterId && (t.status === 'called' || t.status === 'serving'))
        .sort((a, b) => new Date(b.called_at || 0) - new Date(a.called_at || 0));
    return active[0] || null;
}

function updateActiveTicket(tickets) {
    state.activeTicket = getActiveTicket(tickets);
    const t = state.activeTicket;

    els.activeTicketCode.textContent = t ? t.code : '—';
    els.activeTicketInfo.textContent = t
        ? `${t.service_name} · ${STATUS_LABEL[t.status].text} · ${t.counter_name || 'Loket'}`
        : 'Belum ada tiket aktif di loket ini';

    // Grace countdown
    if (t && t.status === 'called' && t.grace_expires_at) {
        els.graceWrapper.classList.remove('hidden');
        updateGrace(t);
    } else {
        els.graceWrapper.classList.add('hidden');
        clearInterval(updateGrace._int);
        updateGrace._int = null;
    }

    // Buttons
    els.btnCallNext.disabled = !state.counterId || !tickets.some(x => x.status === 'waiting' && x.service_id === engine.getCounters().find(c => c.id === state.counterId)?.serviceId);
    els.btnServe.disabled = !(t && t.status === 'called');
    els.btnFinish.disabled = !(t && t.status === 'serving');
    els.btnSkip.disabled = !t || t.status === 'expired';
}

function updateGrace(t) {
    if (updateGrace._int) clearInterval(updateGrace._int);
    const tick = () => {
        const remaining = new Date(t.grace_expires_at).getTime() - Date.now();
        const el = els.graceCountdownText;
        if (remaining <= 0) {
            el.textContent = 'GRACE HABIS!';
            el.className = 'num inline-block pulse-red rounded-xl px-4 py-2 text-2xl font-bold';
            clearInterval(updateGrace._int);
            updateGrace._int = null;
            return;
        }
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        el.textContent = `${m}:${String(s).padStart(2, '0')}`;
        const warn = remaining < 30000;
        el.className = `num inline-block rounded-xl px-4 py-2 text-2xl font-bold border ${warn
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/40'}`;
    };
    tick();
    updateGrace._int = setInterval(tick, 1000);
}

function renderTable() {
    const tickets = engine.getTickets().slice().sort((a, b) => a.queue_position - b.queue_position);
    const filtered = state.filter === 'semua'
        ? tickets
        : tickets.filter(t => t.status === state.filter);

    els.queueTableBody.innerHTML = '';

    if (filtered.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="px-5 py-10 text-center text-slate-500">Belum ada tiket dengan status ini</td>';
        els.queueTableBody.appendChild(tr);
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-800/60 hover:bg-slate-800/40 transition fade-in';

        const st = STATUS_LABEL[t.status] || STATUS_LABEL.waiting;
        const canSkip = !['done', 'expired'].includes(t.status);

        tr.innerHTML = `
            <td class="px-5 py-3 font-extrabold text-base num">${t.code}</td>
            <td class="px-5 py-3 text-slate-300">${t.service_name || serviceName(t.service_id)}</td>
            <td class="px-5 py-3">
                <span class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${st.color}">${st.text}</span>
            </td>
            <td class="px-5 py-3 text-slate-300">${t.counter_name || '—'}</td>
            <td class="px-5 py-3 text-slate-400 num">${fmtTime(t.created_at)}</td>
            <td class="px-5 py-3 text-right">
                ${canSkip ? `<button data-skip="${t.id}" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition">⏭ Lewati</button>` : ''}
            </td>
        `;
        els.queueTableBody.appendChild(tr);
    });

    els.queueTableBody.querySelectorAll('[data-skip]').forEach(btn => {
        btn.addEventListener('click', () => {
            engine.lewatiTiket(btn.dataset.skip);
            showToast('Tiket dilewati');
        });
    });
}

// ---------- Actions ----------
function onCallNext() {
    if (!state.counterId) return;
    const t = engine.panggilBerikutnya(state.counterId);
    if (t) {
        showToast(`📣 ${t.code} dipanggil ke ${t.counter_name}`);
    } else {
        showToast('Tidak ada tiket menunggu untuk loket ini');
    }
}

function onServe() {
    if (state.activeTicket) {
        engine.tandaiHadir(state.activeTicket.id);
        showToast(`${state.activeTicket.code} sudah hadir, silakan layani`);
    }
}

function onFinish() {
    if (state.activeTicket) {
        engine.selesaikanTiket(state.activeTicket.id);
        showToast(`${state.activeTicket.code} selesai dilayani 🎉`);
    }
}

function onSkipActive() {
    if (state.activeTicket) {
        engine.lewatiTiket(state.activeTicket.id);
        showToast(`${state.activeTicket.code} dilewati`);
    }
}

init();
