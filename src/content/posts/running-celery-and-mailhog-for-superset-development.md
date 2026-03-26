---
title: "Running Celery and MailHog for Apache Superset Development"
published: 2026-03-26
description: "A step-by-step guide to setting up Celery workers, Celery Beat, and MailHog for testing Alerts & Reports in Apache Superset locally."
author: "Mehmet Salih Yavuz"
tags: ["superset", "apache", "celery", "mailhog", "development"]
toc: true
---

# Running Celery and MailHog for Apache Superset Development

If you're working on Apache Superset's **Alerts & Reports** feature, you'll quickly discover that it depends on several background services: a Celery worker to execute tasks, Celery Beat to schedule them, a message broker (Redis), and an SMTP server to deliver email notifications.

Setting all of this up locally can be surprisingly tricky. This post walks through every step so you can go from zero to receiving test report emails in your inbox.

---

## Prerequisites

Before starting, make sure you have:

- A working **Superset development environment** (Flask dev server running on port 8088 or frontend dev server on port 9000)
- **Redis** installed and running on `localhost:6379`
- **Python virtual environment** with Superset's dependencies installed

---

## Step 1: Install and Start Redis

Redis serves as the message broker between Celery Beat (the scheduler) and Celery workers.

```bash
# Fedora
sudo dnf install redis
sudo systemctl start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

Verify it's running:

```bash
redis-cli ping
# Should return: PONG
```

---

## Step 2: Install and Start MailHog

[MailHog](https://github.com/mailhog/MailHog) is a local SMTP server that catches all outgoing emails and displays them in a web UI. No emails actually leave your machine.

```bash
# Install via Go
go install github.com/mailhog/MailHog@latest

# Or download the binary directly from GitHub releases
# https://github.com/mailhog/MailHog/releases
```

Start it:

```bash
MailHog
```

MailHog listens on:
- **SMTP**: `localhost:1025`
- **Web UI**: `http://localhost:8025`

Open `http://localhost:8025` in your browser -- this is where your test emails will appear.

---

## Step 3: Configure `superset_config.py`

Your `superset_config.py` needs three things: Celery configuration, SMTP settings pointing to MailHog, and the Alerts & Reports feature flag.

### Celery Configuration

The most common pitfall is defining a custom `CeleryConfig` class that **replaces** the default one entirely. If you forget to include `beat_schedule`, Celery Beat will start but never schedule any tasks.

```python
from celery.schedules import crontab
from superset.tasks.types import ExecutorType

REDIS_HOST = "localhost"
REDIS_PORT = "6379"

class CeleryConfig:
    broker_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    result_backend = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    broker_connection_retry_on_startup = True
    imports = (
        "superset.sql_lab",
        "superset.tasks.scheduler",
        "superset.tasks.thumbnails",
        "superset.tasks.cache",
    )
    worker_prefetch_multiplier = 10
    task_acks_late = True
    beat_schedule = {
        "reports.scheduler": {
            "task": "reports.scheduler",
            "schedule": crontab(minute="*", hour="*"),
        },
        "reports.prune_log": {
            "task": "reports.prune_log",
            "schedule": crontab(minute=0, hour=0),
        },
    }

CELERY_CONFIG = CeleryConfig
```

> **Important**: The `beat_schedule` block is critical. Without it, Celery Beat will run silently and never trigger any reports.

### SMTP Settings (MailHog)

```python
SMTP_HOST = "localhost"
SMTP_PORT = 1025
SMTP_STARTTLS = False
SMTP_SSL = False
SMTP_USER = ""
SMTP_PASSWORD = ""
SMTP_MAIL_FROM = "superset@localhost"
```

### Feature Flags

```python
FEATURE_FLAGS = {
    "ALERT_REPORTS": True,
    # Optional: enable if you want to use dashboard tab selection in reports
    # "ALERT_REPORT_TABS": True,
    # Optional: enable if you want to use dashboard filter selection in reports
    # "ALERT_REPORTS_FILTER": True,
}
```

### Report Executor

```python
ALERT_REPORTS_EXECUTE_AS = [ExecutorType.OWNER]
```

---

## Step 4: Start Celery Beat and Worker

You need **two separate terminal sessions** (or background processes) -- one for Beat (the scheduler) and one for the Worker (the executor).

**Terminal 1 -- Celery Beat** (schedules tasks every minute):

```bash
celery --app=superset.tasks.celery_app:app beat --loglevel=info
```

**Terminal 2 -- Celery Worker** (executes the tasks):

```bash
celery --app=superset.tasks.celery_app:app worker --concurrency=1 --loglevel=info
```

> **Tip**: Use `--concurrency=1` to keep resource usage low on your dev machine. The default spawns one worker process per CPU core, which can be heavy.

### What to Look For

In the **Beat** terminal, you should see a line like this once per minute:

```
Scheduler: Sending due task reports.scheduler (reports.scheduler)
```

In the **Worker** terminal, you should see:

```
Scheduling alert <your report name> eta: <timestamp>
```

If Beat shows nothing, check that your `CeleryConfig` includes `beat_schedule`. If the Worker shows nothing, make sure the `ALERT_REPORTS` feature flag is enabled.

---

## Step 5: Create a Test Report

1. Go to **Settings > Alerts & Reports** in Superset
2. Click **+ Report**
3. Configure:
   - **Name**: anything (e.g., "Test Report")
   - **Type**: Report
   - **Dashboard**: pick any dashboard
   - **Schedule**: `* * * * *` (every minute, for testing)
   - **Notification method**: Email
   - **Recipients**: any email address (MailHog catches everything)
4. Save

---

## Step 6: Check MailHog

Within 1-2 minutes, you should see emails appearing at `http://localhost:8025`. Each email contains a screenshot of the dashboard as a PNG attachment.

---

## Troubleshooting

### "Report Schedule is still working, refusing to re-compute"

Previous executions got stuck in a "Working" state. Reset them directly in the database:

```sql
UPDATE report_schedule SET last_state = 'Not triggered' WHERE id = <your_report_id>;
```

If there's a large backlog of stale tasks in Redis, flush it:

```bash
redis-cli FLUSHDB
```

Then restart both Beat and Worker.

### Celery Worker Crashes with "Working outside of application context"

If your `CeleryConfig.imports` includes `"superset.tasks.async_queries"`, the worker will fail at startup because that module accesses `current_app.config` at import time. Comment it out unless you need Global Async Queries:

```python
imports = (
    "superset.sql_lab",
    "superset.tasks.scheduler",
    "superset.tasks.thumbnails",
    "superset.tasks.cache",
    # "superset.tasks.async_queries",  # Uncomment only if GAQ is needed
)
```

### Reports Execute but No Emails Arrive

- Verify MailHog is running: `curl http://localhost:8025`
- Check that `SMTP_HOST` and `SMTP_PORT` in `superset_config.py` match MailHog's defaults (`localhost:1025`)
- Check the Celery Worker logs for errors during the `send()` phase

### Selenium/Playwright Screenshot Timeout

The worker takes a screenshot of the dashboard by opening it in a headless browser. If your frontend dev server isn't running, or is running on a different port than `WEBDRIVER_BASEURL`, the screenshot will time out.

```python
# Must match where your frontend is actually running
WEBDRIVER_BASEURL = "http://localhost:9000/"
```

For better screenshot support (especially for WebGL charts), install Playwright:

```bash
pip install playwright
playwright install chromium
```

And enable the feature flag:

```python
FEATURE_FLAGS = {
    "PLAYWRIGHT_REPORTS_AND_THUMBNAILS": True,
    # ...
}
```

---

## Summary

The full setup requires four running processes:

| Process | Command | Purpose |
|---|---|---|
| Superset | `superset run` or `npm run dev` | The web app |
| Redis | `redis-server` | Message broker |
| Celery Beat | `celery ... beat --loglevel=info` | Schedules report tasks |
| Celery Worker | `celery ... worker --concurrency=1 --loglevel=info` | Executes report tasks |

Plus MailHog (`MailHog`) to catch and view emails locally.

Once everything is running, the flow is: **Beat** triggers `reports.scheduler` every minute, which queries the database for active reports, and dispatches `reports.execute` tasks to the **Worker**. The Worker takes a screenshot of the dashboard, and sends the result via SMTP to **MailHog**, where you can view it in the browser.
