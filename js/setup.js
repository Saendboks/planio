// Planion - Database Setup Script
// This script initializes the Supabase database with the required tables and sample data

document.addEventListener('DOMContentLoaded', async () => {
    const setupStatus = document.getElementById('setup-status');
    const setupLog = document.getElementById('setup-log');
    
    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Log function
    function log(message, isError = false) {
        const logItem = document.createElement('div');
        logItem.className = isError ? 'log-item error' : 'log-item';
        logItem.textContent = message;
        setupLog.appendChild(logItem);
        setupLog.scrollTop = setupLog.scrollHeight;
        console.log(message);
    }
    
    // Setup function
    async function setupDatabase() {
        try {
            log('Starting database setup...');
            
            // Check if tables exist
            const { data: tables, error: tablesError } = await supabase
                .from('employees')
                .select('id')
                .limit(1);
                
            if (tablesError && tablesError.code === '42P01') {
                // Tables don't exist, create them
                log('Tables not found. Creating database schema...');
                await createTables();
            } else {
                log('Database tables already exist.');
            }
            
            // Check if we have data
            const { data: employees, error: employeesError } = await supabase
                .from('employees')
                .select('id')
                .limit(1);
                
            if (!employees || employees.length === 0) {
                log('No data found. Inserting sample data...');
                await insertSampleData();
            } else {
                log('Data already exists in the database.');
            }
            
            log('Database setup completed successfully!');
            setupStatus.textContent = 'Setup completed';
            setupStatus.className = 'status success';
            
            // Redirect to main page after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            
        } catch (error) {
            log(`Error during setup: ${error.message}`, true);
            setupStatus.textContent = 'Setup failed';
            setupStatus.className = 'status error';
        }
    }
    
    // Create tables
    async function createTables() {
        try {
            // Create employees table
            log('Creating employees table...');
            const { error: employeesError } = await supabase.rpc('create_employees_table');
            
            if (employeesError) {
                throw new Error(`Error creating employees table: ${employeesError.message}`);
            }
            
            // Create absence_types table
            log('Creating absence_types table...');
            const { error: absenceTypesError } = await supabase.rpc('create_absence_types_table');
            
            if (absenceTypesError) {
                throw new Error(`Error creating absence_types table: ${absenceTypesError.message}`);
            }
            
            // Create absences table
            log('Creating absences table...');
            const { error: absencesError } = await supabase.rpc('create_absences_table');
            
            if (absencesError) {
                throw new Error(`Error creating absences table: ${absencesError.message}`);
            }
            
            // Create attendances table
            log('Creating attendances table...');
            const { error: attendancesError } = await supabase.rpc('create_attendances_table');
            
            if (attendancesError) {
                throw new Error(`Error creating attendances table: ${attendancesError.message}`);
            }
            
            log('All tables created successfully.');
        } catch (error) {
            throw error;
        }
    }
    
    // Insert sample data
    async function insertSampleData() {
        try {
            // Insert employees
            log('Inserting sample employees...');
            const employees = [
                { first_name: 'Max', last_name: 'Mustermann', email: 'max@example.com', position: 'Schichtleiter', department: 'team-a', status: 'active' },
                { first_name: 'Anna', last_name: 'Schmidt', email: 'anna@example.com', position: 'Fachkraft', department: 'team-a', status: 'active' },
                { first_name: 'Thomas', last_name: 'Weber', email: 'thomas@example.com', position: 'Fachkraft', department: 'team-b', status: 'active' },
                { first_name: 'Lisa', last_name: 'Müller', email: 'lisa@example.com', position: 'Auszubildende', department: 'team-a', status: 'active' },
                { first_name: 'Jan', last_name: 'Fischer', email: 'jan@example.com', position: 'Schichtleiter', department: 'team-b', status: 'active' },
                { first_name: 'Sarah', last_name: 'Becker', email: 'sarah@example.com', position: 'Fachkraft', department: 'team-b', status: 'active' },
                { first_name: 'Michael', last_name: 'Schulz', email: 'michael@example.com', position: 'Aushilfe', department: 'team-a', status: 'inactive' }
            ];
            
            const { error: employeesError } = await supabase
                .from('employees')
                .insert(employees);
                
            if (employeesError) {
                throw new Error(`Error inserting employees: ${employeesError.message}`);
            }
            
            // Insert absence types
            log('Inserting absence types...');
            const absenceTypes = [
                { name: 'Urlaub', category: 'vacation' },
                { name: 'Krankheit', category: 'sick' },
                { name: 'Fortbildung', category: 'training' },
                { name: 'Sonstiges', category: 'other' }
            ];
            
            const { error: absenceTypesError } = await supabase
                .from('absence_types')
                .insert(absenceTypes);
                
            if (absenceTypesError) {
                throw new Error(`Error inserting absence types: ${absenceTypesError.message}`);
            }
            
            // Get employee IDs for absences and attendances
            const { data: employeeData, error: employeeDataError } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .order('id');
                
            if (employeeDataError) {
                throw new Error(`Error fetching employee data: ${employeeDataError.message}`);
            }
            
            // Insert absences
            log('Inserting sample absences...');
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            const absences = [
                { 
                    employee_id: employeeData[0].id, 
                    absence_type_id: 1, 
                    start_date: formatDate(nextWeek), 
                    end_date: formatDate(new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)), 
                    status: 'approved' 
                },
                { 
                    employee_id: employeeData[2].id, 
                    absence_type_id: 2, 
                    start_date: formatDate(today), 
                    end_date: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)), 
                    status: 'approved' 
                },
                { 
                    employee_id: employeeData[4].id, 
                    absence_type_id: 3, 
                    start_date: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)), 
                    end_date: formatDate(new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000)), 
                    status: 'pending' 
                }
            ];
            
            const { error: absencesError } = await supabase
                .from('absences')
                .insert(absences);
                
            if (absencesError) {
                throw new Error(`Error inserting absences: ${absencesError.message}`);
            }
            
            // Insert attendances (shifts)
            log('Inserting sample shifts...');
            const shifts = [];
            
            // Generate shifts for the current week
            for (let i = 0; i < 5; i++) { // Monday to Friday
                const date = new Date(today);
                date.setDate(today.getDate() - today.getDay() + 1 + i); // Start from Monday
                
                // Early shift for team A
                shifts.push({
                    employee_id: employeeData[0].id,
                    date: formatDate(date),
                    start_time: '07:00',
                    end_time: '15:00'
                });
                
                shifts.push({
                    employee_id: employeeData[1].id,
                    date: formatDate(date),
                    start_time: '07:00',
                    end_time: '15:00'
                });
                
                // Late shift for team B
                shifts.push({
                    employee_id: employeeData[4].id,
                    date: formatDate(date),
                    start_time: '15:00',
                    end_time: '23:00'
                });
                
                shifts.push({
                    employee_id: employeeData[5].id,
                    date: formatDate(date),
                    start_time: '15:00',
                    end_time: '23:00'
                });
            }
            
            const { error: shiftsError } = await supabase
                .from('attendances')
                .insert(shifts);
                
            if (shiftsError) {
                throw new Error(`Error inserting shifts: ${shiftsError.message}`);
            }
            
            log('Sample data inserted successfully.');
        } catch (error) {
            throw error;
        }
    }
    
    // Helper function to format date for database
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Start setup
    setupDatabase();
});
