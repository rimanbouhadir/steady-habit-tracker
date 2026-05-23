from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime, timedelta
import os
from collections import defaultdict

app = Flask(__name__)

# Use absolute path for database (works on both local and cloud)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'steady.db')

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon TEXT DEFAULT 'fire', color TEXT DEFAULT '#FF6B35', phase INTEGER DEFAULT 2, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    c.execute("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY, habit_id INTEGER, log_type TEXT DEFAULT 'complete', energy_level INTEGER, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (habit_id) REFERENCES habits (id))")
    c.execute("CREATE TABLE IF NOT EXISTS triggers (id INTEGER PRIMARY KEY, habit_id INTEGER, mood TEXT, location TEXT, trigger_event TEXT, intensity INTEGER, coping_used TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (habit_id) REFERENCES habits (id))")
    c.execute("CREATE TABLE IF NOT EXISTS energy_logs (id INTEGER PRIMARY KEY, level INTEGER, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")

    c.execute("SELECT COUNT(*) FROM habits")
    if c.fetchone()[0] == 0:
        default_habits = [
            (1, 'Gym / Movement', 'muscle', '#4ECDC4', 2),
            (2, 'No Smoking', 'ban', '#FF6B6B', 1),
            (3, 'Personal Habit', 'lock', '#95E1D3', 1),
            (4, 'Daily Focus', 'bullseye', '#F7DC6F', 2)
        ]
        c.executemany("INSERT INTO habits (id, name, icon, color, phase) VALUES (?, ?, ?, ?, ?)", default_habits)

    conn.commit()
    conn.close()

init_db()

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/habits')
def get_habits():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM habits")
    habits = [dict(row) for row in c.fetchall()]
    for habit in habits:
        habit['stats'] = calculate_streak_stats(habit['id'])
        habit['last_log'] = get_last_log(habit['id'])
        habit['trigger_count'] = get_trigger_count(habit['id'])
    conn.close()
    return jsonify(habits)

def get_last_log(habit_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT created_at, log_type FROM logs WHERE habit_id = ? ORDER BY created_at DESC LIMIT 1", (habit_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return {'date': row['created_at'], 'type': row['log_type']}
    return None

def get_trigger_count(habit_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM triggers WHERE habit_id = ?", (habit_id,))
    count = c.fetchone()[0]
    conn.close()
    return count

def calculate_streak_stats(habit_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT created_at, log_type FROM logs WHERE habit_id = ? AND log_type IN ("complete", "partial", "break") ORDER BY created_at ASC', (habit_id,))
    logs = c.fetchall()
    conn.close()

    if not logs:
        return {'current_streak': 0, 'longest_streak': 0, 'total_breaks': 0, 'total_completes': 0, 'total_partials': 0, 'freeze_active': False, 'days_since_last': None, 'today_logged': False, 'last_activity': None}

    date_logs = defaultdict(list)
    for log in logs:
        date_str = log['created_at'][:10]
        date_logs[date_str].append(log['log_type'])

    sorted_dates = sorted(date_logs.keys())
    total_breaks = 0
    total_completes = 0
    total_partials = 0

    for date in sorted_dates:
        types = date_logs[date]
        if 'break' in types: total_breaks += 1
        if 'complete' in types: total_completes += 1
        if 'partial' in types: total_partials += 1

    today = datetime.now().strftime('%Y-%m-%d')
    last_activity = sorted_dates[-1]
    days_since_last = (datetime.now() - datetime.strptime(last_activity, '%Y-%m-%d')).days

    current_streak = 0
    for date in reversed(sorted_dates):
        if 'break' not in date_logs[date]:
            current_streak += 1
        else:
            break

    today_logged = today in date_logs and 'break' not in date_logs[today]

    longest_streak = 0
    temp = 0
    for date in sorted_dates:
        if 'break' not in date_logs[date]:
            temp += 1
            longest_streak = max(longest_streak, temp)
        else:
            temp = 0

    freeze_active = False
    if total_breaks > 0:
        last_break = None
        for date in reversed(sorted_dates):
            if 'break' in date_logs[date]:
                last_break = date
                break
        if last_break:
            days_since_break = (datetime.now() - datetime.strptime(last_break, '%Y-%m-%d')).days
            freeze_active = days_since_break <= 7

    return {'current_streak': current_streak, 'longest_streak': longest_streak, 'total_breaks': total_breaks, 'total_completes': total_completes, 'total_partials': total_partials, 'freeze_active': freeze_active, 'days_since_last': days_since_last, 'today_logged': today_logged, 'last_activity': last_activity}

@app.route('/api/log', methods=['POST'])
def log_habit():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO logs (habit_id, log_type, energy_level, note) VALUES (?, ?, ?, ?)", (data['habit_id'], data['log_type'], data.get('energy_level'), data.get('note')))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/trigger', methods=['POST'])
def log_trigger():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO triggers (habit_id, mood, location, trigger_event, intensity, coping_used) VALUES (?, ?, ?, ?, ?, ?)", (data['habit_id'], data.get('mood'), data.get('location'), data.get('trigger_event'), data.get('intensity'), data.get('coping_used')))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/energy', methods=['POST'])
def log_energy():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO energy_logs (level, note) VALUES (?, ?)", (data['level'], data.get('note')))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/triggers/<int:habit_id>')
def get_triggers(habit_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM triggers WHERE habit_id = ? ORDER BY created_at DESC LIMIT 50", (habit_id,))
    triggers = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(triggers)

@app.route('/api/pattern/<int:habit_id>')
def get_pattern(habit_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT strftime("%w", created_at) as day_of_week, COUNT(*) as count FROM logs WHERE habit_id = ? AND log_type = "break" GROUP BY day_of_week ORDER BY day_of_week', (habit_id,))
    breaks_by_day = {row['day_of_week']: row['count'] for row in c.fetchall()}
    c.execute("SELECT date(created_at) as date, log_type, energy_level FROM logs WHERE habit_id = ? ORDER BY date DESC LIMIT 90", (habit_id,))
    recent_logs = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify({'breaks_by_day': breaks_by_day, 'recent_logs': recent_logs})

@app.route('/api/export')
def export_data():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM habits")
    habits = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM logs")
    logs = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM triggers")
    triggers = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM energy_logs")
    energy = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify({'export_date': datetime.now().isoformat(), 'habits': habits, 'logs': logs, 'triggers': triggers, 'energy_logs': energy})

@app.route('/api/update-phase', methods=['POST'])
def update_phase():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE habits SET phase = ? WHERE id = ?", (data['phase'], data['habit_id']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
