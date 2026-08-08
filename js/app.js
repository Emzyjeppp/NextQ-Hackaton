// js/app.js
const engine = window.qsmartEngine;

// Elements
const servicesList = document.getElementById('servicesList');
const myTicketSection = document.getElementById('myTicketSection');
const servicesSection = document.getElementById('servicesSection');
const ticketServiceName = document.getElementById('ticketServiceName');
const ticketCode = document.getElementById('ticketCode');
const ticketStatusBadge = document.getElementById('ticketStatusBadge');
const peopleAheadText = document.getElementById('peopleAheadText');
const estimatedTimeText = document.getElementById('estimatedTimeText');
const callingAlertBox = document.getElementById('callingAlertBox');
const overviewList = document.getElementById('overviewList');

// State
let myCurrentTicketId = sessionStorage.getItem('qsmart_my_ticket_id');

function init() {
    engine.subscribe(onDataUpdate);
    renderApp();
    
    // Interval update for times
    setInterval(renderApp, 30000); // 30s
}

function onDataUpdate(event) {
    if (event.type === 'TICKETS_UPDATED' || event.type === 'TICKET_CALLED' || event.type === 'TICKET_SKIPPED' || event.type === 'DEMO_RESET') {
        renderApp();
    }
}

function getMyTicket() {
    if (!myCurrentTicketId) return null;
    const tickets = engine.getTickets();
    const t = tickets.find(t => t.id === myCurrentTicketId);
    if (t && ['waiting', 'called', 'serving'].includes(t.status)) {
        return t;
    }
    return null;
}

function renderApp() {
    const myTicket = getMyTicket();
    
    if (myTicket) {
        myTicketSection.classList.remove('hidden');
        servicesSection.classList.add('hidden');
        renderMyTicket(myTicket);
    } else {
        myTicketSection.classList.add('hidden');
        servicesSection.classList.remove('hidden');
        callingAlertBox.classList.add('hidden');
        renderServices();
    }
    
    renderOverview();
    
    // Render Lucide icons for dynamically added elements
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderServices() {
    const services = engine.getServices();
    const tickets = engine.getTickets();
    
    servicesList.innerHTML = '';
    
    services.forEach(service => {
        // Find waiting tickets for this service
        const waiting = tickets.filter(t => t.service_id === service.id && ['waiting', 'called', 'serving'].includes(t.status)).length;
        
        let estimatedMins = 0;
        if (waiting > 0) {
            estimatedMins = Math.ceil((waiting * service.defaultDuration) / 60);
        }

        // Map icons for Lucide based on service name or ID
        let iconName = 'stethoscope';
        if (service.id === 'srv_2') iconName = 'smile'; // Tooth equivalent
        if (service.id === 'srv_3') iconName = 'pill';

        const card = document.createElement('div');
        card.className = 'bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 shadow-sm';
        
        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-slate-700/50 text-indigo-400 flex items-center justify-center text-xl shrink-0 border border-slate-600/50">
                    <i data-lucide="${iconName}" class="w-6 h-6"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-white text-lg">${service.name}</h3>
                    <div class="text-xs text-slate-400 flex gap-3 mt-1 font-medium">
                        <span class="flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${waiting} menunggu</span>
                        <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ~${estimatedMins} mnt</span>
                    </div>
                </div>
            </div>
            <button onclick="ambilTiket('${service.id}')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors active:scale-[0.98] shadow-md flex items-center justify-center gap-2">
                <span>Ambil Antrean</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
        `;
        
        servicesList.appendChild(card);
    });
}

function renderMyTicket(ticket) {
    const est = engine.hitungEstimasiWaktu(ticket.id);
    
    ticketServiceName.textContent = ticket.service_name;
    ticketCode.textContent = ticket.code;
    
    peopleAheadText.textContent = est ? `${est.peopleAhead}` : '-';
    estimatedTimeText.textContent = est ? est.estimatedTimeStr : '-';
    
    // Status Logic
    callingAlertBox.classList.add('hidden');
    ticketStatusBadge.className = 'inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold shadow-sm';
    
    if (ticket.status === 'waiting') {
        ticketStatusBadge.textContent = 'Menunggu Giliran';
        ticketStatusBadge.classList.add('bg-indigo-500/20', 'text-indigo-300', 'border', 'border-indigo-500/30');
    } else if (ticket.status === 'called') {
        ticketStatusBadge.textContent = 'Dipanggil Sekarang';
        ticketStatusBadge.classList.add('bg-amber-500/20', 'text-amber-400', 'border', 'border-amber-500/30');
        
        callingAlertBox.classList.remove('hidden');
        callingAlertBox.innerHTML = `
            <div class="flex items-center justify-center gap-2 mb-1">
                <i data-lucide="bell-ring" class="w-5 h-5 animate-bounce"></i>
                <span class="text-base tracking-wide">GILIRAN ANDA DIPANGGIL</span>
            </div>
            <div class="text-amber-900/80 font-medium text-xs">
                Silakan menuju <strong class="text-amber-950 text-sm uppercase">${ticket.counter_name || 'Loket'}</strong>
            </div>
        `;
    } else if (ticket.status === 'serving') {
        ticketStatusBadge.textContent = 'Sedang Dilayani';
        ticketStatusBadge.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border', 'border-emerald-500/30');
    }
}

function renderOverview() {
    const services = engine.getServices();
    const tickets = engine.getTickets();
    
    overviewList.innerHTML = '';
    
    services.forEach(service => {
        // Find current serving or called
        const activeTickets = tickets.filter(t => t.service_id === service.id && ['called', 'serving'].includes(t.status));
        const waitingCount = tickets.filter(t => t.service_id === service.id && t.status === 'waiting').length;
        
        // Pick the first called or serving
        let currentNumber = '-';
        if (activeTickets.length > 0) {
            currentNumber = activeTickets.map(t => t.code).join(', ');
        }
        
        const card = document.createElement('div');
        card.className = 'bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex justify-between items-center';
        
        card.innerHTML = `
            <div>
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">${service.name}</div>
                <div class="text-xs text-slate-500"><span class="text-slate-400 font-medium">${waitingCount}</span> orang menunggu</div>
            </div>
            <div class="text-right">
                <div class="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Dipanggil</div>
                <div class="text-lg font-black text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">${currentNumber}</div>
            </div>
        `;
        
        overviewList.appendChild(card);
    });
}

window.ambilTiket = function(serviceId) {
    if (confirm('Ambil nomor antrean untuk layanan ini?')) {
        const newTicket = engine.ambilNomor(serviceId);
        if (newTicket) {
            myCurrentTicketId = newTicket.id;
            sessionStorage.setItem('qsmart_my_ticket_id', myCurrentTicketId);
            renderApp();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

window.batalTiket = function() {
    if (confirm('Apakah Anda yakin ingin membatalkan tiket antrean ini?')) {
        if (myCurrentTicketId) {
            const tickets = engine.getTickets();
            const idx = tickets.findIndex(t => t.id === myCurrentTicketId);
            if (idx !== -1) {
                tickets[idx].status = 'cancelled';
                engine.saveTickets(tickets);
            }
            myCurrentTicketId = null;
            sessionStorage.removeItem('qsmart_my_ticket_id');
            renderApp();
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
