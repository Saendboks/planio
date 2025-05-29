// Schichtplanung (Shift Planning) Tool
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const timeColumn = document.querySelector('.time-column');
    const daysGrid = document.querySelector('.days-grid');
    const scheduleContent = document.querySelector('.schedule-content');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const currentDateDisplay = document.getElementById('current-date-display');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const teamFilterBtn = document.getElementById('team-filter-btn');
    const teamFilterDropdown = document.getElementById('team-filter-dropdown');
    const addShiftBtn = document.getElementById('add-shift-btn');
    const dayColumns = document.querySelectorAll('.day-column');
    const dayHeaders = document.querySelectorAll('.day-header');
    const teamCheckboxes = document.querySelectorAll('.team-checkbox');
    const teamHoursItems = document.querySelectorAll('.team-hours-item');
    const shiftPlanningModal = document.getElementById('shift-planning-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const shiftPlanningForm = document.getElementById('shift-planning-form');
    const shiftDateInput = document.getElementById('shift-date');
    const teamHoursElements = {
        'team-a': document.getElementById('team-a-hours'),
        'team-b': document.getElementById('team-b-hours'),
        'team-c': document.getElementById('team-c-hours'),
        'total': document.getElementById('total-hours')
    };

    // State
    let currentDate = new Date();
    let shifts = [];
    let selectedShift = null;
    let visibleTeams = ['all', 'team-a', 'team-b', 'team-c'];
    let isGridCellClick = false; // Flag to track if modal was opened from grid cell click
    
    // Initialize
    init();

    // Event listeners
    prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
    nextWeekBtn.addEventListener('click', () => navigateWeek(1));
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    todayBtn.addEventListener('click', goToToday);
    addShiftBtn.addEventListener('click', openShiftModal);
    
    // Set up click-to-add functionality for grid cells
    setupGridCellClickHandlers();
    
    // Team filter dropdown
    teamFilterBtn.addEventListener('click', () => {
        teamFilterDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!teamFilterBtn.contains(e.target) && !teamFilterDropdown.contains(e.target)) {
            teamFilterDropdown.classList.remove('show');
        }
    });
    
    teamCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleTeamFilter);
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shiftPlanningModal.classList.remove('active');
        });
    });

    shiftPlanningForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveShift();
    });

    // Initialize the application
    async function init() {
        updateDateDisplay();
        await loadShifts();
        renderShifts();
        setupDragAndDrop();
        setupGridCellClickHandlers();
        setupSynchronizedScrolling();
    }
    
    // Set up click handlers for grid cells to add shifts
    function setupGridCellClickHandlers() {
        // Get all grid cells
        const gridCells = document.querySelectorAll('.grid-cell');
        
        // Add click event listener to each grid cell
        gridCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                // Only trigger if the click was directly on the cell (not on a shift)
                if (e.target === cell) {
                    const dayIndex = parseInt(cell.dataset.day);
                    const hour = parseInt(cell.dataset.hour);
                    
                    // Open the shift modal with the selected time and date
                    openShiftModalWithTime(dayIndex, hour);
                }
            });
        });
    }
    
    // Open shift modal with pre-filled time and date based on clicked cell
    function openShiftModalWithTime(dayIndex, hour) {
        // Set flag to indicate this is a grid cell click
        isGridCellClick = true;
        
        // Create a new date object for the current date to avoid modifying it
        const currentDateCopy = new Date(currentDate.getTime());
        
        // Calculate the date for the selected day
        const weekStartDate = getWeekStartDate(currentDateCopy);
        const selectedDate = new Date(weekStartDate);
        selectedDate.setDate(weekStartDate.getDate() + dayIndex);
        
        // Format the date for the input
        const formattedDate = formatDate(selectedDate);
        
        // Format the start and end times (1-hour duration by default)
        const startHour = hour.toString().padStart(2, '0');
        const endHour = (hour + 1).toString().padStart(2, '0');
        const startTime = `${startHour}:00`;
        const endTime = `${endHour}:00`;
        
        // Reset form and open modal
        selectedShift = null;
        shiftPlanningForm.reset();
        
        // Set values based on clicked cell
        document.getElementById('shift-date').value = formattedDate;
        document.getElementById('shift-start-time').value = startTime;
        document.getElementById('shift-end-time').value = endTime;
        
        // Open the modal
        shiftPlanningModal.classList.add('active');
    }

    // Synchronize scrolling between time column and days grid
    function setupSynchronizedScrolling() {
        if (daysGrid) {
            // Make time column follow days grid scrolling
            daysGrid.addEventListener('scroll', () => {
                if (timeColumn) {
                    // Sync vertical scrolling
                    timeColumn.style.transform = `translateY(-${daysGrid.scrollTop}px)`;
                }
            });
            
            // Add wheel event to time column to scroll days grid
            timeColumn.addEventListener('wheel', (e) => {
                e.preventDefault();
                daysGrid.scrollTop += e.deltaY;
            });
        }
    }

    // Navigation functions
    function navigateWeek(direction) {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (7 * direction));
        currentDate = newDate;
        updateDateDisplay();
        loadShifts();
    }

    function navigateMonth(direction) {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        currentDate = newDate;
        updateDateDisplay();
        loadShifts();
    }

    function goToToday() {
        currentDate = new Date();
        updateDateDisplay();
        loadShifts();
    }

    function updateDateDisplay() {
        const weekStartDate = getWeekStartDate(currentDate);
        const weekEndDate = getWeekEndDate(currentDate);
        
        // Format: "3. Juli - 9. Juli"
        const startDay = weekStartDate.getDate();
        const startMonth = weekStartDate.toLocaleString('de-DE', { month: 'long' });
        const endDay = weekEndDate.getDate();
        const endMonth = weekEndDate.toLocaleString('de-DE', { month: 'long' });
        
        let dateRangeText = `${startDay}. ${startMonth}`;
        if (startMonth !== endMonth) {
            dateRangeText += ` - ${endDay}. ${endMonth}`;
        } else {
            dateRangeText += ` - ${endDay}. ${startMonth}`;
        }
        
        document.getElementById('current-date-display').textContent = dateRangeText;
        
        // Update month display
        const monthYear = currentDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
        document.getElementById('current-month-display').textContent = monthYear;
        
        // Update date display for each day column
        updateDayColumnDates(weekStartDate);
    }
    
    // Update the dates for each day column
    function updateDayColumnDates(weekStartDate) {
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + i);
            
            // Update the date display
            const dateElement = document.getElementById(`date-${i}`);
            if (dateElement) {
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                dateElement.textContent = formattedDate;
            }
        }
    }

    function updateDayHeaders() {
        const weekStartDate = getWeekStartDate(currentDate);
        
        // Update day headers with correct dates
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + i);
            
            const dayName = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(dayDate);
            const formattedDate = formatDateDisplay(dayDate);
            
            const dayHeader = dayHeaders[i];
            dayHeader.innerHTML = `
                <div>${dayName}</div>
                <div class="day-date">${formattedDate}</div>
            `;
            
            // Apply alternating background colors to day headers and columns
            const isWeekend = i === 5 || i === 6; // Saturday or Sunday
            const isEven = i % 2 === 0;
            
            // Apply classes to day headers
            dayHeader.classList.remove('weekend', 'even', 'odd');
            if (isWeekend) {
                dayHeader.classList.add('weekend');
            } else {
                dayHeader.classList.add(isEven ? 'even' : 'odd');
            }
            
            // Apply classes to day columns
            const dayColumn = dayColumns[i];
            dayColumn.classList.remove('weekend', 'even', 'odd');
            if (isWeekend) {
                dayColumn.classList.add('weekend');
            } else {
                dayColumn.classList.add(isEven ? 'even' : 'odd');
            }
        }
    }

    // Team filter handling
    function handleTeamFilter(e) {
        const checkbox = e.target;
        const team = checkbox.dataset.team;
        
        if (team === 'all' && checkbox.checked) {
            // If "All Teams" is checked, uncheck all other teams
            teamCheckboxes.forEach(cb => {
                if (cb.dataset.team !== 'all') {
                    cb.checked = false;
                }
            });
            visibleTeams = ['all', 'team-a', 'team-b', 'team-c'];
        } else if (team === 'all' && !checkbox.checked) {
            // If "All Teams" is unchecked, do nothing (prevent unchecking all)
            checkbox.checked = true;
            return;
        } else {
            // If a specific team is checked, uncheck "All Teams"
            const allTeamsCheckbox = document.getElementById('filter-all');
            allTeamsCheckbox.checked = false;
            
            // Update visible teams
            visibleTeams = Array.from(teamCheckboxes)
                .filter(cb => cb.checked && cb.dataset.team !== 'all')
                .map(cb => cb.dataset.team);
            
            // If no specific team is selected, check "All Teams"
            if (visibleTeams.length === 0) {
                allTeamsCheckbox.checked = true;
                visibleTeams = ['all', 'team-a', 'team-b', 'team-c'];
            }
        }
        
        // Update team hours visibility
        updateTeamHoursVisibility();
        
        // Render shifts
        renderShifts();
    }
    
    // Update which team hours are visible based on filter
    function updateTeamHoursVisibility() {
        teamHoursItems.forEach(item => {
            const teamId = item.dataset.team;
            
            // Always show the total
            if (!teamId || item.classList.contains('total')) {
                return;
            }
            
            // Show team if it's visible or if all teams are visible
            if (visibleTeams.includes(teamId) || visibleTeams.includes('all')) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // Shift data functions
    async function loadShifts() {
        try {
            // Get week date range
            const startDate = getWeekStartDate(currentDate);
            const endDate = getWeekEndDate(currentDate);
            
            // In a real app, this would be an API call to get shifts for the date range
            // For demo purposes, we'll generate some sample shifts
            shifts = generateSampleShifts(startDate, endDate);
            
            calculateTeamHours();
            updateTeamHoursVisibility();
            renderShifts();
        } catch (error) {
            console.error('Error loading shifts:', error);
        }
    }

    function generateSampleShifts(startDate, endDate) {
        const sampleShifts = [];
        const teams = ['team-a', 'team-b', 'team-c'];
        const shiftTypes = [
            { startTime: '08:00', endTime: '16:00', color: 'var(--shift-early)', name: 'Frühdienst' },
            { startTime: '14:00', endTime: '22:00', color: 'var(--shift-late)', name: 'Spätdienst' },
            { startTime: '22:00', endTime: '06:00', color: 'var(--shift-night)', name: 'Nachtdienst' }
        ];
        
        // Clone the start date to avoid modifying it
        const currentDay = new Date(startDate);
        let id = 1;
        
        // Generate shifts for each day in the range
        while (currentDay <= endDate) {
            const dateStr = formatDate(currentDay);
            
            // Generate 1-3 shifts for each day
            const shiftsPerDay = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < shiftsPerDay; i++) {
                const team = teams[Math.floor(Math.random() * teams.length)];
                const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
                
                sampleShifts.push({
                    id: id++,
                    team: team,
                    date: dateStr,
                    startTime: shiftType.startTime,
                    endTime: shiftType.endTime,
                    color: shiftType.color,
                    notes: `${shiftType.name} ${team.replace('team-', 'Team ')}`
                });
            }
            
            // Move to the next day
            currentDay.setDate(currentDay.getDate() + 1);
        }
        
        return sampleShifts;
    }

    // Render functions
    function renderShifts() {
        // Clear any existing shifts from day columns
        dayColumns.forEach(column => {
            // Remove only shift elements, keep grid cells
            const shiftElements = column.querySelectorAll('.shift-item');
            shiftElements.forEach(el => el.remove());
        });
        
        // Get week date range
        const weekStartDate = getWeekStartDate(currentDate);
        const weekStart = formatDate(weekStartDate);
        const weekEnd = formatDate(getWeekEndDate(currentDate));
        
        // Filter shifts by visible teams and current week
        const filteredShifts = shifts.filter(shift => 
            (visibleTeams.includes('all') || visibleTeams.includes(shift.team)) &&
            isDateInRange(shift.date, weekStart, weekEnd)
        );
        
        // Group shifts by day
        const shiftsByDay = {};
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + i);
            shiftsByDay[formatDate(dayDate)] = [];
        }
        
        // Add shifts to their respective days
        filteredShifts.forEach(shift => {
            if (shiftsByDay[shift.date]) {
                shiftsByDay[shift.date].push(shift);
            }
        });
        
        // Render shifts for each day
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + i);
            const dateStr = formatDate(dayDate);
            const dayShifts = shiftsByDay[dateStr] || [];
            
            // Get the corresponding day column
            const dayColumn = dayColumns[i];
            
            // Render shifts for this day
            dayShifts.forEach(shift => {
                const shiftElement = createShiftElement(shift);
                dayColumn.appendChild(shiftElement);
            });
        }
        
        // Check for overlaps
        checkShiftOverlaps();
    }

    function createShiftElement(shift) {
        const shiftElement = document.createElement('div');
        shiftElement.classList.add('shift-item', shift.team);
        shiftElement.dataset.id = shift.id;
        shiftElement.dataset.team = shift.team;
        
        // Calculate position and size
        const { top, height } = calculateShiftPosition(shift);
        
        shiftElement.style.top = `${top}px`;
        shiftElement.style.height = `${height}px`;
        shiftElement.style.left = '0';
        shiftElement.style.right = '0';
        shiftElement.style.backgroundColor = shift.color;
        
        // Add content
        shiftElement.innerHTML = `
            <div class="shift-time">${shift.startTime} - ${shift.endTime}</div>
            <div class="shift-team">${getTeamName(shift.team)}</div>
            <div class="shift-notes">${shift.notes}</div>
        `;
        
        // Add event listeners
        shiftElement.addEventListener('dblclick', () => editShift(shift));
        
        return shiftElement;
    }

    function calculateShiftPosition(shift) {
        // Convert time to minutes for calculation
        const startMinutes = timeToMinutes(shift.startTime);
        const endMinutes = timeToMinutes(shift.endTime);
        
        // Handle overnight shifts
        let duration = endMinutes - startMinutes;
        if (duration < 0) {
            duration += 24 * 60; // Add 24 hours in minutes
        }
        
        // Calculate position (1-hour = 60px height)
        const hourHeight = 60;
        const top = (startMinutes / 60) * hourHeight;
        const height = (duration / 60) * hourHeight;
        
        return { top, height };
    }

    function checkShiftOverlaps() {
        // Check each day column for overlaps
        dayColumns.forEach(column => {
            const shiftElements = column.querySelectorAll('.shift-item');
            
            // Reset overlap status
            shiftElements.forEach(el => el.classList.remove('overlap'));
            
            // Check each pair of shifts for overlap
            for (let i = 0; i < shiftElements.length; i++) {
                const shift1 = shiftElements[i];
                const team1 = shift1.dataset.team;
                const top1 = parseFloat(shift1.style.top);
                const height1 = parseFloat(shift1.style.height);
                const bottom1 = top1 + height1;
                
                for (let j = i + 1; j < shiftElements.length; j++) {
                    const shift2 = shiftElements[j];
                    const team2 = shift2.dataset.team;
                    
                    // Only check overlaps within the same team
                    if (team1 === team2) {
                        const top2 = parseFloat(shift2.style.top);
                        const height2 = parseFloat(shift2.style.height);
                        const bottom2 = top2 + height2;
                        
                        // Check if shifts overlap
                        if (!(bottom1 <= top2 || bottom2 <= top1)) {
                            shift1.classList.add('overlap');
                            shift2.classList.add('overlap');
                        }
                    }
                }
            }
        });
    }

    function calculateTeamHours() {
        // Reset hours
        let teamHours = {
            'team-a': 0,
            'team-b': 0,
            'team-c': 0,
            'total': 0
        };
        
        // Calculate hours for each shift
        shifts.forEach(shift => {
            const startMinutes = timeToMinutes(shift.startTime);
            const endMinutes = timeToMinutes(shift.endTime);
            
            // Handle overnight shifts
            let duration = endMinutes - startMinutes;
            if (duration < 0) {
                duration += 24 * 60; // Add 24 hours in minutes
            }
            
            const hours = duration / 60;
            teamHours[shift.team] += hours;
            teamHours['total'] += hours;
        });
        
        // Update the UI
        for (const team in teamHours) {
            if (teamHoursElements[team]) {
                teamHoursElements[team].textContent = `${teamHours[team].toFixed(1)} Stunden`;
            }
        }
    }

    // Modal functions
    function openShiftModal(shift = null) {
        // Reset grid cell click flag
        isGridCellClick = false;
        selectedShift = shift;
        
        if (shift) {
            // Populate form with shift data if editing
            document.getElementById('shift-team').value = shift.team;
            document.getElementById('shift-date').value = shift.date;
            document.getElementById('shift-start-time').value = shift.startTime;
            document.getElementById('shift-end-time').value = shift.endTime;
            document.getElementById('shift-color').value = shift.color;
            document.getElementById('shift-notes').value = shift.notes;
        } else {
            // Reset form for new shift
            shiftPlanningForm.reset();
            
            // If adding a new shift, use the currently selected date in the calendar
            // Get the date from the middle of the current week view
            const weekStartDate = getWeekStartDate(currentDate);
            const selectedDay = new Date(weekStartDate);
            selectedDay.setDate(weekStartDate.getDate() + 3); // Default to middle of week (Thursday)
            
            document.getElementById('shift-date').value = formatDate(selectedDay);
            document.getElementById('shift-start-time').value = '08:00'; // Default start time
            document.getElementById('shift-end-time').value = '16:00'; // Default end time
        }
        
        shiftPlanningModal.classList.add('active');
    }

    function saveShift() {
        const team = document.getElementById('shift-team').value;
        const date = document.getElementById('shift-date').value;
        const startTime = document.getElementById('shift-start-time').value;
        const endTime = document.getElementById('shift-end-time').value;
        const color = document.getElementById('shift-color').value;
        const notes = document.getElementById('shift-notes').value;
        
        if (!team || !date || !startTime || !endTime) {
            alert('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }
        
        // Only validate date range if not from a grid cell click
        if (!isGridCellClick) {
            // Validate that the date is within the current week view
            const weekStartDate = getWeekStartDate(currentDate);
            const weekEndDate = getWeekEndDate(currentDate);
            const shiftDate = new Date(date);
            
            if (shiftDate < weekStartDate || shiftDate > weekEndDate) {
                const confirmOutOfRange = confirm(
                    'Das gewählte Datum liegt außerhalb der aktuellen Wochenansicht. ' +
                    'Möchten Sie zur Woche dieses Datums wechseln?'
                );
                
                if (confirmOutOfRange) {
                    // Navigate to the week containing the selected date
                    currentDate = new Date(date);
                    updateDateDisplay();
                } else {
                    // Stay on current week but adjust date to be within current week
                    const adjustedDate = new Date(weekStartDate);
                    adjustedDate.setDate(weekStartDate.getDate() + 3); // Thursday of current week
                    document.getElementById('shift-date').value = formatDate(adjustedDate);
                    return; // Let the user try again
                }
            }
        }
        
        // Reset the grid cell click flag
        isGridCellClick = false;
        
        if (selectedShift) {
            // Update existing shift
            const index = shifts.findIndex(s => s.id === selectedShift.id);
            if (index !== -1) {
                shifts[index] = {
                    ...selectedShift,
                    team,
                    date,
                    startTime,
                    endTime,
                    color,
                    notes
                };
            }
        } else {
            // Create new shift
            const newShift = {
                id: Date.now(), // Simple ID generation
                team,
                date,
                startTime,
                endTime,
                color,
                notes
            };
            shifts.push(newShift);
        }
        
        // Close modal and refresh
        shiftPlanningModal.classList.remove('active');
        calculateTeamHours();
        updateTeamHoursVisibility();
        renderShifts(); // Render the updated shifts
        setupDragAndDrop();
    }

    function editShift(shift) {
        openShiftModal(shift);
    }

    function deleteShift(shiftId) {
        const index = shifts.findIndex(s => s.id === shiftId);
        if (index !== -1) {
            shifts.splice(index, 1);
            calculateTeamHours();
            renderShifts();
        }
    }

    // Drag and drop functionality
    function setupDragAndDrop() {
        // Remove any existing interact instances to prevent duplicates
        interact('.shift-item').unset();
        
        interact('.shift-item')
            .draggable({
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                autoScroll: true,
                listeners: {
                    move: dragMoveListener,
                    end: dragEndListener
                }
            });
    }

    function dragMoveListener(event) {
        const target = event.target;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        
        // Update element position
        target.style.transform = `translate(0px, ${y}px)`;
        target.setAttribute('data-y', y);
    }

    function dragEndListener(event) {
        const target = event.target;
        const shiftId = parseInt(target.dataset.id);
        const y = parseFloat(target.getAttribute('data-y')) || 0;
        
        // Find the shift in our data
        const shiftIndex = shifts.findIndex(s => s.id === shiftId);
        if (shiftIndex === -1) return;
        
        // Calculate new times based on position
        const hourHeight = 60;
        const headerHeight = 40;
        const originalTop = calculateShiftPosition(shifts[shiftIndex]).top;
        const newTop = originalTop + y;
        
        // Convert position back to time
        const minutesFromMidnight = ((newTop - headerHeight) / hourHeight) * 60;
        const hours = Math.floor(minutesFromMidnight / 60);
        const minutes = Math.floor(minutesFromMidnight % 60);
        
        // Format new start time
        const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Calculate duration of the shift
        const startMinutes = timeToMinutes(shifts[shiftIndex].startTime);
        const endMinutesValue = timeToMinutes(shifts[shiftIndex].endTime);
        let duration = endMinutesValue - startMinutes;
        if (duration < 0) duration += 24 * 60;
        
        // Calculate new end time
        const newEndMinutes = (minutesFromMidnight + duration) % (24 * 60);
        const endHours = Math.floor(newEndMinutes / 60);
        const endMinutesValue2 = Math.floor(newEndMinutes % 60);
        const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutesValue2.toString().padStart(2, '0')}`;
        
        // Update the shift
        shifts[shiftIndex] = {
            ...shifts[shiftIndex],
            startTime: newStartTime,
            endTime: newEndTime
        };
        
        // Reset transform and update the UI
        target.style.transform = '';
        target.setAttribute('data-y', 0);
        calculateTeamHours();
        renderShifts();
    }

    // Helper functions
    function timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function formatDateDisplay(date) {
        const options = { day: 'numeric', month: 'long' };
        return date.toLocaleDateString('de-DE', options);
    }

    function getWeekStartDate(date) {
        // Create a new date object to avoid modifying the original
        const newDate = new Date(date.getTime());
        const day = newDate.getDay();
        const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        newDate.setDate(diff);
        return newDate;
    }

    function getWeekEndDate(date) {
        // Get the start of the week without modifying the original date
        const startDate = getWeekStartDate(date);
        // Create end date by adding 6 days to the start date
        const endDate = new Date(startDate.getTime());
        endDate.setDate(startDate.getDate() + 6);
        return endDate;
    }

    function isDateInRange(dateStr, startDateStr, endDateStr) {
        return dateStr >= startDateStr && dateStr <= endDateStr;
    }

    function getTeamName(teamId) {
        const teamNames = {
            'team-a': 'Team A',
            'team-b': 'Team B',
            'team-c': 'Team C'
        };
        return teamNames[teamId] || teamId;
    }
});
