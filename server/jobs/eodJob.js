/**
 * eodJob.js
 * End-of-day scheduled job using node-cron.
 * Runs nightly at 23:59 to:
 *   1. Generate a daily summary (counts by status)
 *   2. Update In Progress tasks → Not Completed
 *   3. Archive all tasks for the day
 *   4. Delete archived tasks from the active tasks table
 *   5. Send a summary email via Mailtrap
 *
 * Steps 2–7 run inside a single DB transaction.
 * Email is sent AFTER the transaction commits, never inside it.
 * Idempotency check runs BEFORE the transaction begins.
 */

import nodemailer from 'nodemailer';
import cron from 'node-cron';
import pool from '../config/db.js';

// ─────────────────────────────────────────────
// Part A — Nodemailer transporter (Mailtrap)
// ─────────────────────────────────────────────

export const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// ─────────────────────────────────────────────
// Part B — sendSummaryEmail(summary)
// ─────────────────────────────────────────────

export const sendSummaryEmail = async (summary) => {
  const {
    summary_date,
    total_tasks,
    completed_tasks,
    pending_tasks,
    not_completed_tasks,
    completion_percentage,
    eod_executed_at,
  } = summary;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
  <div style="max-width:500px; margin:auto; background:#fff;
              border-radius:8px; padding:24px;">
    <h2 style="color:#1a1a1a; margin-bottom:4px;">
      Daily Task Summary
    </h2>
    <p style="color:#666; margin-top:0;">
      ${summary_date}
    </p>
    <table style="width:100%; border-collapse:collapse; margin-top:16px;">
      <tr style="background:#f8f8f8;">
        <td style="padding:10px 12px; color:#444; font-weight:bold;">
          Total Tasks
        </td>
        <td style="padding:10px 12px; color:#1a1a1a;">
          ${total_tasks}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 12px; color:#444; font-weight:bold;">
          Completed
        </td>
        <td style="padding:10px 12px; color:#16a34a;">
          ${completed_tasks}
        </td>
      </tr>
      <tr style="background:#f8f8f8;">
        <td style="padding:10px 12px; color:#444; font-weight:bold;">
          Pending
        </td>
        <td style="padding:10px 12px; color:#d97706;">
          ${pending_tasks}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 12px; color:#444; font-weight:bold;">
          Not Completed
        </td>
        <td style="padding:10px 12px; color:#dc2626;">
          ${not_completed_tasks}
        </td>
      </tr>
      <tr style="background:#f8f8f8;">
        <td style="padding:10px 12px; color:#444; font-weight:bold;">
          Completion Rate
        </td>
        <td style="padding:10px 12px; color:#1a1a1a; font-weight:bold;">
          ${completion_percentage}%
        </td>
      </tr>
    </table>
    <p style="color:#999; font-size:12px; margin-top:20px;">
      EOD process executed at: ${eod_executed_at}
    </p>
  </div>
</body>
</html>`;

  console.log('[Email] Sending daily summary email...');

  await transporter.sendMail({
    from: process.env.MAILTRAP_FROM,
    to: process.env.NOTIFY_EMAIL,
    subject: `Daily Task Summary — ${summary_date}`,
    html,
  });

  console.log('[Email] Daily summary email sent successfully');
};

// ─────────────────────────────────────────────
// Part C — runEODJob()
// ─────────────────────────────────────────────

export const runEODJob = async () => {
  // STEP 1 — Idempotency check (outside transaction)
  const today = new Date().toISOString().split('T')[0];
  console.log(`[EOD] Starting EOD job for: ${today}`);

  const existing = await pool.query(
    'SELECT id FROM daily_summaries WHERE summary_date = $1',
    [today]
  );

  if (existing.rows.length > 0) {
    console.log('[EOD] EOD already ran for today. Skipping.');
    return;
  }

  // STEP 2 — Begin DB transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('[EOD] Transaction started');

    // STEP 3 — Generate daily summary
    console.log('[EOD] Generating daily summary...');

    const countResult = await client.query(
      `SELECT
        COUNT(*)                                          AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'Completed')     AS completed_tasks,
        COUNT(*) FILTER (WHERE status = 'Pending')       AS pending_tasks,
        COUNT(*) FILTER (WHERE status = 'Not Completed') AS not_completed_tasks
      FROM tasks
      WHERE DATE(created_at AT TIME ZONE 'UTC') = $1`,
      [today]
    );

    const counts = countResult.rows[0];
    const total = parseInt(counts.total_tasks, 10);
    const completed = parseInt(counts.completed_tasks, 10);
    const pending = parseInt(counts.pending_tasks, 10);
    const notCompleted = parseInt(counts.not_completed_tasks, 10);

    const completion_percentage =
      total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00';

    console.log(
      `[EOD] Counts — total: ${total}, completed: ${completed}, pending: ${pending}, notCompleted: ${notCompleted}, rate: ${completion_percentage}%`
    );

    const summaryResult = await client.query(
      `INSERT INTO daily_summaries
        (summary_date, total_tasks, completed_tasks, pending_tasks,
         not_completed_tasks, completion_percentage, eod_executed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [today, total, completed, pending, notCompleted, completion_percentage]
    );

    const summary = summaryResult.rows[0];
    console.log('[EOD] Daily summary inserted, id:', summary.id);

    // STEP 4 — Update In Progress tasks to Not Completed
    const updateResult = await client.query(
      `UPDATE tasks
       SET status = 'Not Completed', updated_at = NOW()
       WHERE status = 'In Progress'
       AND DATE(created_at AT TIME ZONE 'UTC') = $1`,
      [today]
    );

    console.log(
      `[EOD] Updated ${updateResult.rowCount} In Progress task(s) → Not Completed`
    );

    // STEP 5 — Archive all tasks for today
    const archiveResult = await client.query(
      `INSERT INTO archived_tasks
        (original_id, title, description, status,
         created_at, updated_at, archive_date)
       SELECT
         id, title, description, status,
         created_at, updated_at, $1::date
       FROM tasks
       WHERE DATE(created_at AT TIME ZONE 'UTC') = $1`,
      [today]
    );

    console.log(`[EOD] Archived ${archiveResult.rowCount} task(s)`);

    // STEP 6 — Delete archived tasks from active table
    const deleteResult = await client.query(
      `DELETE FROM tasks
       WHERE DATE(created_at AT TIME ZONE 'UTC') = $1`,
      [today]
    );

    console.log(
      `[EOD] Deleted ${deleteResult.rowCount} task(s) from active table`
    );

    // STEP 7 — Commit transaction
    await client.query('COMMIT');
    console.log('[EOD] EOD transaction committed successfully');

    // STEP 8 — Send email (outside transaction, after commit)
    await sendSummaryEmail(summary);
    console.log('[EOD] EOD summary email sent successfully');

    // STEP 9 — Final log
    console.log(`[EOD] EOD Job completed successfully for: ${today}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[EOD] Transaction rolled back due to error:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────
// Part D — Schedule the cron job (23:59 daily)
// ─────────────────────────────────────────────

cron.schedule('59 23 * * *', async () => {
  console.log('[EOD Cron] Triggered at:', new Date().toISOString());
  try {
    await runEODJob();
  } catch (err) {
    console.error('[EOD Cron] Job failed:', err.message);
  }
});

console.log('[EOD Cron] Scheduled for 23:59 daily');
