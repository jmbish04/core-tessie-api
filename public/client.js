document.addEventListener('DOMContentLoaded', () => {
    // Shared functionality: Load navigation
    const navContainer = document.getElementById('nav-container');
    if (navContainer) {
        fetch('/nav.html')
            .then(response => response.text())
            .then(data => {
                navContainer.innerHTML = data;
            });
    }

    // --- Index page specific logic ---
    if (document.querySelector('.animate-on-scroll')) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    // --- Health page specific logic ---
    const runTestsBtn = document.getElementById('run-tests-btn');
    const testDefsContainer = document.getElementById('test-defs-container');
    const resultsTbody = document.getElementById('results-tbody');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    if (runTestsBtn && testDefsContainer && resultsTbody) {
        // Fetch and display test definitions
        const loadTestDefinitions = async () => {
            try {
                const response = await fetch('/api/tests/defs');
                const data = await response.json();
                testDefsContainer.innerHTML = ''; // Clear skeleton loaders
                if (data.defs && data.defs.length > 0) {
                    data.defs.forEach(def => {
                        const card = document.createElement('div');
                        card.className = 'bg-slate-800 p-6 rounded-xl border border-slate-700';
                        card.innerHTML = `
                            <h3 class="text-xl font-bold text-white mb-2">${def.name}</h3>
                            <p class="text-slate-400 text-sm">${def.description}</p>
                            <div class="mt-4">
                                <span class="inline-block bg-slate-700 text-slate-300 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${def.category}</span>
                                <span class="inline-block bg-yellow-900/50 text-yellow-300 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${def.severity}</span>
                            </div>
                        `;
                        testDefsContainer.appendChild(card);
                    });
                } else {
                    testDefsContainer.innerHTML = `<p class="text-slate-400 col-span-full">No active test definitions found.</p>`;
                }
            } catch (error) {
                console.error('Failed to load test definitions:', error);
                testDefsContainer.innerHTML = `<p class="text-red-400 col-span-full">Error loading test definitions.</p>`;
            }
        };

        // Fetch and display latest results
        const loadLatestResults = async () => {
            try {
                const response = await fetch('/api/tests/latest');
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    renderResults(data.results);
                }
            } catch (error) {
                console.error('Failed to load latest results:', error);
            }
        };

        const renderResults = (results) => {
            resultsTbody.innerHTML = '';
            results.forEach(result => {
                const row = document.createElement('tr');
                const statusBadge = result.status === 'pass'
                    ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/50 text-green-300">Pass</span>`
                    : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900/50 text-red-300">Fail</span>`;

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${result.test_def.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${statusBadge}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">${result.duration_ms}ms</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        ${result.status === 'fail' ? (result.ai_human_readable_error_description || result.error_code) : 'OK'}
                    </td>
                `;
                resultsTbody.appendChild(row);
            });
        };

        const pollForSessionResults = async (sessionId) => {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/tests/session/${sessionId}`);
                    const data = await response.json();

                    if (data.results) {
                        renderResults(data.results);
                    }

                    // Stop polling if all tests are finished
                    const isFinished = data.results && data.results.every(r => r.finished_at);
                    if (isFinished) {
                        clearInterval(interval);
                        setButtonState('idle');
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                    clearInterval(interval);
                    setButtonState('idle');
                }
            }, 2000); // Poll every 2 seconds
        };

        const setButtonState = (state) => {
            if (state === 'running') {
                runTestsBtn.disabled = true;
                btnText.classList.add('hidden');
                btnSpinner.classList.remove('hidden');
            } else { // idle
                runTestsBtn.disabled = false;
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
            }
        };

        // Run tests on button click
        runTestsBtn.addEventListener('click', async () => {
            setButtonState('running');
            resultsTbody.innerHTML = `<tr><td colspan="4" class="text-center p-4">Starting test session...</td></tr>`;

            try {
                const response = await fetch('/api/tests/run', { method: 'POST' });
                const data = await response.json();
                if (data.session_uuid) {
                    resultsTbody.innerHTML = `<tr><td colspan="4" class="text-center p-4">Test session <strong>${data.session_uuid}</strong> is running. Waiting for results...</td></tr>`;
                    pollForSessionResults(data.session_uuid);
                } else {
                   throw new Error("Failed to start test session.");
                }
            } catch (error) {
                console.error('Error running tests:', error);
                resultsTbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-red-400">Error: ${error.message}</td></tr>`;
                setButtonState('idle');
            }
        });

        // Initial load
        loadTestDefinitions();
        loadLatestResults();
    }
});
