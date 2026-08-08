// js/app.js
const engine = window.qsmartEngine;

const colorMap = {
    'srv_1': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: 'bg-indigo-100' }, // Poli Umum (indigo)
    'srv_2': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'bg-emerald-100' }, // Poli Gigi (emerald)
    'srv_3': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: 'bg-amber-100' } // Apotek (amber)
};

// State
let myCurrentTicketId = sessionStorage.getItem('qsmart_my_ticket_id');

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
}

function renderServices() {
    const services = engine.getServices();
    const tickets = engine.getTickets();
    
    servicesList.innerHTML = '';
    
    services.forEach(service => {
        // Find waiting tickets for this service
        const waiting = tickets.filter(t => t.service_id === service.id && ['waiting', 'called', 'serving'].includes(t.status)).length;
        
        // Use engine to calculate mock estimation if we just add a ticket at the end
        let estimatedMins = 0;
        if (waiting > 0) {
            estimatedMins = Math.ceil((waiting * service.defaultDuration) / 60);
        }

        const colors = colorMap[service.id] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', icon: 'bg-slate-100' };

        const card = document.createElement('div');
        card.className = `${colors.bg} ${colors.border} border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-transform transform hover:scale-[1.02] active:scale-95 shadow-sm mb-3`;
        card.onclick = () => ambilTiket(service.id);
        
        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full ${colors.icon} ${colors.text} flex items-center justify-center text-xl shrink-0">
                    <i class="fas fa-${service.icon}"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-800 text-lg">${service.name}</h3>
                    <div class="text-sm text-slate-500 flex gap-3 mt-1">
                        <span><i class="fas fa-users mr-1"></i> ${waiting} Antrean</span>
                        <span><i class="fas fa-clock mr-1"></i> ~${estimatedMins} mnt</span>
                    </div>
                </div>
            </div>
            <div class="text-slate-400">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        
        servicesList.appendChild(card);
    });
}

function renderMyTicket(ticket) {
    const est = engine.hitungEstimasiWaktu(ticket.id);
    
    ticketServiceName.textContent = ticket.service_name;
    ticketCode.textContent = ticket.code;
    
    peopleAheadText.textContent = est ? `${est.peopleAhead} Orang` : '-';
    estimatedTimeText.textContent = est ? est.estimatedTimeStr : '-';
    
    // Status Logic
    callingAlertBox.classList.add('hidden');
    ticketStatusBadge.className = 'inline-block px-4 py-1.5 rounded-full text-sm font-bold';
    
    if (ticket.status === 'waiting') {
        ticketStatusBadge.textContent = 'Menunggu';
        ticketStatusBadge.classList.add('bg-slate-100', 'text-slate-600');
    } else if (ticket.status === 'called') {
        ticketStatusBadge.textContent = \`Menuju \${ticket.counter_name || 'Loket'}\`;
        ticketStatusBadge.classList.add('bg-yellow-100', 'text-yellow-700');
        callingAlertBox.classList.remove('hidden');
        callingAlertBox.innerHTML = \`<i class="fas fa-bell mr-2"></i> Giliran Anda! Silakan menuju \${ticket.counter_name}.\`;
    } else if (ticket.status === 'serving') {
        ticketStatusBadge.textContent = 'Sedang Dilayani';
        ticketStatusBadge.classList.add('bg-emerald-100', 'text-emerald-700');
    }
}

function ambilTiket(serviceId) {
    if (confirm('Ambil nomor antrean untuk layanan ini?')) {
        const newTicket = engine.ambilNomor(serviceId);
        if (newTicket) {
            myCurrentTicketId = newTicket.id;
            sessionStorage.setItem('qsmart_my_ticket_id', myCurrentTicketId);
            renderApp();
        }
    }
}

window.batalTiket = function() {
    if (confirm('Apakah Anda yakin ingin membatalkan antrean ini?')) {
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
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
