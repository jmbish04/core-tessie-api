// Core Tessie API Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tessie API Dashboard loaded');

    // Add interactive functionality here
    // For example: API testing, token validation, etc.

    // Example: Add click handlers for endpoint cards
    const endpoints = document.querySelectorAll('.endpoint');
    endpoints.forEach(endpoint => {
        endpoint.addEventListener('click', () => {
            const code = endpoint.querySelector('code');
            if (code) {
                // Copy endpoint to clipboard
                const text = code.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    // Visual feedback
                    const originalBorder = endpoint.style.borderLeftColor;
                    endpoint.style.borderLeftColor = '#4caf50';
                    setTimeout(() => {
                        endpoint.style.borderLeftColor = originalBorder;
                    }, 500);
                });
            }
        });
    });
});

// Utility function to make authenticated API requests
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        console.error('No JWT token found. Please authenticate first.');
        return null;
    }

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        return null;
    }
}

// Export for potential use in browser console
window.tessieAPI = {
    makeAuthenticatedRequest
};
