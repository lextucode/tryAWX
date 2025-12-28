document.addEventListener('DOMContentLoaded', () => {
    // State
    let config = {
        url: localStorage.getItem('awx_url') || 'http://localhost:8080',
        username: localStorage.getItem('awx_username') || 'admin',
        password: '',
        token: null
    };

    let state = {
        isConnected: false,
        refreshInterval: null,
        jobs: []
    };

    // DOM Elements
    const els = {
        awxUrl: document.getElementById('awxUrl'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        connectBtn: document.getElementById('connectBtn'),
        disconnectBtn: document.getElementById('disconnectBtn'),
        dashboard: document.getElementById('dashboard'),
        jobsBody: document.getElementById('jobsBody'),
        emptyState: document.getElementById('emptyState'),
        lastUpdated: document.getElementById('lastUpdated'),
        connectionStatus: document.getElementById('connectionStatus'),
        autoRefresh: document.getElementById('autoRefresh'),
        configPanel: document.getElementById('configPanel')
    };

    // Initialize inputs
    els.awxUrl.value = config.url;
    els.username.value = config.username;

    // Event Listeners
    els.connectBtn.addEventListener('click', handleConnect);
    els.disconnectBtn.addEventListener('click', handleDisconnect);
    els.autoRefresh.addEventListener('change', toggleAutoRefresh);

    async function handleConnect() {
        const url = els.awxUrl.value.replace(/\/$/, ''); // Remove trailing slash
        const username = els.username.value;
        const password = els.password.value;

        if (!url || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);

        // Basic Auth Header
        const authHeader = 'Basic ' + btoa(username + ':' + password);

        try {
            // Test connection by fetching current user or simple endpoint
            const response = await fetch(`${url}/api/v2/ping/`, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // If ping fails (might require auth or different perms), try /me or /config
                // But usually 401 means bad creds
                throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
            }

            // If success
            config = { url, username, password, authHeader };

            // Save non-sensitive data
            localStorage.setItem('awx_url', url);
            localStorage.setItem('awx_username', username);

            state.isConnected = true;
            updateUIState();
            fetchJobs();

            if (els.autoRefresh.checked) {
                startPolling();
            }

        } catch (error) {
            console.error(error);
            alert(`Failed to connect: ${error.message}. \n\nNote: If you are running this file locally and AWX is on a different domain/port, ensure CORS is enabled on AWX or use a browser extension to bypass CORS.`);
        } finally {
            setLoading(false);
        }
    }

    function handleDisconnect() {
        stopPolling();
        state.isConnected = false;
        config.password = null;
        config.authHeader = null;
        updateUIState();
        els.jobsBody.innerHTML = '';
        els.connectionStatus.textContent = 'Not Connected';
    }

    function updateUIState() {
        if (state.isConnected) {
            els.connectBtn.style.display = 'none';
            els.disconnectBtn.style.display = 'inline-block';
            els.awxUrl.disabled = true;
            els.username.disabled = true;
            els.password.disabled = true;

            els.dashboard.style.display = 'block';
            // Trigger reflow
            els.dashboard.offsetHeight;
            els.dashboard.style.opacity = '1';

            els.connectionStatus.textContent = `Connected to ${config.url} as ${config.username}`;
            els.connectionStatus.style.color = '#22c55e';
        } else {
            els.connectBtn.style.display = 'inline-block';
            els.disconnectBtn.style.display = 'none';
            els.awxUrl.disabled = false;
            els.username.disabled = false;
            els.password.disabled = false;

            els.dashboard.style.opacity = '0';
            setTimeout(() => {
                if (!state.isConnected) els.dashboard.style.display = 'none';
            }, 500);

            els.connectionStatus.textContent = 'Not Connected';
            els.connectionStatus.style.color = 'var(--text-muted)';
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            els.connectBtn.innerHTML = '<span class="spinner"></span> Connecting...';
            els.connectBtn.disabled = true;
        } else {
            els.connectBtn.innerHTML = 'Connect';
            els.connectBtn.disabled = false;
        }
    }

    function toggleAutoRefresh(e) {
        if (e.target.checked && state.isConnected) {
            startPolling();
        } else {
            stopPolling();
        }
    }

    function startPolling() {
        stopPolling();
        state.refreshInterval = setInterval(fetchJobs, 5000);
    }

    function stopPolling() {
        if (state.refreshInterval) {
            clearInterval(state.refreshInterval);
            state.refreshInterval = null;
        }
    }

    async function fetchJobs() {
        if (!state.isConnected) return;

        try {
            // Fetch jobs, ordered by ID desc
            const response = await fetch(`${config.url}/api/v2/jobs/?order_by=-id&page_size=20`, {
                headers: {
                    'Authorization': config.authHeader,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    handleDisconnect();
                    alert('Session expired or invalid credentials.');
                    return;
                }
                throw new Error(`Failed to fetch jobs: ${response.status}`);
            }

            const data = await response.json();
            renderJobs(data.results);

            const now = new Date();
            els.lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

        } catch (error) {
            console.error('Fetch error:', error);
            els.lastUpdated.textContent = `Update failed: ${error.message}`;
            els.lastUpdated.style.color = '#ef4444';
        }
    }

    function renderJobs(jobs) {
        state.jobs = jobs;
        els.jobsBody.innerHTML = '';

        if (!jobs || jobs.length === 0) {
            els.emptyState.style.display = 'block';
            return;
        }

        els.emptyState.style.display = 'none';

        jobs.forEach(job => {
            const tr = document.createElement('tr');

            // Format dates
            const started = job.started ? new Date(job.started).toLocaleString() : '-';
            const finished = job.finished ? new Date(job.finished).toLocaleString() : '-';

            tr.innerHTML = `
                <td>#${job.id}</td>
                <td><span class="status-badge status-${job.status}">${job.status}</span></td>
                <td style="font-weight: 500;">${job.name}</td>
                <td style="color: var(--text-muted);">${job.type}</td>
                <td>${started}</td>
                <td>${finished}</td>
            `;
            els.jobsBody.appendChild(tr);
        });
    }
});
