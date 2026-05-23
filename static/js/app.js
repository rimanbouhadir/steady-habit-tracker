// Steady App - Main JavaScript
let habits = [];
let currentView = 'habits';
let selectedIntensity = 0;
let currentEnergy = 7;

// Micro-suggestions for crash cushion
const microSuggestions = {
    1: "Do 5 pushups or a 2-minute stretch",
    2: "Take 10 deep breaths and drink water",
    3: "Set a 5-minute timer - delay the habit",
    4: "Write down 3 priorities for tomorrow"
};

// Initialize
async function init() {
    await loadHabits();
    setupEnergySlider();

    // Check for service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/js/sw.js').catch(console.error);
    }
}

// Load habits from API
async function loadHabits() {
    try {
        const response = await fetch('/api/habits');
        habits = await response.json();
        renderHabits();
    } catch (error) {
        console.error('Error loading habits:', error);
        document.getElementById('habitsGrid').innerHTML = '<p style="text-align:center;color:var(--text-muted)">Failed to load. Refresh to try again.</p>';
    }
}

// Render habits grid
function renderHabits() {
    const grid = document.getElementById('habitsGrid');

    if (habits.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted)">No habits yet. Add some!</p>';
        return;
    }

    grid.innerHTML = habits.map((habit, index) => {
        const stats = habit.stats || {};
        const lastLog = habit.last_log;
        const phaseLabel = habit.phase === 1 ? '🔍 Mapping Phase' : '🔥 Active Phase';
        const freezeBadge = stats.freeze_active ? '<span class="freeze-badge">❄️ Freeze Active</span>' : '';

        let lastText = 'Never logged';
        if (lastLog) {
            const date = new Date(lastLog.date);
            const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
            lastText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
        }

        // Phase 1 buttons (trigger logging)
        const phase1Buttons = `
            <button class="btn btn-trigger" onclick="openTriggerModal(${habit.id})">
                📝 Log Trigger
            </button>
            <button class="btn btn-phase" onclick="switchPhase(${habit.id}, 2)">
                Switch to Phase 2 (${habit.trigger_count}/14 triggers)
            </button>
        `;

        // Phase 2 buttons (streak tracking)
        const phase2Buttons = `
            <button class="btn btn-complete" onclick="openLogModal(${habit.id}, 'complete')">
                ✅ Done
            </button>
            <button class="btn btn-partial" onclick="openLogModal(${habit.id}, 'partial')">
                🔄 Partial
            </button>
            <button class="btn btn-break" onclick="openLogModal(${habit.id}, 'break')">
                ❌ Break
            </button>
            <button class="btn btn-trigger" onclick="openTriggerModal(${habit.id})">
                📝 Trigger
            </button>
        `;

        return `
            <div class="habit-card phase-${habit.phase}" style="animation-delay: ${index * 0.1}s">
                <div class="habit-header">
                    <div class="habit-icon" style="background: ${habit.color}20; color: ${habit.color}">
                        ${getIcon(habit.icon)}
                    </div>
                    <div class="habit-title">
                        <h3>${habit.name}</h3>
                        <span class="phase-badge">${phaseLabel}</span>
                    </div>
                    ${freezeBadge}
                </div>

                <div class="streak-display">
                    <span class="streak-flame">${stats.current_streak > 0 ? '🔥' : '⚪'}</span>
                    <span class="streak-number">${stats.current_streak || 0}</span>
                    <span class="streak-label">day streak<br><small>Last: ${lastText}</small></span>
                </div>

                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-value">${stats.longest_streak || 0}</span>
                        <span>Best</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_completes || 0}</span>
                        <span>Done</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_partials || 0}</span>
                        <span>Partial</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${stats.total_breaks || 0}</span>
                        <span>Breaks</span>
                    </div>
                </div>

                <div class="action-buttons">
                    ${habit.phase === 1 ? phase1Buttons : phase2Buttons}
                </div>

                ${habit.phase === 2 ? `
                <div class="pattern-section">
                    <small style="color: var(--text-muted)">Click Patterns tab for detailed view</small>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getIcon(iconName) {
    const icons = {
        'muscle': '💪',
        'ban': '🚭',
        'lock': '🔒',
        'bullseye': '🎯',
        'fire': '🔥'
    };
    return icons[iconName] || '🔥';
}

// Energy slider setup
function setupEnergySlider() {
    const slider = document.getElementById('energySlider');
    const value = document.getElementById('energyValue');
    const cushion = document.getElementById('cushionBox');
    const cushionText = document.getElementById('cushionText');

    slider.addEventListener('input', (e) => {
        currentEnergy = parseInt(e.target.value);
        value.textContent = currentEnergy;

        if (currentEnergy <= 4) {
            cushion.style.display = 'block';
            // Pick random micro suggestion
            const keys = Object.keys(microSuggestions);
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            cushionText.textContent = microSuggestions[randomKey];
        } else {
            cushion.style.display = 'none';
        }
    });
}

// Log energy
async function logEnergy() {
    try {
        await fetch('/api/energy', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                level: currentEnergy,
                note: document.getElementById('logNote')?.value || ''
            })
        });

        // Visual feedback
        const btn = event.target;
        btn.textContent = '✓ Logged';
        setTimeout(() => btn.textContent = 'Log', 1500);
    } catch (error) {
        console.error('Error logging energy:', error);
    }
}

// Apply crash cushion (log partial)
async function applyCushion() {
    // Log partial for all active habits
    for (const habit of habits) {
        if (habit.phase === 2) {
            await fetch('/api/log', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    habit_id: habit.id,
                    log_type: 'partial',
                    energy_level: currentEnergy,
                    note: 'Micro-version via Crash Cushion'
                })
            });
        }
    }

    alert('✅ Micro-versions logged! Your streaks are safe.');
    await loadHabits();
    document.getElementById('cushionBox').style.display = 'none';
}

// Modal functions
function openLogModal(habitId, defaultType) {
    document.getElementById('logHabitId').value = habitId;
    document.getElementById('logNote').value = '';
    document.getElementById('logModal').classList.add('active');
}

function openTriggerModal(habitId) {
    document.getElementById('triggerHabitId').value = habitId;
    document.getElementById('triggerEvent').value = '';
    document.getElementById('triggerMood').value = '';
    document.getElementById('triggerLocation').value = '';
    document.getElementById('triggerCoping').value = '';
    selectedIntensity = 0;
    document.querySelectorAll('.intensity-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('triggerModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function selectIntensity(value) {
    selectedIntensity = value;
    document.querySelectorAll('.intensity-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.value) === value);
    });
}

// Submit log
async function submitLog(type) {
    const habitId = document.getElementById('logHabitId').value;
    const note = document.getElementById('logNote').value;

    try {
        await fetch('/api/log', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                habit_id: parseInt(habitId),
                log_type: type,
                energy_level: currentEnergy,
                note: note
            })
        });

        closeModal('logModal');
        await loadHabits();

        // Show success
        const messages = {
            'complete': '✅ Great job! Streak continues!',
            'partial': '🔄 Partial counts! Streak safe.',
            'break': '💙 Break logged. Streak frozen for 7 days.'
        };

        // Simple toast
        showToast(messages[type]);
    } catch (error) {
        console.error('Error logging:', error);
        alert('Failed to log. Try again.');
    }
}

// Submit trigger
async function submitTrigger() {
    const habitId = document.getElementById('triggerHabitId').value;
    const event = document.getElementById('triggerEvent').value;
    const mood = document.getElementById('triggerMood').value;
    const location = document.getElementById('triggerLocation').value;
    const coping = document.getElementById('triggerCoping').value;

    if (!event) {
        alert('Please describe what happened');
        return;
    }

    try {
        await fetch('/api/trigger', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                habit_id: parseInt(habitId),
                trigger_event: event,
                mood: mood,
                location: location,
                intensity: selectedIntensity,
                coping_used: coping
            })
        });

        closeModal('triggerModal');
        await loadHabits();
        showToast('📝 Trigger logged. You're building awareness.');
    } catch (error) {
        console.error('Error logging trigger:', error);
    }
}

// Switch phase
async function switchPhase(habitId, phase) {
    if (phase === 2) {
        const habit = habits.find(h => h.id === habitId);
        if (habit && habit.trigger_count < 14) {
            if (!confirm(`You have ${habit.trigger_count} triggers logged. 14+ recommended before Phase 2. Continue anyway?`)) {
                return;
            }
        }
    }

    try {
        await fetch('/api/update-phase', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({habit_id: habitId, phase: phase})
        });

        await loadHabits();
        showToast(phase === 2 ? '🔥 Phase 2 activated! Streak tracking begins.' : '🔍 Back to mapping phase.');
    } catch (error) {
        console.error('Error updating phase:', error);
    }
}

// View switching
function showView(view) {
    currentView = view;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Hide all views
    document.getElementById('habitsGrid').style.display = 'none';
    document.getElementById('patternsView').style.display = 'none';
    document.getElementById('triggersView').style.display = 'none';

    // Show selected view
    if (view === 'habits') {
        document.getElementById('habitsGrid').style.display = 'grid';
    } else if (view === 'patterns') {
        document.getElementById('patternsView').style.display = 'block';
        loadPatterns();
    } else if (view === 'triggers') {
        document.getElementById('triggersView').style.display = 'block';
        loadTriggersList();
    }
}

// Load patterns
async function loadPatterns() {
    const content = document.getElementById('patternsContent');
    content.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Loading patterns...</p>';

    let html = '';

    for (const habit of habits) {
        try {
            const response = await fetch(`/api/pattern/${habit.id}`);
            const data = await response.json();

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const breakCounts = data.breaks_by_day || {};

            html += `
                <div class="habit-card" style="margin-bottom: 15px;">
                    <h3 style="color: ${habit.color}; margin-bottom: 15px;">
                        ${getIcon(habit.icon)} ${habit.name}
                    </h3>
                    <div style="margin-bottom: 10px;">
                        <strong>Breaks by Day:</strong>
                    </div>
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        ${days.map((day, i) => `
                            <div style="text-align: center; flex: 1;">
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px;">${day}</div>
                                <div style="
                                    width: 40px; height: 40px; 
                                    border-radius: 10px; 
                                    display: flex; align-items: center; justify-content: center;
                                    background: ${breakCounts[i] ? `rgba(255, 107, 107, ${Math.min(breakCounts[i] * 0.3, 1)})` : 'var(--bg-light)'};
                                    color: ${breakCounts[i] ? 'white' : 'var(--text-muted)'};
                                    font-weight: bold;
                                    font-size: 0.9rem;
                                    margin: 0 auto;
                                ">${breakCounts[i] || 0}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ${Object.entries(breakCounts).length > 0 
                            ? `Most breaks on: ${days[Object.entries(breakCounts).sort((a,b) => b[1]-a[1])[0][0]]}` 
                            : 'No break data yet. Keep logging!'}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading pattern:', error);
        }
    }

    content.innerHTML = html || '<p style="text-align:center;color:var(--text-muted)">No data yet. Start logging!</p>';
}

// Load triggers list
async function loadTriggersList() {
    const content = document.getElementById('triggersContent');
    content.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Loading triggers...</p>';

    let html = '';

    for (const habit of habits) {
        if (habit.phase === 1 || habit.trigger_count > 0) {
            try {
                const response = await fetch(`/api/triggers/${habit.id}`);
                const triggers = await response.json();

                html += `
                    <div class="habit-card" style="margin-bottom: 15px;">
                        <h3 style="color: ${habit.color}; margin-bottom: 15px;">
                            ${getIcon(habit.icon)} ${habit.name} 
                            <span style="font-size: 0.8rem; color: var(--text-muted);">(${triggers.length} logged)</span>
                        </h3>
                `;

                if (triggers.length === 0) {
                    html += '<p style="color: var(--text-muted); font-size: 0.9rem;">No triggers logged yet. Tap "Log Trigger" to start mapping.</p>';
                } else {
                    html += triggers.slice(0, 5).map(t => `
                        <div style="
                            background: var(--bg-light); 
                            padding: 12px; 
                            border-radius: 10px; 
                            margin-bottom: 8px;
                            border-left: 3px solid ${habit.color};
                        ">
                            <div style="font-weight: bold; margin-bottom: 5px;">${t.trigger_event}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">
                                ${t.mood ? `Mood: ${t.mood}` : ''} 
                                ${t.location ? `| ${t.location}` : ''}
                                ${t.intensity ? `| Intensity: ${t.intensity}/5` : ''}
                            </div>
                            ${t.coping_used ? `<div style="font-size: 0.8rem; color: var(--success); margin-top: 5px;">✓ Coping: ${t.coping_used}</div>` : ''}
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;">
                                ${new Date(t.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    `).join('');
                }

                html += '</div>';
            } catch (error) {
                console.error('Error loading triggers:', error);
            }
        }
    }

    content.innerHTML = html || '<p style="text-align:center;color:var(--text-muted)">No trigger data yet.</p>';
}

// Export data
async function exportData() {
    try {
        const response = await fetch('/api/export');
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `steady_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('💾 Data exported! Keep this file safe.');
    } catch (error) {
        console.error('Error exporting:', error);
        alert('Export failed. Try again.');
    }
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-card);
        color: var(--text);
        padding: 15px 25px;
        border-radius: 15px;
        border: 2px solid var(--accent);
        z-index: 2000;
        font-weight: bold;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// Initialize on load
init();
