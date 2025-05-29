// Schedule management
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentWeekDisplay = document.getElementById('current-week-display');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const todayBtn = document.getElementById('today-btn');
    const viewBtns = document.querySelectorAll('.btn-view');
    const addShiftBtn = document.getElementById('add-shift-btn');
    const deptTabs = document.querySelectorAll('.dept-tab');
    const scheduleDays = document.querySelector('.schedule-days');
    const timeLabels = document.querySelector('.time-labels');
    const shiftModal = document.getElementById('shift-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const shiftForm = document.getElementById('shift-form');
    const shiftEmployeeSelect = document.getElementById('shift-employee');

    // State
    let currentDate = new Date();
    let currentView = 'week';
    let currentDepartment = 'all';
    let employees = [];
    let absences = [];
    let attendances = [];
    let selectedShift = null;

    // Initialize the application
    init();

    // Event listeners
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => navigateWeek(1));
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    if (todayBtn) todayBtn.addEventListener('click', goToToday);
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderSchedule();
        });
    });

    deptTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            deptTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDepartment = tab.dataset.dept;
            loadEmployees();
        });
    });

    addShiftBtn.addEventListener('click', () => {
        openShiftModal();
    });

    // Removed save plan button functionality

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shiftModal.classList.remove('active');
        });
    });

    shiftForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveShift();
    });

    // Initialize the application
    async function init() {
        try {
            await loadEmployees();
            await loadAbsences();
            await loadAttendances();
            updateWeekDisplay();
            renderSchedule();
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    async function loadEmployees() {
        try {
            let response;
            if (currentDepartment === 'all') {
                response = await api.employees.getAll();
            } else {
                response = await api.employees.getByDepartment(currentDepartment);
            }

            if (response.error) {
                console.error('Error loading employees:', response.error);
                return;
            }

            employees = response.data || [];
            populateEmployeeSelect();
            renderSchedule();
        } catch (error) {
            console.error('Error loading employees:', error);
        }
    }

    async function loadAbsences() {
        try {
            const startDate = getWeekStartDate(currentDate);
            const endDate = getWeekEndDate(currentDate);
            
            const response = await api.absences.getByDateRange(
                formatDate(startDate),
                formatDate(endDate)
            );

            if (response.error) {
                console.error('Error loading absences:', response.error);
                return;
            }

            absences = response.data || [];
            renderSchedule();
        } catch (error) {
            console.error('Error loading absences:', error);
        }
    }

    async function loadAttendances() {
        try {
            const startDate = getWeekStartDate(currentDate);
            const endDate = getWeekEndDate(currentDate);
            
            const response = await api.attendances.getByDateRange(
                formatDate(startDate),
                formatDate(endDate)
            );

            if (response.error) {
                console.error('Error loading attendances:', response.error);
                return;
            }

            attendances = response.data || [];
            renderSchedule();
        } catch (error) {
            console.error('Error loading attendances:', error);
        }
    }

    function navigateWeek(direction) {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (7 * direction));
        currentDate = newDate;
        updateWeekDisplay();
        loadAbsences();
        loadAttendances();
        renderSchedule();
    }

    function goToToday() {
        currentDate = new Date();
        updateWeekDisplay();
        loadAbsences();
        loadAttendances();
    }

    function updateWeekDisplay() {
        const startDate = getWeekStartDate(currentDate);
        const endDate = getWeekEndDate(currentDate);
        
        currentWeekDisplay.textContent = `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
        updateMonthDisplay();
    }
    
    function updateMonthDisplay() {
        const options = { month: 'long', year: 'numeric' };
        currentMonthDisplay.textContent = currentDate.toLocaleDateString('de-DE', options);
    }
    
    function navigateMonth(months) {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + months);
        currentDate = newDate;
        updateWeekDisplay();
        loadAbsences();
        loadAttendances();
        renderSchedule();
    }

    function renderSchedule() {
        renderTimeLabels();
        renderDays();
        setupDragAndDrop();
    }

    function renderTimeLabels() {
        // Clear existing employee rows except the first two (header and required shifts)
        const existingRows = timeLabels.querySelectorAll('.employee-row');
        for (let i = 2; i < existingRows.length; i++) {
            existingRows[i].remove();
        }

        // Add employee rows
        employees.forEach(employee => {
            const employeeRow = document.createElement('div');
            employeeRow.className = 'employee-row';
            employeeRow.dataset.employeeId = employee.id;
            employeeRow.textContent = `${employee.first_name} ${employee.last_name}`;
            timeLabels.appendChild(employeeRow);
        });
    }

    function renderDays() {
        scheduleDays.innerHTML = '';
        
        const startDate = getWeekStartDate(currentDate);
        const daysOfWeek = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.date = formatDate(date);
            
            // Day header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            
            const dayName = document.createElement('div');
            dayName.className = 'day-name';
            dayName.textContent = daysOfWeek[i];
            
            const dayDate = document.createElement('div');
            dayDate.className = 'day-date';
            dayDate.textContent = formatDateDisplay(date);
            
            dayHeader.appendChild(dayName);
            dayHeader.appendChild(dayDate);
            dayColumn.appendChild(dayHeader);
            
            // Required shifts cell
            const requiredCell = document.createElement('div');
            requiredCell.className = 'day-cell required-shifts';
            
            // Early shift
            const earlyShift = document.createElement('div');
            earlyShift.className = 'shift shift-early';
            earlyShift.innerHTML = `
                <span>Frühdienst</span>
                <span>07:00-15:00</span>
            `;
            requiredCell.appendChild(earlyShift);
            
            // Late shift
            const lateShift = document.createElement('div');
            lateShift.className = 'shift shift-late';
            lateShift.innerHTML = `
                <span>Spätdienst</span>
                <span>15:00-23:00</span>
            `;
            requiredCell.appendChild(lateShift);
            
            dayColumn.appendChild(requiredCell);
            
            // Open shifts cell
            const openCell = document.createElement('div');
            openCell.className = 'day-cell open-shifts';
            dayColumn.appendChild(openCell);
            
            // Employee cells
            employees.forEach(employee => {
                const employeeCell = document.createElement('div');
                employeeCell.className = 'day-cell';
                employeeCell.dataset.employeeId = employee.id;
                employeeCell.dataset.date = formatDate(date);
                
                // Check for absences
                const employeeAbsence = absences.find(absence => 
                    absence.employee_id === employee.id && 
                    isDateInRange(date, new Date(absence.start_date), new Date(absence.end_date))
                );
                
                if (employeeAbsence) {
                    const absenceType = employeeAbsence.absence_types;
                    const absenceDiv = document.createElement('div');
                    absenceDiv.className = `shift shift-${absenceType.category}`;
                    absenceDiv.textContent = absenceType.name;
                    employeeCell.appendChild(absenceDiv);
                    employeeCell.classList.add('has-absence');
                } else {
                    // Check for attendances
                    const employeeAttendances = attendances.filter(attendance => 
                        attendance.employee_id === employee.id && 
                        attendance.date === formatDate(date)
                    );
                    
                    employeeAttendances.forEach(attendance => {
                        const shiftDiv = document.createElement('div');
                        let shiftType = '';
                        
                        // Determine shift type based on start time
                        const startHour = parseInt(attendance.start_time.split(':')[0]);
                        if (startHour >= 5 && startHour < 12) {
                            shiftType = 'early';
                        } else if (startHour >= 12 && startHour < 20) {
                            shiftType = 'late';
                        } else {
                            shiftType = 'night';
                        }
                        
                        shiftDiv.className = `shift shift-${shiftType}`;
                        shiftDiv.dataset.attendanceId = attendance.id;
                        shiftDiv.innerHTML = `
                            <span>${formatTime(attendance.start_time)}-${formatTime(attendance.end_time)}</span>
                        `;
                        
                        // Add edit and delete buttons
                        const actionsDiv = document.createElement('div');
                        actionsDiv.className = 'shift-actions';
                        
                        const editBtn = document.createElement('button');
                        editBtn.className = 'shift-action-btn edit-shift';
                        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                        editBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            editShift(attendance);
                        });
                        
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'shift-action-btn delete-shift';
                        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            deleteShift(attendance.id);
                        });
                        
                        actionsDiv.appendChild(editBtn);
                        actionsDiv.appendChild(deleteBtn);
                        
                        shiftDiv.appendChild(actionsDiv);
                        employeeCell.appendChild(shiftDiv);
                    });
                    
                    // Add click event to add shift
                    employeeCell.addEventListener('click', () => {
                        if (!employeeCell.classList.contains('has-absence')) {
                            openShiftModal(employee.id, date);
                        }
                    });
                }
                
                dayColumn.appendChild(employeeCell);
            });
            
            scheduleDays.appendChild(dayColumn);
        }
    }

    function setupDragAndDrop() {
        const shiftElements = document.querySelectorAll('.shift');
        const dayCells = document.querySelectorAll('.day-cell:not(.required-shifts):not(.open-shifts)');
        
        shiftElements.forEach(shift => {
            shift.setAttribute('draggable', true);
            
            shift.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', shift.dataset.attendanceId);
                e.dataTransfer.effectAllowed = 'move';
            });
        });
        
        dayCells.forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                // Only allow drop if cell doesn't have an absence
                if (!cell.classList.contains('has-absence')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    cell.classList.add('drag-over');
                }
            });
            
            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });
            
            cell.addEventListener('drop', async (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                
                const attendanceId = e.dataTransfer.getData('text/plain');
                const employeeId = parseInt(cell.dataset.employeeId);
                const date = cell.dataset.date;
                
                // Update the attendance with new employee and date
                try {
                    const response = await api.attendances.update(attendanceId, {
                        employee_id: employeeId,
                        date: date
                    });
                    
                    if (response.error) {
                        console.error('Error updating attendance:', response.error);
                        return;
                    }
                    
                    // Reload attendances and re-render
                    await loadAttendances();
                } catch (error) {
                    console.error('Error updating attendance:', error);
                }
            });
        });
    }

    function openShiftModal(employeeId = null, date = null) {
        selectedShift = null;
        
        // Reset form
        shiftForm.reset();
        
        // Set date if provided
        if (date) {
            document.getElementById('shift-date').value = formatDate(date);
        } else {
            document.getElementById('shift-date').value = formatDate(new Date());
        }
        
        // Set employee if provided
        if (employeeId) {
            document.getElementById('shift-employee').value = employeeId;
        }
        
        // Show modal
        shiftModal.classList.add('active');
    }

    function editShift(attendance) {
        selectedShift = attendance;
        
        // Fill form with attendance data
        document.getElementById('shift-date').value = attendance.date;
        document.getElementById('shift-employee').value = attendance.employee_id;
        
        // Determine shift type based on start time
        const startHour = parseInt(attendance.start_time.split(':')[0]);
        let shiftType = '';
        
        if (startHour >= 5 && startHour < 12) {
            shiftType = 'frühdienst';
        } else if (startHour >= 12 && startHour < 20) {
            shiftType = 'spätdienst';
        } else {
            shiftType = 'nachtdienst';
        }
        
        document.getElementById('shift-type').value = shiftType;
        document.getElementById('shift-notes').value = attendance.notes || '';
        
        // Show modal
        shiftModal.classList.add('active');
    }

    async function saveShift() {
        const date = document.getElementById('shift-date').value;
        const employeeId = parseInt(document.getElementById('shift-employee').value);
        const shiftType = document.getElementById('shift-type').value;
        const notes = document.getElementById('shift-notes').value;
        
        // Determine start and end times based on shift type
        let startTime, endTime;
        
        switch (shiftType) {
            case 'frühdienst':
                startTime = '07:00';
                endTime = '15:00';
                break;
            case 'spätdienst':
                startTime = '15:00';
                endTime = '23:00';
                break;
            case 'nachtdienst':
                startTime = '23:00';
                endTime = '07:00';
                break;
        }
        
        try {
            let response;
            
            if (selectedShift) {
                // Update existing shift
                response = await api.attendances.update(selectedShift.id, {
                    employee_id: employeeId,
                    date,
                    start_time: startTime,
                    end_time: endTime,
                    notes
                });
            } else {
                // Create new shift
                response = await api.attendances.create({
                    employee_id: employeeId,
                    date,
                    start_time: startTime,
                    end_time: endTime,
                    notes
                });
            }
            
            if (response.error) {
                console.error('Error saving shift:', response.error);
                return;
            }
            
            // Close modal and reload attendances
            shiftModal.classList.remove('active');
            await loadAttendances();
        } catch (error) {
            console.error('Error saving shift:', error);
        }
    }

    async function deleteShift(attendanceId) {
        if (confirm('Sind Sie sicher, dass Sie diese Schicht löschen möchten?')) {
            try {
                const response = await api.attendances.delete(attendanceId);
                
                if (response.error) {
                    console.error('Error deleting shift:', response.error);
                    return;
                }
                
                // Reload attendances and re-render
                await loadAttendances();
            } catch (error) {
                console.error('Error deleting shift:', error);
            }
        }
    }

    // Removed savePlan function

    function populateEmployeeSelect() {
        shiftEmployeeSelect.innerHTML = '';
        
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.first_name} ${employee.last_name}`;
            shiftEmployeeSelect.appendChild(option);
        });
    }

    // Helper functions
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
        return `${day}. ${month}.`;
    }

    function formatTime(timeString) {
        return timeString.substring(0, 5);
    }

    function isDateInRange(date, startDate, endDate) {
        return date >= startDate && date <= endDate;
    }
});
