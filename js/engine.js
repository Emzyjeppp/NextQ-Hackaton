// QSmartEngine Class
class QSmartEngine {
    constructor() {
        this.STORAGE_KEYS = {
            TICKETS: 'qsmart_tickets_v1',
            SERVICES: 'qsmart_services_v1',
            COUNTERS: 'qsmart_counters_v1'
        };
        this.CHANNEL_NAME = 'qsmart_realtime_channel';
        
        this.defaultServices = [
            { id: 'srv_1', name: 'Poli Umum', prefix: 'A', defaultDuration: 300, icon: 'stethoscope', color: 'blue' },
            { id: 'srv_2', name: 'Poli Gigi', prefix: 'B', defaultDuration: 600, icon: 'tooth', color: 'teal' },
            { id: 'srv_3', name: 'Apotek', prefix: 'C', defaultDuration: 120, icon: 'pills', color: 'green' }
        ];

        this.defaultCounters = [
            { id: 'ctr_1', name: 'Loket 1', serviceId: 'srv_1' },
            { id: 'ctr_2', name: 'Loket 2', serviceId: 'srv_2' },
            { id: 'ctr_3', name: 'Loket 3', serviceId: 'srv_3' }
        ];

        this.listeners = [];
        this.initData();
        this.initChannel();

        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEYS.TICKETS) {
                this.notifyListeners({ type: 'TICKETS_UPDATED', data: this.getTickets() });
            }
        });

        if (this.getTickets().length === 0) {
            this.resetDemoData();
        }
    }

    initData() {
        if (!localStorage.getItem(this.STORAGE_KEYS.SERVICES)) {
            localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(this.defaultServices));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.COUNTERS)) {
            localStorage.setItem(this.STORAGE_KEYS.COUNTERS, JSON.stringify(this.defaultCounters));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.TICKETS)) {
            localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify([]));
        }
    }

    initChannel() {
        this.supabaseUrl = 'https://vaxlezodrnyzljcmqrmt.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheGxlem9kcm55emxqY21xcm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNTk0MjksImV4cCI6MjEwMTczNTQyOX0.JrWW_hr5dxkXwtbJ_tfwWs3Hze5OE5kZCxVvz7OKEfU';
        
        try {
            if (typeof supabase !== 'undefined') {
                this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                
                // Ambil state awal dari Supabase
                this.supabase.from('qsmart_state').select('tickets').eq('id', 1).single()
                    .then(({ data, error }) => {
                        if (data && data.tickets) {
                            localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
                            this.notifyListeners({ type: 'TICKETS_UPDATED', data: data.tickets });
                        }
                    });

                // Dengarkan perubahan pada tabel
                this.supabase
                    .channel('public:qsmart_state')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'qsmart_state' }, payload => {
                        if (payload.new && payload.new.tickets) {
                            localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify(payload.new.tickets));
                            this.notifyListeners({ type: 'TICKETS_UPDATED', data: payload.new.tickets });
                        }
                    })
                    .subscribe();

                // Broadcast channel khusus event UI (bunyi bel)
                this.broadcastChannel = this.supabase.channel('qsmart_events');
                this.broadcastChannel
                    .on('broadcast', { event: 'last_event' }, payload => {
                        this.notifyListeners(payload.payload);
                    })
                    .subscribe();
            }
        } catch (e) {
            console.warn('Supabase init failed, using local mode fallback.');
        }

        // Fallback untuk local storage events
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEYS.TICKETS) {
                this.notifyListeners({ type: 'TICKETS_UPDATED', data: this.getTickets() });
            }
        });
    }

    getServices() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SERVICES)) || this.defaultServices;
    }

    getCounters() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.COUNTERS)) || this.defaultCounters;
    }

    getTickets() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TICKETS)) || [];
    }

    async saveTickets(tickets) {
        localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
        this.notifyListeners({ type: 'TICKETS_UPDATED', data: tickets });
        
        if (this.supabase) {
            await this.supabase.from('qsmart_state').upsert({ id: 1, tickets: tickets });
        }
    }

    broadcast(data) {
        if (this.broadcastChannel) {
            this.broadcastChannel.send({
                type: 'broadcast',
                event: 'last_event',
                payload: data
            });
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(cb => cb(data));
    }

    getSessionId() {
        let sid = sessionStorage.getItem('qsmart_session_id');
        if (!sid) {
            sid = 'sess_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('qsmart_session_id', sid);
        }
        return sid;
    }

    ambilNomor(serviceId) {
        const services = this.getServices();
        const service = services.find(s => s.id === serviceId);
        if (!service) return null;

        const tickets = this.getTickets();
        const serviceTickets = tickets.filter(t => t.service_id === serviceId);
        
        let maxNumber = 0;
        serviceTickets.forEach(t => {
            if (t.number > maxNumber) maxNumber = t.number;
        });
        const newNumber = maxNumber + 1;
        
        const code = `${service.prefix}-${String(newNumber).padStart(3, '0')}`;
        
        let maxPos = 0;
        tickets.forEach(t => {
            if (t.queue_position > maxPos) maxPos = t.queue_position;
        });

        const newTicket = {
            id: 'tkt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            service_id: service.id,
            service_name: service.name,
            prefix: service.prefix,
            number: newNumber,
            code: code,
            queue_position: maxPos + 1,
            session_id: this.getSessionId(),
            status: 'waiting',
            skip_count: 0,
            counter_id: null,
            counter_name: null,
            created_at: new Date().toISOString(),
            called_at: null,
            served_at: null,
            grace_expires_at: null,
            done_at: null
        };

        tickets.push(newTicket);
        this.saveTickets(tickets);
        sessionStorage.setItem('qsmart_my_ticket_id', newTicket.id);
        
        return newTicket;
    }

    panggilBerikutnya(counterId, serviceId = null, graceSeconds = 180) {
        const counters = this.getCounters();
        const counter = counters.find(c => c.id === counterId);
        if (!counter) return null;

        const sId = serviceId || counter.serviceId;
        const tickets = this.getTickets();
        
        const waitingTickets = tickets.filter(t => t.status === 'waiting' && t.service_id === sId);
        if (waitingTickets.length === 0) return null;

        waitingTickets.sort((a, b) => a.queue_position - b.queue_position);
        const ticketToCall = waitingTickets[0];

        const ticketIndex = tickets.findIndex(t => t.id === ticketToCall.id);
        if (ticketIndex !== -1) {
            const now = new Date();
            const graceExpires = new Date(now.getTime() + graceSeconds * 1000);
            
            tickets[ticketIndex] = {
                ...tickets[ticketIndex],
                status: 'called',
                counter_id: counter.id,
                counter_name: counter.name,
                called_at: now.toISOString(),
                grace_expires_at: graceExpires.toISOString()
            };
            this.saveTickets(tickets);
            
            this.broadcast({ type: 'TICKET_CALLED', data: { ticket: tickets[ticketIndex], counter: counter } });
            return tickets[ticketIndex];
        }
        return null;
    }

    tandaiHadir(ticketId) {
        const tickets = this.getTickets();
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1 && tickets[ticketIndex].status === 'called') {
            tickets[ticketIndex].status = 'serving';
            tickets[ticketIndex].served_at = new Date().toISOString();
            this.saveTickets(tickets);
            return tickets[ticketIndex];
        }
        return null;
    }

    selesaikanTiket(ticketId) {
        const tickets = this.getTickets();
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1 && tickets[ticketIndex].status === 'serving') {
            tickets[ticketIndex].status = 'done';
            tickets[ticketIndex].done_at = new Date().toISOString();
            this.saveTickets(tickets);
            return tickets[ticketIndex];
        }
        return null;
    }

    lewatiTiket(ticketId) {
        const tickets = this.getTickets();
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            let tkt = tickets[ticketIndex];
            tkt.skip_count += 1;
            
            if (tkt.skip_count >= 2) {
                tkt.status = 'expired';
            } else {
                tkt.status = 'waiting';
                
                const serviceWaiting = tickets.filter(t => t.status === 'waiting' && t.service_id === tkt.service_id && t.id !== ticketId);
                serviceWaiting.sort((a, b) => a.queue_position - b.queue_position);
                
                if (serviceWaiting.length >= 3) {
                    tkt.queue_position = serviceWaiting[2].queue_position + 0.5;
                } else if (serviceWaiting.length > 0) {
                    tkt.queue_position = serviceWaiting[serviceWaiting.length - 1].queue_position + 0.5;
                } else {
                    tkt.queue_position += 3.5;
                }
                
                tkt.counter_id = null;
                tkt.counter_name = null;
                tkt.called_at = null;
                tkt.grace_expires_at = null;
            }
            
            tickets.sort((a, b) => a.queue_position - b.queue_position);
            
            this.saveTickets(tickets);
            this.broadcast({ type: 'TICKET_SKIPPED', data: tkt });
            return tkt;
        }
        return null;
    }

    hitungEstimasiWaktu(ticketId) {
        const tickets = this.getTickets();
        const target = tickets.find(t => t.id === ticketId);
        if (!target) return null;

        if (['done', 'expired'].includes(target.status)) {
            return { totalMinutes: 0, estimatedTimeStr: 'Selesai', peopleAhead: 0 };
        }

        const services = this.getServices();
        const service = services.find(s => s.id === target.service_id);
        const defaultDuration = service ? service.defaultDuration : 300;

        const doneTickets = tickets.filter(t => t.service_id === target.service_id && t.status === 'done' && t.served_at && t.done_at);
        let totalDuration = 0;
        let validDoneCount = 0;
        
        doneTickets.forEach(t => {
            const duration = (new Date(t.done_at).getTime() - new Date(t.served_at).getTime()) / 1000;
            if (duration >= 10) {
                totalDuration += duration;
                validDoneCount++;
            }
        });

        const avgDuration = validDoneCount > 0 ? (totalDuration / validDoneCount) : defaultDuration;

        const peopleAheadList = tickets.filter(t => 
            t.service_id === target.service_id && 
            ['waiting', 'called', 'serving'].includes(t.status) &&
            t.queue_position < target.queue_position &&
            t.id !== target.id
        );
        const peopleAhead = peopleAheadList.length;

        let totalSeconds = peopleAhead * avgDuration;
        if (target.status === 'serving') totalSeconds = 0;
        
        let totalMinutes = Math.floor(totalSeconds / 60);
        if (totalMinutes < 1 && target.status !== 'serving') totalMinutes = 1;

        const now = new Date();
        const estDate = new Date(now.getTime() + totalMinutes * 60000);
        const h = String(estDate.getHours()).padStart(2, '0');
        const m = String(estDate.getMinutes()).padStart(2, '0');
        const estimatedTimeStr = `${h}:${m} WIB`;

        return { totalMinutes, estimatedTimeStr, peopleAhead };
    }

    resetDemoData() {
        this.saveTickets([]);
        this.broadcast({ type: 'DEMO_RESET' });
        console.log('Data reset: 0 tickets.');
    }
}

window.qsmartEngine = new QSmartEngine();
