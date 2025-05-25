// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Authentication functions
const auth = {
    // Sign in with email and password
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // Sign up with email and password
    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        return { data, error };
    },

    // Sign out
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Get current user
    getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Check if user is authenticated
    isAuthenticated: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }
};

// Employee functions
const employees = {
    // Get all employees
    getAll: async () => {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('last_name', { ascending: true });
        return { data, error };
    },

    // Get employee by ID
    getById: async (id) => {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    },

    // Create new employee
    create: async (employee) => {
        const { data, error } = await supabase
            .from('employees')
            .insert([employee])
            .select();
        return { data, error };
    },

    // Update employee
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    },

    // Delete employee
    delete: async (id) => {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);
        return { error };
    },

    // Get employees by department
    getByDepartment: async (department) => {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('department', department)
            .order('last_name', { ascending: true });
        return { data, error };
    }
};

// Absence types functions
const absenceTypes = {
    // Get all absence types
    getAll: async () => {
        const { data, error } = await supabase
            .from('absence_types')
            .select('*');
        return { data, error };
    },

    // Get absence type by ID
    getById: async (id) => {
        const { data, error } = await supabase
            .from('absence_types')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }
};

// Absences functions
const absences = {
    // Get all absences
    getAll: async () => {
        const { data, error } = await supabase
            .from('absences')
            .select('*, employees(*), absence_types(*)');
        return { data, error };
    },

    // Get absences by employee ID
    getByEmployee: async (employeeId) => {
        const { data, error } = await supabase
            .from('absences')
            .select('*, absence_types(*)')
            .eq('employee_id', employeeId);
        return { data, error };
    },

    // Get absences for a date range
    getByDateRange: async (startDate, endDate) => {
        const { data, error } = await supabase
            .from('absences')
            .select('*, employees(*), absence_types(*)')
            .gte('start_date', startDate)
            .lte('end_date', endDate);
        return { data, error };
    },

    // Create new absence
    create: async (absence) => {
        const { data, error } = await supabase
            .from('absences')
            .insert([absence])
            .select();
        return { data, error };
    },

    // Update absence
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('absences')
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    },

    // Delete absence
    delete: async (id) => {
        const { error } = await supabase
            .from('absences')
            .delete()
            .eq('id', id);
        return { error };
    }
};

// Attendances (shifts) functions
const attendances = {
    // Get all attendances
    getAll: async () => {
        const { data, error } = await supabase
            .from('attendances')
            .select('*, employees(*)');
        return { data, error };
    },

    // Get attendances by employee ID
    getByEmployee: async (employeeId) => {
        const { data, error } = await supabase
            .from('attendances')
            .select('*')
            .eq('employee_id', employeeId);
        return { data, error };
    },

    // Get attendances for a date
    getByDate: async (date) => {
        const { data, error } = await supabase
            .from('attendances')
            .select('*, employees(*)')
            .eq('date', date);
        return { data, error };
    },

    // Get attendances for a date range
    getByDateRange: async (startDate, endDate) => {
        const { data, error } = await supabase
            .from('attendances')
            .select('*, employees(*)')
            .gte('date', startDate)
            .lte('date', endDate);
        return { data, error };
    },

    // Create new attendance
    create: async (attendance) => {
        const { data, error } = await supabase
            .from('attendances')
            .insert([attendance])
            .select();
        return { data, error };
    },

    // Update attendance
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('attendances')
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    },

    // Delete attendance
    delete: async (id) => {
        const { error } = await supabase
            .from('attendances')
            .delete()
            .eq('id', id);
        return { error };
    },

    // Bulk create attendances
    bulkCreate: async (attendances) => {
        const { data, error } = await supabase
            .from('attendances')
            .insert(attendances)
            .select();
        return { data, error };
    },

    // Delete attendances for a date range
    deleteByDateRange: async (startDate, endDate) => {
        const { error } = await supabase
            .from('attendances')
            .delete()
            .gte('date', startDate)
            .lte('date', endDate);
        return { error };
    }
};

// Export all API functions
const api = {
    auth,
    employees,
    absenceTypes,
    absences,
    attendances
};
