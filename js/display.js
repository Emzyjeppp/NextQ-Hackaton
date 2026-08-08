// Q-Smart Display TV Controller (Member C)
const engine = window.qsmartEngine;

const MAX_NEXT_TICKETS = 8;

let soundEnabled = false;
let audioCtx = null;
let lastCalledCode = null;

const els = {
    liveClock: document.getElementById('liveClock'),
    liveDate: document.getElementById('liveDate'),
    heroTicketCode: document.getElementById('heroTicketCode'),
    heroServiceName: document.getElementById('heroServiceName'),
    heroCallTime: document.getElementById('heroCallTime'),
    heroCounterBox: document.getElementById('heroCounterBox'),
    heroPanel: document.getElementById('heroPanel'),
    countersGrid: document.getElementById('countersGrid'),
    nextTicketsList: document.getElementById('nextTicketsList'),
    btnEnableSound: document.getElementById('btnEnableSound'),
    marqueeText: document.getElementById('marqueeText')
};

// ---------- Clock ----------
function updateClock() {
    const now = new Date();
    els.liveClock.textContent = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
    els.liveDate.textContent = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
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
    tone(880, t0, 0.5);           // ding
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

function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function renderHero() {
    const t = getLatestCalled(engine.getTickets());
    const newCall = t && t.code !== lastCalledCode;
    lastCalledCode = t ? t.code : null;

    els.heroTicketCode.textContent = t ? t.code : '—';
    els.heroServiceName.textContent = t
        ? `${t.service_name || 'Layanan'} · ${t.status === 'serving' ? 'sedang dilayani' : 'mohon segera hadir'}`
        : 'Menunggu panggilan berikutnya...';
    els.heroCallTime.textContent = t ? `Waktu panggilan: ${fmtTime(t.called_at)}` : '—';

    if (t && t.counter_name) {
        const cname = t.counter_name.toUpperCase();
        els.heroCounterBox.innerHTML = `SILAKAN KE <span class="underline decoration-4 underline-offset-4">${cname}</span>`;
        els.heroCounterBox.className = 'mt-7 inline-block bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 text-4xl xl:text-5xl font-black px-12 py-5 rounded-3xl shadow-2xl';
    } else {
        els.heroCounterBox.innerHTML = 'MENUNGGU PANGGILAN';
        els.heroCounterBox.className = 'mt-7 inline-block bg-slate-800 text-slate-300 text-4xl xl:text-5xl font-black px-12 py-5 rounded-3xl border border-slate-700';
    }

    if (newCall) {
        els.heroTicketCode.classList.remove('hero-pop');
        els.heroPanel.classList.remove('glow-on');
        void els.heroTicketCode.offsetWidth;
        void els.heroPanel.offsetWidth;
        els.heroTicketCode.classList.add('hero-pop');
        els.heroPanel.classList.add('glow-on');
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
            badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse';
        } else {
            status = 'Idle';
            badgeClass = 'bg-slate-500/15 text-slate-400 border-slate-600/40';
        }

        const card = document.createElement('div');
        card.className = `rounded-2xl border ${active ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-800 bg-slate-800/40'} p-4 flex items-center justify-between gap-3 transition`;
        card.innerHTML = `
            <div>
                <p class="font-bold text-lg leading-tight">${c.name}</p>
                <p class="text-xs text-slate-400 mt-0.5">${serviceName(c.serviceId)}</p>
            </div>
            <div class="text-right">
                <p class="num text-3xl font-black ${active ? 'text-white' : 'text-slate-600'}">${active ? active.code : 'Idle'}</p>
                <span class="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}">${status}</span>
            </div>
        `;
        els.countersGrid.appendChild(card);
    });
}

function renderNextTickets() {
    const waiting = engine.getTickets()
        .filter(t => t.status === 'waiting')
        .sort((a, b) => a.queue_position - b.queue_position)
        .slice(0, MAX_NEXT_TICKETS);

    els.nextTicketsList.innerHTML = '';
    if (waiting.length === 0) {
        const p = document.createElement('p');
        p.className = 'text-slate-500 text-sm py-4 text-center w-full';
        p.textContent = 'Tidak ada antrean menunggu';
        els.nextTicketsList.appendChild(p);
        return;
    }

    waiting.forEach((t, i) => {
        const chip = document.createElement('span');
        chip.className = 'fade-in num inline-flex items-center gap-2 text-base font-bold px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700';
        chip.innerHTML = `
            <span class="text-xs font-black text-indigo-300">${i + 1}</span>
            <span>${t.code}</span>
        `;
        chip.title = t.service_name || serviceName(t.service_id);
        els.nextTicketsList.appendChild(chip);
    });
}

function updateMarquee() {
    const called = getLatestCalled(engine.getTickets());
    const parts = [];
    if (called && called.counter_name) {
        parts.push(`🔔 Nomor ${called.code} dipanggil menuju ${called.counter_name}`);
    }
    parts.push('Selamat datang di Klinik NextQ');
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
