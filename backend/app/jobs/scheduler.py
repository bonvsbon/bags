"""APScheduler wiring (§6). In-process; opt-in via ENABLE_SCHEDULER."""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session

from app.db import engine
from app.jobs import tasks

log = logging.getLogger("ngern-thon.jobs")
scheduler = BackgroundScheduler(timezone="Asia/Bangkok")


def _run(task) -> None:
    try:
        with Session(engine) as session:
            n = task(session)
        log.info("job %s -> %s", task.__name__, n)
    except Exception:  # never let a job crash the scheduler thread
        log.exception("job %s failed", task.__name__)


def start() -> None:
    scheduler.add_job(lambda: _run(tasks.run_bill_reminders),
                      CronTrigger(hour=8, minute=0), id="bill_reminders")
    scheduler.add_job(lambda: _run(tasks.run_budget_alerts),
                      CronTrigger(hour=8, minute=0), id="budget_alerts")
    scheduler.add_job(lambda: _run(tasks.run_weekly_summary),
                      CronTrigger(day_of_week="mon", hour=8, minute=0), id="weekly_summary")
    scheduler.add_job(lambda: _run(tasks.run_month_rollover),
                      CronTrigger(day=1, hour=0, minute=5), id="month_rollover")
    scheduler.start()
    log.info("scheduler started with %d jobs", len(scheduler.get_jobs()))


def shutdown() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
