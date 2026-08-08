// QSmart Display TV Controller
const engine = window.qsmartEngine;

let soundEnabled = false;
let audioCtx = null;
let lastCalledCode = null;

const els = {
    liveClock: document.getElementById('liveClock'),
    liveDate: document.getElementById('liveDate'),
    heroTicketCode: document.getElementById('heroTicketCode'),
    heroCounterBox: document.getElementById('heroCounterBox'),
    heroServiceName: document.getElementById('heroServiceName'),
    heroPanel: document.getElementById('heroPanel'),
    countersGrid: document.getElementById('countersGrid'),
    nextTicketsList: document.getElementById('nextTicketsList'),
    btnEnableSound: document.getElementById('btnEnableSound'),
    marqueeText: document.getElementById('marqueeText')
};

// ---------- Clock ----------
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
    const date = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    els.liveClock.textContent = time;
    els.liveDate.textContent = date;
}

// ---------- Audio ----------
function enableSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    soundEnabled = true;
    els.btnEnableSound.textContent = '🔊 Suara Aktif';
    els.btnEnableSound.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
    els.btnEnableSound.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
    playChime();
    speak('Sistem pengumuman suara telah diaktifkan');
}

function playChime() {
    if (!soundEnabled || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    const tone = (freq, start, dur) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.5, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.05);
    };
    tone(880, t0, 0.5);         // ding
    tone(659.25, t0 + 0.32, 0.7); // dong
}

function speak(text) {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'id-ID';
    utter.rate = 0.95;
    utter.pitch = 1.05;
    utter.volume = 1;
    speechSynthesis.speak(utter);
}

function announceTicket(ticket, counter) {
    if (!soundEnabled) return;
    playChime();
    setTimeout(() => {
        speak(`Perhatian. Nomor ${ticket.code}. Silakan menuju ${counter.name}. Nomor ${ticket.code}, menuju ${counter.name}.`);
    }, 1100);
}

// ---------- Render ----------
function render() {
    renderHero();
    renderCounters();
    renderNextTickets();
}

function getLatestCalled(tickets) {
    const active = tickets
        .filter(t => (t.status === 'called' || t.status === 'serving') && t.called_at)
        .sort((a, b) => new Date(b.called_at) - new Date(a.called_at));
    return active[0] || null;
}

function renderHero() {
    const t = getLatestCalled(engine.getTickets());
    const newCall = t && t.code !== lastCalledCode;
    lastCalledCode = t ? t.code : null;

    els.heroTicketCode.textContent = t ? t.code : '—';
    els.heroCounterBox.textContent = t && t.counter_name ? t.counter_name.toUpperCase() : 'LOKET —';
    els.heroServiceName.textContent = t
        ? `${t.service_name || ''} · ${t.status === 'serving' ? 'Sedang dilayani' : 'Dipanggil — mohon segera hadir'}`
        : 'Menunggu panggilan berikutnya...';

    if (newCall) {
        els.heroTicketCode.classList.remove('hero-pop');
        els.heroPanel.classList.remove('flash-border');
        void els.heroTicketCode.offsetWidth;
        void els.heroPanel.offsetWidth;
        els.heroTicketCode.classList.add('hero-pop');
        els.heroPanel.classList.add('flash-border');
    }
}

function renderCounters() {
    const counters = engine.getCounters();
    const tickets = engine.getTickets();

    els.countersGrid.innerHTML = '';
    counters.forEach(c => {
        const active = tickets
            .filter(t => t.counter_id === c.id && (t.status === 'called' || t.status === 'serving'))
            .sort((a, b) => new Date(b.called_at || 0) - new Date(a.called_at || 0))[0];

        let status, badgeClass;
        if (active && active.status === 'serving') {
            status = 'Dilayani';
            badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
        } else if (active) {
            status = 'Dipanggil';
            badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
        } else {
            status = 'Siaga';
            badgeClass = 'bg-slate-500/15 text-slate-400 border-slate-600/40';
        }

        const card = document.createElement('div');
        card.className = `rounded-2xl border ${active ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-800 bg-slate-800/40'} p-5 transition`;
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <p class="font-bold text-lg">${c.name}</p>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClass}">${status}</span>
            </div>
            <p class="num text-4xl font-black ${active ? 'text-white' : 'text-slate-600'}">${active ? active.code : '—'}</p>
            <p class="text-xs text-slate-400 mt-1.5">${serviceName(c.serviceId)}</p>
        `;
        els.countersGrid.appendChild(card);
    });
}

function renderNextTickets() {
    const waiting = engine.getTickets()
        .filter(t => t.status === 'waiting')
        .sort((a, b) => a.queue_position - b.queue_position)
        .slice(0, 6);

    els.nextTicketsList.innerHTML = '';
    if (waiting.length === 0) {
        const li = document.createElement('li');
        li.className = 'col-span-full text-center text-slate-500 py-6';
        li.textContent = 'Tidak ada antrean menunggu';
        els.nextTicketsList.appendChild(li);
        return;
    }

    waiting.forEach((t, i) => {
        const li = document.createElement('li');
        li.className = 'fade-in flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl px-4 py-3';
        li.innerHTML = `
            <span class="num w-8 text-center text-2xl font-black ${i === 0 ? 'text-indigo-300' : 'text-slate-500'}">${i + 1}</span>
            <span class="num text-xl font-extrabold flex-1">${t.code}</span>
            <span class="text-xs text-slate-400 truncate">${t.service_name || serviceName(t.service_id)}</span>
        `;
        els.nextTicketsList.appendChild(li);
    });
}

function updateMarquee() {
    const called = getLatestCalled(engine.getTickets());
    const parts = [];
    if (called) parts.push(`🔔 Nomor ${called.code} dipanggil menuju ${called.counter_name || 'loket pelayanan'}`);
    parts.push('Selamat datang di QSmart NextQ');
    parts.push('Silakan ambil nomor antrean melalui mesin antrean');
    parts.push('Mohon menunggu panggilan nomor Anda');
    parts.push('Terima kasih atas kesabaran Anda');
    els.marqueeText.textContent = parts.join(' • ');
}

function serviceName(serviceId) {
    const s = engine.getServices().find(x => x.id === serviceId);
    return s ? s.name : '—';
}

// ---------- Events ----------
function onEngineEvent(e) {
    if (e.type === 'TICKET_CALLED') {
        render();
        announceTicket(e.data.ticket, e.data.counter);
        updateMarquee();
    } else if (e.type === 'TICKETS_UPDATED' || e.type === 'DEMO_RESET' || e.type === 'TICKET_SKIPPED') {
        render();
        updateMarquee();
    }
}

// ---------- Init ----------
function init() {
    updateClock();
    setInterval(updateClock, 1000);

    els.btnEnableSound.addEventListener('click', enableSound);

    engine.subscribe(onEngineEvent);
    setInterval(render, 1000);

    render();
    updateMarquee();
}

init();
