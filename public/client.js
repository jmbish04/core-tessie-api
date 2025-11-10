/**
 * Core Cursor API - Client JavaScript Library
 */

// API Base URL
const API_BASE = window.location.origin;

// WebSocket connection management
class WSConnection {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.handlers = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.attemptReconnect();
      };
    });
  }

  on(type, handler) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(handler);
  }

  handleMessage(message) {
    const handlers = this.handlers[message.type];
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket not connected');
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// API Client
const API = {
  // Health
  async getHealth() {
    const response = await fetch(`${API_BASE}/api/health`);
    return await response.json();
  },

  // Tests
  async runTests(testIds = null, async = false) {
    const response = await fetch(`${API_BASE}/api/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testIds, async })
    });
    return await response.json();
  },

  async getTestSession(sessionId) {
    const response = await fetch(`${API_BASE}/api/tests/session/${sessionId}`);
    return await response.json();
  },

  // Cursor Sessions
  async startCursorSession(data) {
    const response = await fetch(`${API_BASE}/api/cursor/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  async listCursorSessions(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/api/cursor/sessions?${params}`);
    return await response.json();
  },

  async getCursorSession(id) {
    const response = await fetch(`${API_BASE}/api/cursor/session/${id}`);
    return await response.json();
  },

  async logCursorEvent(data) {
    const response = await fetch(`${API_BASE}/api/cursor/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  // RPC
  async rpc(method, params = {}) {
    const response = await fetch(`${API_BASE}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });
    return await response.json();
  }
};

// UI Utilities
const UI = {
  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      `;
    }
  },

  showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = `
        <div class="card" style="border-color: var(--error);">
          <p style="color: var(--error);">Error: ${message}</p>
        </div>
      `;
    }
  },

  formatDuration(ms) {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  },

  formatTimestamp(iso) {
    if (!iso) return 'N/A';
    const date = new Date(iso);
    return date.toLocaleString();
  },

  renderMetrics(metrics, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = Object.entries(metrics).map(([key, value]) => `
      <div class="metric">
        <div class="metric-value">${value}</div>
        <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
      </div>
    `).join('');
  },

  renderHealthStatus(status) {
    const statusClass = status === 'healthy' ? 'healthy' :
                       status === 'degraded' ? 'degraded' : 'unhealthy';
    return `<div class="health-status ${statusClass}">
      <span>●</span> ${status.toUpperCase()}
    </div>`;
  },

  renderTestResults(results) {
    return results.map(test => `
      <div class="test-item">
        <div>
          <div class="test-name">${test.testName}</div>
          <div class="test-duration">Duration: ${UI.formatDuration(test.duration)}</div>
          ${test.aiSuggestion ? `<div style="color: var(--info); margin-top: 0.5rem; font-size: 0.875rem;">💡 ${test.aiSuggestion}</div>` : ''}
        </div>
        <div class="test-badge ${test.status}">${test.status.toUpperCase()}</div>
      </div>
    `).join('');
  },

  renderSessionTable(sessions) {
    if (sessions.length === 0) {
      return '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No sessions found</p>';
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Project</th>
            <th>Status</th>
            <th>Events</th>
            <th>Interventions</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          ${sessions.map(session => `
            <tr onclick="window.location.href='/session.html?id=${session.id}'">
              <td><code>${session.id.substring(0, 8)}...</code></td>
              <td>${session.project || 'N/A'}</td>
              <td><span class="status-badge ${session.status}">${session.status}</span></td>
              <td>${session.eventCount || 0}</td>
              <td>${session.interventionCount || 0}</td>
              <td>${UI.formatTimestamp(session.lastSeenAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// Navigation loader
async function loadNavigation() {
  try {
    const response = await fetch('/nav.html');
    const html = await response.text();
    const navContainer = document.getElementById('nav-container');
    if (navContainer) {
      navContainer.innerHTML = html;
    }
  } catch (e) {
    console.error('Failed to load navigation:', e);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNavigation);
} else {
  loadNavigation();
}

// Export global API
window.API = API;
window.UI = UI;
window.WSConnection = WSConnection;
