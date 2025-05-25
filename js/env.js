// Supabase configuration
const SUPABASE_URL = 'https://cdgfdmnfvidnaicihwdt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZ2ZkbW5mdmlkbmFpY2lod2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDQyMjAsImV4cCI6MjA2Mjk4MDIyMH0.jCB_7eqtOrkjZQhGZ0nm70SsKLYOFTBNiJi-dx3xq2A';

// Network connectivity check
const checkConnectivity = async () => {
    try {
        const online = navigator.onLine;
        if (!online) {
            console.warn('Browser reports offline status. Supabase connections will likely fail.');
            showOfflineNotification();
            return false;
        }
        
        // Additional connectivity check to Supabase
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_KEY
            }
        });
        
        return testResponse.ok;
    } catch (error) {
        console.error('Connectivity test failed:', error);
        showOfflineNotification();
        return false;
    }
};

// Show offline notification
const showOfflineNotification = () => {
    // Create notification if it doesn't exist
    if (!document.getElementById('offline-notification')) {
        const notification = document.createElement('div');
        notification.id = 'offline-notification';
        notification.style.position = 'fixed';
        notification.style.top = '0';
        notification.style.left = '0';
        notification.style.right = '0';
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        notification.style.padding = '10px';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '9999';
        notification.innerHTML = 'Sie sind offline. Einige Funktionen sind möglicherweise nicht verfügbar.';
        
        document.body.appendChild(notification);
    }
};

// Initialize connectivity check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkConnectivity();
});

// Listen for online/offline events
window.addEventListener('online', () => {
    console.log('Browser is online');
    const notification = document.getElementById('offline-notification');
    if (notification) notification.remove();
    checkConnectivity();
});

window.addEventListener('offline', () => {
    console.log('Browser is offline');
    showOfflineNotification();
});

// You should replace these values with your actual Supabase project URL and anon key
