# 🔥 Steady - Your Personal Habit & Motivation System

> **Track progress, not perfection.**
> Built specifically for brains that work in bursts, hate zeroing out, and need visual feedback.

---

## What Makes This Different

| Typical App | Steady |
|---|---|
| Break = Streak reset to 0 | Break = Logged, streak continues (Duolingo-style freeze) |
| Binary pass/fail | Complete / Partial / Break - all valid |
| Nagging notifications | Visual dashboard you check when YOU want |
| One-size-fits-all | Phase-based: Map triggers first, then track abstinence |
| Shame on missed days | "Oh, I DID do 12 things this month" energy |

---

## Features

### 🎯 4 Pre-configured Habits
1. **Gym / Movement** - Gradient goals (any movement counts)
2. **No Smoking** - Phase 1 trigger mapping, then Phase 2 streak tracking
3. **Personal Habit** - Your private habit, same phase system
4. **Daily Focus** - Work/productivity tracking

### ❄️ The "Freeze" System (No Zeroing Out!)
- Break logged → Streak frozen for 7 days
- Log again within 7 days → Streak continues
- Break again within 7 days → Streak actually ends
- You always see: Current streak + Longest streak + Total breaks

### ⚡ Crash Cushion (Low Energy Mode)
- Energy slider (1-10) at top of app
- Below 4? App suggests micro-versions:
  - Gym → 5 pushups or 2-min stretch
  - Smoking → 10 deep breaths
  - Habit → 5-minute delay timer
  - Focus → Write 3 priorities
- Log as "Partial" - streak stays alive

### 🔍 Phase-Based Tracking
**Phase 1: Mapping (First 2 weeks)**
- Log triggers: What happened? Where? Mood? Intensity?
- No streak pressure - just awareness
- After 14 triggers, system suggests Phase 2

**Phase 2: Active Tracking**
- Streak begins
- Still log triggers when they hit
- Full dashboard active

### 📊 Pattern Recognition
- Heatmap: Which days you typically break
- Break count by day of week
- Energy level correlation (coming in v2)

### 💾 Data Ownership
- Everything stored locally in SQLite
- One-click JSON export for backup
- No accounts, no cloud, no subscriptions

---

## Installation

### Requirements
- Python 3.7+
- pip (Python package manager)

### Step 1: Install Dependencies
```bash
pip install flask
```

### Step 2: Run the App
```bash
cd steady_app
python app.py
```

### Step 3: Open in Browser
- Go to: `http://localhost:5000`
- On phone: Find your computer's IP (e.g., `192.168.1.5:5000`)

### Step 4: Add to Home Screen (Phone)
**iPhone:**
1. Open Safari, go to the app URL
2. Tap Share button (square with arrow)
3. Scroll down, tap "Add to Home Screen"
4. Name it "Steady" → Add

**Android:**
1. Open Chrome, go to the app URL
2. Tap menu (3 dots) → "Add to Home screen"
3. Name it "Steady" → Add

Now it works like a native app! 📱

---

## How to Use Daily

### Morning (2 minutes)
1. Open app
2. Set energy slider (how you feel right now)
3. Tap habits you plan to do today

### Throughout Day
- Did the habit? Tap ✅ Done
- Did a little? Tap 🔄 Partial
- Slipped? Tap ❌ Break (no shame, just data)
- Felt triggered? Tap 📝 Log Trigger

### Evening (1 minute)
- Check your streaks
- Look at patterns tab (if curious)
- Adjust energy log if needed

---

## The "Streak Rules" Explained

```
Day 1: ✅ Complete → Streak: 1
Day 2: ✅ Complete → Streak: 2
Day 3: ❌ Break → Streak: 2 (frozen)
Day 4: ✅ Complete → Streak: 3 (unfrozen!)
Day 5: ❌ Break → Streak: 3 (frozen)
Day 6: ❌ Break → Streak: 0 (double break in freeze window)
```

**Key insight:** You have 7 days after a break to "save" your streak. This removes the "all or nothing" panic.

---

## Customization

### Change Habit Names
Edit `app.py`, find the `default_habits` list:
```python
default_habits = [
    (1, 'Gym / Movement', 'muscle', '#4ECDC4', 2),
    (2, 'No Smoking', 'ban', '#FF6B6B', 1),
    (3, 'Personal Habit', 'lock', '#95E1D3', 1),
    (4, 'Daily Focus', 'bullseye', '#F7DC6F', 2)
]
```

Format: `(id, 'Name', 'icon_name', 'color_hex', phase)`

### Available Icons
- `muscle` → 💪
- `ban` → 🚭
- `lock` → 🔒
- `bullseye` → 🎯
- `fire` → 🔥

### Change Colors
Any hex color works: `#FF6B6B` (red), `#4ECDC4` (teal), etc.

---

## Data Backup

Your data lives in `steady.db` (SQLite file) in the app folder.

**To backup:**
1. In app: Tap "Export" in bottom nav → Downloads JSON file
2. Or: Copy `steady.db` file to safe location

**To restore:**
- Replace `steady.db` with your backup

---

## Troubleshooting

| Problem | Solution |
|---|---|
| App won't start | Check Python 3.7+ installed: `python --version` |
| Port 5000 in use | Edit `app.py`, change `port=5000` to `port=8080` |
| Can't access from phone | Make sure phone and computer are on same WiFi |
| Data disappeared | Check if `steady.db` file exists in app folder |
| Icons not showing | Refresh page or clear browser cache |

---

## Philosophy Behind Steady

This app was built on these beliefs:

1. **Your brain is not broken** - It works differently, not worse
2. **Shame is the enemy of change** - Breaks are data, not failures
3. **Momentum > Perfection** - Partial counts. Showing up counts.
4. **Awareness precedes control** - Map triggers before fighting them
5. **Energy is finite** - Work WITH your cycles, not against them

---

## Future Ideas (If You Want)

- Weekly email summary
- Integration with Apple Health / Google Fit
- Custom micro-suggestions per habit
- Friend accountability (optional)
- Medication tracking
- Sleep correlation

---

## About ADHD

If you're self-discovering ADHD patterns, consider:
- **Professional assessment** - Can provide clarity and access to strategies/medication
- **"Driven to Distraction"** by Hallowell & Ratey (book)
- **How to ADHD** (YouTube channel)
- **Body doubling** - Working alongside others (virtually or in person)

This app supports you. It doesn't replace professional help.

---

Built with 💙 for brains that rush, crash, and try again.
