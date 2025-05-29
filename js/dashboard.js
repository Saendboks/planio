// Dashboard functionality for Planio
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Elements
    const currentDateEl = document.getElementById('current-date');
    const currentTimeEl = document.getElementById('current-time');
    const employeeCountEl = document.getElementById('employee-count');
    const activeEmployeesEl = document.getElementById('active-employees');
    const absenceCountEl = document.getElementById('absence-count');
    const absenceDetailEl = document.getElementById('absence-detail');
    const shiftCountEl = document.getElementById('shift-count');
    const shiftDetailEl = document.getElementById('shift-detail');
    const pendingCountEl = document.getElementById('pending-count');
    const pendingDetailEl = document.getElementById('pending-detail');
    const todayScheduleEl = document.getElementById('today-schedule');
    const recentAbsencesEl = document.getElementById('recent-absences');
    const pendingApprovalsEl = document.getElementById('pending-approvals');
    
    // Initialize
    init();
    
    // Functions
    async function init() {
        updateDateTime();
        setInterval(updateDateTime, 60000); // Update every minute
        
        await loadDashboardData();
    }
    
    function updateDateTime() {
        const now = new Date();
        
        // Format date: 16. Mai 2025
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('de-DE', options);
        
        // Format time: 17:32
        currentTimeEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    
    async function loadDashboardData() {
        try {
            // Get today's date in ISO format (YYYY-MM-DD)
            const today = new Date().toISOString().split('T')[0];
            
            // Load employees data
            const { data: employees, error: employeesError } = await supabase
                .from('employees')
                .select('*');
                
            if (employeesError) throw employeesError;
            
            // Update employee stats
            const activeEmployees = employees.filter(emp => emp.status === 'active');
            employeeCountEl.textContent = employees.length;
            activeEmployeesEl.textContent = `${activeEmployees.length} aktiv`;
            
            // Load absences for today
            const { data: absences, error: absencesError } = await supabase
                .from('absences')
                .select('*, employees(*), absence_types(*)')
                .lte('start_date', today)
                .gte('end_date', today);
                
            if (absencesError) throw absencesError;
            
            // Update absence stats
            absenceCountEl.textContent = absences.length;
            const absencePercentage = employees.length > 0 
                ? Math.round((absences.length / employees.length) * 100) 
                : 0;
            absenceDetailEl.textContent = `${absencePercentage}% der Belegschaft`;
            
            // Load shifts for today
            const { data: shifts, error: shiftsError } = await supabase
                .from('attendances')
                .select('*, employees(*)')
                .eq('date', today);
                
            if (shiftsError) throw shiftsError;
            
            // Update shift stats
            shiftCountEl.textContent = shifts.length;
            
            // Count early and late shifts
            const earlyShifts = shifts.filter(shift => {
                const startHour = parseInt(shift.start_time.split(':')[0]);
                return startHour >= 5 && startHour < 12;
            });
            
            const lateShifts = shifts.filter(shift => {
                const startHour = parseInt(shift.start_time.split(':')[0]);
                return startHour >= 12 && startHour < 20;
            });
            
            shiftDetailEl.textContent = `${earlyShifts.length} früh, ${lateShifts.length} spät`;
            
            // Load pending absences
            const { data: pendingAbsences, error: pendingError } = await supabase
                .from('absences')
                .select('*')
                .eq('status', 'pending');
                
            if (pendingError) throw pendingError;
            
            // Update pending stats
            pendingCountEl.textContent = pendingAbsences.length;
            pendingDetailEl.textContent = `${pendingAbsences.length} Genehmigungen`;
            
            // Render today's schedule
            renderTodaySchedule(shifts);
            
            // Render recent absences
            renderRecentAbsences(absences);
            
            // Render pending approvals
            await renderPendingApprovals(pendingAbsences);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    function renderTodaySchedule(shifts) {
        if (!todayScheduleEl) return;
        
        if (shifts.length === 0) {
            todayScheduleEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <p>Keine Schichten für heute geplant</p>
                </div>
            `;
            return;
        }
        
        // Group shifts by time
        const groupedShifts = {};
        
        shifts.forEach(shift => {
            const key = `${shift.start_time}-${shift.end_time}`;
            if (!groupedShifts[key]) {
                groupedShifts[key] = {
                    startTime: shift.start_time,
                    endTime: shift.end_time,
                    employees: []
                };
            }
            
            groupedShifts[key].employees.push(shift.employees);
        });
        
        // Sort by start time
        const sortedShifts = Object.values(groupedShifts).sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        // Render shifts
        todayScheduleEl.innerHTML = '';
        
        sortedShifts.forEach(shift => {
            const startHour = parseInt(shift.startTime.split(':')[0]);
            let shiftType = '';
            let badgeClass = '';
            
            if (startHour >= 5 && startHour < 12) {
                shiftType = 'Frühdienst';
                badgeClass = 'badge-early';
            } else if (startHour >= 12 && startHour < 20) {
                shiftType = 'Spätdienst';
                badgeClass = 'badge-late';
            } else {
                shiftType = 'Nachtdienst';
                badgeClass = 'badge-night';
            }
            
            const employeeNames = shift.employees
                .map(emp => `${emp.first_name} ${emp.last_name}`)
                .join(', ');
            
            const shiftItem = document.createElement('div');
            shiftItem.className = 'schedule-item';
            shiftItem.innerHTML = `
                <div class="schedule-time">
                    ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}
                </div>
                <div class="schedule-info">
                    <div class="schedule-title">
                        <span class="schedule-badge ${badgeClass}">${shiftType}</span>
                    </div>
                    <div class="schedule-employees">
                        ${employeeNames}
                    </div>
                </div>
            `;
            
            todayScheduleEl.appendChild(shiftItem);
        });
    }
    
    function renderRecentAbsences(absences) {
        if (!recentAbsencesEl) return;
        
        if (absences.length === 0) {
            recentAbsencesEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-clock"></i>
                    <p>Keine aktuellen Abwesenheiten</p>
                </div>
            `;
            return;
        }
        
        // Sort by start date (most recent first)
        const sortedAbsences = [...absences].sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });
        
        // Limit to 5 absences
        const recentAbsences = sortedAbsences.slice(0, 5);
        
        // Render absences
        recentAbsencesEl.innerHTML = '';
        
        recentAbsences.forEach(absence => {
            const employee = absence.employees;
            const absenceType = absence.absence_types;
            
            let typeClass = '';
            switch (absenceType.category) {
                case 'vacation':
                    typeClass = 'type-vacation';
                    break;
                case 'sick':
                    typeClass = 'type-sick';
                    break;
                case 'training':
                    typeClass = 'type-training';
                    break;
                default:
                    typeClass = '';
            }
            
            const absenceItem = document.createElement('div');
            absenceItem.className = 'absence-item';
            absenceItem.innerHTML = `
                <img class="absence-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(employee.first_name + ' ' + employee.last_name)}&background=6c5ce7&color=fff" alt="${employee.first_name} ${employee.last_name}">
                <div class="absence-info">
                    <div class="absence-name">${employee.first_name} ${employee.last_name}</div>
                    <div class="absence-dates">${formatDateRange(absence.start_date, absence.end_date)}</div>
                    <span class="absence-type ${typeClass}">${absenceType.name}</span>
                </div>
            `;
            
            recentAbsencesEl.appendChild(absenceItem);
        });
    }
    
    async function renderPendingApprovals(pendingAbsences) {
        if (!pendingApprovalsEl) return;
        
        if (pendingAbsences.length === 0) {
            pendingApprovalsEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check"></i>
                    <p>Keine ausstehenden Genehmigungen</p>
                </div>
            `;
            return;
        }
        
        // Get employee and absence type details
        const absenceDetails = [];
        
        for (const absence of pendingAbsences) {
            // Get employee details
            const { data: employee, error: employeeError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', absence.employee_id)
                .single();
                
            if (employeeError) {
                console.error('Error fetching employee:', employeeError);
                continue;
            }
            
            // Get absence type details
            const { data: absenceType, error: typeError } = await supabase
                .from('absence_types')
                .select('*')
                .eq('id', absence.absence_type_id)
                .single();
                
            if (typeError) {
                console.error('Error fetching absence type:', typeError);
                continue;
            }
            
            absenceDetails.push({
                ...absence,
                employee,
                absenceType
            });
        }
        
        // Sort by request date (most recent first)
        const sortedApprovals = absenceDetails.sort((a, b) => {
            return new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date);
        });
        
        // Limit to 5 approvals
        const recentApprovals = sortedApprovals.slice(0, 5);
        
        // Render approvals
        pendingApprovalsEl.innerHTML = '';
        
        recentApprovals.forEach(approval => {
            const approvalItem = document.createElement('div');
            approvalItem.className = 'approval-item';
            approvalItem.innerHTML = `
                <div class="approval-info">
                    <div class="approval-title">${approval.employee.first_name} ${approval.employee.last_name} - ${approval.absenceType.name}</div>
                    <div class="approval-details">${formatDateRange(approval.start_date, approval.end_date)}</div>
                    <div class="approval-date">Beantragt am ${formatDate(approval.created_at || approval.start_date)}</div>
                </div>
                <div class="approval-actions">
                    <button class="btn btn-sm btn-success approve-btn" data-id="${approval.id}">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger reject-btn" data-id="${approval.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            pendingApprovalsEl.appendChild(approvalItem);
        });
        
        // Add event listeners for approve/reject buttons
        const approveButtons = pendingApprovalsEl.querySelectorAll('.approve-btn');
        const rejectButtons = pendingApprovalsEl.querySelectorAll('.reject-btn');
        
        approveButtons.forEach(btn => {
            btn.addEventListener('click', () => approveAbsence(btn.dataset.id));
        });
        
        rejectButtons.forEach(btn => {
            btn.addEventListener('click', () => rejectAbsence(btn.dataset.id));
        });
    }
    
    async function approveAbsence(absenceId) {
        try {
            const { error } = await supabase
                .from('absences')
                .update({ status: 'approved' })
                .eq('id', absenceId);
                
            if (error) throw error;
            
            // Reload dashboard data
            loadDashboardData();
        } catch (error) {
            console.error('Error approving absence:', error);
            alert(`Fehler beim Genehmigen der Abwesenheit: ${error.message}`);
        }
    }
    
    async function rejectAbsence(absenceId) {
        try {
            const { error } = await supabase
                .from('absences')
                .update({ status: 'rejected' })
                .eq('id', absenceId);
                
            if (error) throw error;
            
            // Reload dashboard data
            loadDashboardData();
        } catch (error) {
            console.error('Error rejecting absence:', error);
            alert(`Fehler beim Ablehnen der Abwesenheit: ${error.message}`);
        }
    }
    
    // Helper functions
    function formatTime(timeString) {
        return timeString.substring(0, 5);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    function formatDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const startFormatted = start.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
        const endFormatted = end.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
        
        if (startFormatted === endFormatted) {
            return `${startFormatted}`;
        }
        
        return `${startFormatted} - ${endFormatted}`;
    }
});
