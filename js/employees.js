// Employee management
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('Connecting to Supabase for employee management...');
    // Elements
    const employeeSearch = document.getElementById('employee-search');
    const departmentFilter = document.getElementById('department-filter');
    const employeeTableBody = document.getElementById('employee-table-body');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const employeeModal = document.getElementById('employee-modal');
    const employeeForm = document.getElementById('employee-form');
    const employeeModalTitle = document.getElementById('employee-modal-title');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Employee detail elements
    const employeeDetail = document.getElementById('employee-detail');
    const backToListBtn = document.getElementById('back-to-list');
    const detailEmployeeName = document.getElementById('detail-employee-name');
    const detailTabs = document.querySelectorAll('.detail-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const prevWeekDetailBtn = document.getElementById('prev-week-detail');
    const nextWeekDetailBtn = document.getElementById('next-week-detail');
    const currentWeekDetail = document.getElementById('current-week-detail');
    const employeeShifts = document.querySelector('.employee-shifts');
    const absencesTableBody = document.getElementById('absences-table-body');
    const requestAbsenceBtn = document.getElementById('request-absence-btn');
    const absenceModal = document.getElementById('absence-modal');
    const absenceForm = document.getElementById('absence-form');
    
    // State
    let employees = [];
    let currentEmployee = null;
    let currentDetailDate = new Date();
    let employeeShiftData = [];
    let employeeAbsenceData = [];
    
    // Initialize
    init();
    
    // Event listeners
    employeeSearch.addEventListener('input', filterEmployees);
    departmentFilter.addEventListener('change', filterEmployees);
    
    // Employee add/edit functionality removed - employees are synced from Supabase
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            employeeModal.classList.remove('active');
            absenceModal.classList.remove('active');
        });
    });
    
    backToListBtn.addEventListener('click', () => {
        employeeDetail.classList.add('hidden');
    });
    
    detailTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            detailTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabId = tab.dataset.tab;
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    prevWeekDetailBtn.addEventListener('click', () => {
        navigateDetailWeek(-1);
    });
    
    nextWeekDetailBtn.addEventListener('click', () => {
        navigateDetailWeek(1);
    });
    
    requestAbsenceBtn.addEventListener('click', () => {
        openAbsenceModal();
    });
    
    absenceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAbsence();
    });
    
    // Functions
    async function init() {
        await loadEmployees();
    }
    
    async function loadEmployees() {
        try {
            console.log('Fetching employees from Supabase...');
            
            // Check for cached employees data first
            const cachedEmployees = localStorage.getItem('cached_employees');
            let useCachedData = false;
            
            if (!navigator.onLine) {
                console.warn('Browser is offline, using cached data if available');
                useCachedData = true;
                
                if (cachedEmployees) {
                    employees = JSON.parse(cachedEmployees);
                    renderEmployeeTable();
                    showOfflineDataNotification();
                    return;
                }
            }
            
            // Directly query the employees table from Supabase
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('last_name', { ascending: true });
            
            if (error) {
                console.error('Error loading employees:', error);
                
                // If we have cached data, use it as fallback
                if (cachedEmployees) {
                    employees = JSON.parse(cachedEmployees);
                    renderEmployeeTable();
                    showErrorWithFallbackNotification('Fehler beim Laden der Mitarbeiterdaten. Zeige zwischengespeicherte Daten an.');
                } else {
                    showErrorNotification('Fehler beim Laden der Mitarbeiterdaten: ' + error.message);
                }
                return;
            }
            
            console.log('Employees loaded:', data);
            employees = data || [];
            
            // Cache the data for offline use
            localStorage.setItem('cached_employees', JSON.stringify(employees));
            
            renderEmployeeTable();
        } catch (error) {
            console.error('Error loading employees:', error);
            
            // Try to use cached data as fallback
            const cachedEmployees = localStorage.getItem('cached_employees');
            if (cachedEmployees) {
                employees = JSON.parse(cachedEmployees);
                renderEmployeeTable();
                showErrorWithFallbackNotification('Fehler beim Laden der Mitarbeiterdaten. Zeige zwischengespeicherte Daten an.');
            } else {
                showErrorNotification('Fehler beim Laden der Mitarbeiterdaten: ' + error.message);
            }
        }
    }
    
    function renderEmployeeTable() {
        employeeTableBody.innerHTML = '';
        
        const filteredEmployees = filterEmployeesList();
        
        filteredEmployees.forEach(employee => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = `${employee.first_name} ${employee.last_name}`;
            nameCell.style.cursor = 'pointer';
            nameCell.addEventListener('click', () => {
                viewEmployeeDetail(employee);
            });
            
            const positionCell = document.createElement('td');
            positionCell.textContent = employee.position;
            
            const departmentCell = document.createElement('td');
            departmentCell.textContent = employee.department;
            
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge status-${employee.status}`;
            statusBadge.textContent = employee.status === 'active' ? 'Aktiv' : 'Inaktiv';
            statusCell.appendChild(statusBadge);
            
            row.appendChild(nameCell);
            row.appendChild(positionCell);
            row.appendChild(departmentCell);
            row.appendChild(statusCell);
            
            employeeTableBody.appendChild(row);
        });
    }
    
    function filterEmployeesList() {
        const searchTerm = employeeSearch.value.toLowerCase();
        const departmentValue = departmentFilter.value;
        
        return employees.filter(employee => {
            const nameMatch = `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm);
            const departmentMatch = departmentValue === 'all' || employee.department === departmentValue;
            
            return nameMatch && departmentMatch;
        });
    }
    
    function filterEmployees() {
        renderEmployeeTable();
    }
    
    // Functions for adding, editing, and deleting employees have been removed
    // since employees are synced from Supabase
    
    async function viewEmployeeDetail(employee) {
        currentEmployee = employee;
        
        // Set employee name in detail view
        detailEmployeeName.textContent = `${employee.first_name} ${employee.last_name}`;
        
        // Fill info tab
        document.getElementById('info-first-name').value = employee.first_name;
        document.getElementById('info-last-name').value = employee.last_name;
        document.getElementById('info-email').value = employee.email;
        document.getElementById('info-position').value = employee.position;
        document.getElementById('info-department').value = employee.department;
        document.getElementById('info-status').value = employee.status === 'active' ? 'Aktiv' : 'Inaktiv';
        
        // Load shifts and absences
        await loadEmployeeShifts();
        await loadEmployeeAbsences();
        
        // Show detail view
        employeeDetail.classList.remove('hidden');
    }
    
    async function loadEmployeeShifts() {
        try {
            const startDate = getWeekStartDate(currentDetailDate);
            const endDate = getWeekEndDate(currentDetailDate);
            
            updateDetailWeekDisplay();
            
            console.log('Loading shifts for employee ID:', currentEmployee.id, 'from', formatDate(startDate), 'to', formatDate(endDate));
            
            const { data, error } = await supabase
                .from('attendances')
                .select('*, employees(*)')
                .eq('employee_id', currentEmployee.id)
                .gte('date', formatDate(startDate))
                .lte('date', formatDate(endDate));
            
            if (error) {
                console.error('Error loading employee shifts:', error);
                return;
            }
            
            console.log('Employee shifts loaded:', data);
            employeeShiftData = data || [];
            
            renderEmployeeShifts();
        } catch (error) {
            console.error('Error loading employee shifts:', error);
        }
    }
    
    function renderEmployeeShifts() {
        employeeShifts.innerHTML = '';
        
        const startDate = getWeekStartDate(currentDetailDate);
        const daysOfWeek = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const formattedDate = formatDate(date);
            
            const dayShifts = document.createElement('div');
            dayShifts.className = 'day-shifts';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-shifts-header';
            dayHeader.textContent = `${daysOfWeek[i]} ${formatDateDisplay(date)}`;
            
            dayShifts.appendChild(dayHeader);
            
            // Filter shifts for this day
            const shiftsForDay = employeeShiftData.filter(shift => 
                shift.date === formattedDate
            );
            
            if (shiftsForDay.length > 0) {
                shiftsForDay.forEach(shift => {
                    const shiftDiv = document.createElement('div');
                    
                    // Determine shift type based on start time
                    const startHour = parseInt(shift.start_time.split(':')[0]);
                    let shiftType = '';
                    
                    if (startHour >= 5 && startHour < 12) {
                        shiftType = 'early';
                    } else if (startHour >= 12 && startHour < 20) {
                        shiftType = 'late';
                    } else {
                        shiftType = 'night';
                    }
                    
                    shiftDiv.className = `shift shift-${shiftType}`;
                    shiftDiv.innerHTML = `
                        <span>${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}</span>
                    `;
                    
                    dayShifts.appendChild(shiftDiv);
                });
            } else {
                const noShiftDiv = document.createElement('div');
                noShiftDiv.className = 'no-shift';
                noShiftDiv.textContent = 'Keine Schicht';
                dayShifts.appendChild(noShiftDiv);
            }
            
            employeeShifts.appendChild(dayShifts);
        }
    }
    
    async function loadEmployeeAbsences() {
        try {
            console.log('Loading absences for employee ID:', currentEmployee.id);
            
            const { data, error } = await supabase
                .from('absences')
                .select('*, absence_types(*)')
                .eq('employee_id', currentEmployee.id);
            
            if (error) {
                console.error('Error loading employee absences:', error);
                return;
            }
            
            console.log('Employee absences loaded:', data);
            employeeAbsenceData = data || [];
            renderEmployeeAbsences();
        } catch (error) {
            console.error('Error loading employee absences:', error);
        }
    }
    
    function renderEmployeeAbsences() {
        absencesTableBody.innerHTML = '';
        
        employeeAbsenceData.forEach(absence => {
            const row = document.createElement('tr');
            
            const typeCell = document.createElement('td');
            typeCell.textContent = absence.absence_types.name;
            
            const startCell = document.createElement('td');
            startCell.textContent = formatDateDisplay(new Date(absence.start_date));
            
            const endCell = document.createElement('td');
            endCell.textContent = formatDateDisplay(new Date(absence.end_date));
            
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge status-${absence.status}`;
            statusBadge.textContent = getAbsenceStatusText(absence.status);
            statusCell.appendChild(statusBadge);
            
            const actionsCell = document.createElement('td');
            
            if (absence.status === 'pending') {
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn btn-icon btn-danger';
                cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
                cancelBtn.addEventListener('click', () => {
                    cancelAbsence(absence.id);
                });
                
                actionsCell.appendChild(cancelBtn);
            }
            
            row.appendChild(typeCell);
            row.appendChild(startCell);
            row.appendChild(endCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);
            
            absencesTableBody.appendChild(row);
        });
    }
    
    function navigateDetailWeek(direction) {
        currentDetailDate.setDate(currentDetailDate.getDate() + (direction * 7));
        loadEmployeeShifts();
    }
    
    function updateDetailWeekDisplay() {
        const startDate = getWeekStartDate(currentDetailDate);
        const endDate = getWeekEndDate(currentDetailDate);
        
        currentWeekDetail.textContent = `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
    }
    
    function openAbsenceModal() {
        // Reset form
        absenceForm.reset();
        
        // Set employee ID
        document.getElementById('absence-employee-id').value = currentEmployee.id;
        
        // Set default dates
        const today = new Date();
        document.getElementById('absence-start').value = formatDate(today);
        document.getElementById('absence-end').value = formatDate(today);
        
        // Show modal
        absenceModal.classList.add('active');
    }
    
    async function saveAbsence() {
        const absenceData = {
            employee_id: parseInt(document.getElementById('absence-employee-id').value),
            absence_type_id: parseInt(document.getElementById('absence-type').value),
            start_date: document.getElementById('absence-start').value,
            end_date: document.getElementById('absence-end').value,
            notes: document.getElementById('absence-notes').value,
            status: 'pending'
        };
        
        try {
            console.log('Creating new absence:', absenceData);
            
            const { data, error } = await supabase
                .from('absences')
                .insert([absenceData]);
            
            if (error) {
                console.error('Error saving absence:', error);
                return;
            }
            
            console.log('Absence created successfully:', data);
            
            // Close modal and reload absences
            absenceModal.classList.remove('active');
            await loadEmployeeAbsences();
        } catch (error) {
            console.error('Error saving absence:', error);
        }
    }
    
    async function cancelAbsence(absenceId) {
        if (confirm('Sind Sie sicher, dass Sie diesen Antrag stornieren möchten?')) {
            try {
                console.log('Canceling absence with ID:', absenceId);
                
                const { error } = await supabase
                    .from('absences')
                    .delete()
                    .eq('id', absenceId);
                
                if (error) {
                    console.error('Error canceling absence:', error);
                    return;
                }
                
                console.log('Absence canceled successfully');
                
                // Reload absences and re-render
                await loadEmployeeAbsences();
            } catch (error) {
                console.error('Error canceling absence:', error);
            }
        }
    }
    
    // Helper functions
    function getAbsenceStatusText(status) {
        switch (status) {
            case 'pending':
                return 'Ausstehend';
            case 'approved':
                return 'Genehmigt';
            case 'rejected':
                return 'Abgelehnt';
            default:
                return status;
        }
    }
    
    function getWeekStartDate(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        result.setDate(diff);
        return result;
    }
    
    function getWeekEndDate(date) {
        const result = new Date(getWeekStartDate(date));
        result.setDate(result.getDate() + 6);
        return result;
    }
    
    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function formatDateDisplay(date) {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        return `${day}.${month}.`;
    }
    
    function formatTime(timeString) {
        return timeString.substring(0, 5);
    }
    
    // Notification helper functions for connectivity issues
    function showOfflineDataNotification() {
        showNotification('warning', 'Sie sind offline. Zeige zwischengespeicherte Daten an.');
    }
    
    function showErrorWithFallbackNotification(message) {
        showNotification('warning', message);
    }
    
    function showErrorNotification(message) {
        showNotification('error', message);
    }
    
    function showNotification(type, message) {
        // Remove any existing notifications
        const existingNotification = document.getElementById('data-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'data-notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        notification.style.maxWidth = '300px';
        
        // Set color based on type
        if (type === 'error') {
            notification.style.backgroundColor = '#f44336';
        } else if (type === 'warning') {
            notification.style.backgroundColor = '#ff9800';
        } else if (type === 'success') {
            notification.style.backgroundColor = '#4CAF50';
        } else {
            notification.style.backgroundColor = '#2196F3';
        }
        
        notification.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '10px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        closeBtn.addEventListener('click', () => notification.remove());
        
        notification.appendChild(closeBtn);
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
});
