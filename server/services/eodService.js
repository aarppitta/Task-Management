import pool from '../config/db.js';
import nodemailer from 'nodemailer';

/**
 * Runs the full End-of-Day process inside a single PostgreSQL transaction.
 * @param {string} targetDate - 'YYYY-MM-DD' string for the date to process
 */
export async function runEOD(targetDate) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Fetch all tasks for the target date
    const { rows: tasks } = await client.query(
      'SELECT * FROM tasks WHERE task_date = $1',
      [targetDate]
    );

    // Step 2: Count totals
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = tasks.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress'
    ).length;
    const completionPercentage =
      totalTasks > 0
        ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2))
        : 0;

    // Step 3: Update in_progress → not_completed
    await client.query(
      "UPDATE tasks SET status = 'not_completed', updated_at = NOW() WHERE task_date = $1 AND status = 'in_progress'",
      [targetDate]
    );

    // Re-fetch updated tasks for archiving (status may have changed)
    const { rows: updatedTasks } = await client.query(
      'SELECT * FROM tasks WHERE task_date = $1',
      [targetDate]
    );

    // Step 4: Insert all tasks into archived_tasks
    if (updatedTasks.length > 0) {
      for (const task of updatedTasks) {
        await client.query(
          `INSERT INTO archived_tasks
            (original_id, title, description, status, task_date, created_at, updated_at, archived_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            task.id,
            task.title,
            task.description,
            task.status,
            task.task_date,
            task.created_at,
            task.updated_at,
          ]
        );
      }
    }

    // Step 5: Delete tasks from tasks table
    await client.query('DELETE FROM tasks WHERE task_date = $1', [targetDate]);

    // Step 6: Compute CUMULATIVE totals across all EOD runs for this date
    const { rows: allArchived } = await client.query(
      'SELECT status FROM archived_tasks WHERE task_date = $1',
      [targetDate]
    );
    const cumTotal = allArchived.length;
    const cumCompleted = allArchived.filter((t) => t.status === 'completed').length;
    const cumPending = allArchived.filter((t) => t.status !== 'completed').length;
    const cumPct = cumTotal > 0
      ? parseFloat(((cumCompleted / cumTotal) * 100).toFixed(2))
      : 0;

    // Step 7: Upsert daily summary with cumulative totals
    await client.query(
      `INSERT INTO daily_summaries
        (summary_date, total_tasks, completed_tasks, pending_tasks, completion_percentage, eod_executed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (summary_date) DO UPDATE SET
         total_tasks = EXCLUDED.total_tasks,
         completed_tasks = EXCLUDED.completed_tasks,
         pending_tasks = EXCLUDED.pending_tasks,
         completion_percentage = EXCLUDED.completion_percentage,
         eod_executed_at = NOW()`,
      [targetDate, cumTotal, cumCompleted, cumPending, cumPct]
    );

    // Step 8: Send email summary (non-blocking — failure won't roll back the transaction)
    try {
      // Set a 10-second timeout for email sending
      const emailPromise = sendEmailSummary({
        targetDate,
        totalTasks: cumTotal,
        completedTasks: cumCompleted,
        pendingTasks: cumPending,
        completionPercentage: cumPct,
        tasks: updatedTasks,
      });

      // Race the email promise against a 10-second timeout
      await Promise.race([
        emailPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email send timeout')), 10000)
        ),
      ]);
    } catch (emailErr) {
      console.warn(`[EOD] Email failed for ${targetDate}, continuing without notification:`, emailErr.message);
    }

    // Step 9: Commit transaction
    await client.query('COMMIT');

    console.log(`[EOD] Process completed successfully for ${targetDate}`);

    return {
      targetDate,
      totalTasks: cumTotal,
      completedTasks: cumCompleted,
      pendingTasks: cumPending,
      completionPercentage: cumPct,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[EOD] Process failed for ${targetDate}, rolled back:`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function sendEmailSummary({
  targetDate,
  totalTasks,
  completedTasks,
  pendingTasks,
  completionPercentage,
  tasks,
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: parseInt(process.env.MAILTRAP_PORT, 10),
    secure: false,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const taskRows = tasks
    .map(
      (t) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd">${t.title}</td>
          <td style="padding:8px;border:1px solid #ddd">${t.description || '-'}</td>
          <td style="padding:8px;border:1px solid #ddd;text-transform:capitalize">${t.status.replace('_', ' ')}</td>
        </tr>`
    )
    .join('');

  const html = `
    <h2>Daily Task Summary — ${targetDate}</h2>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
      <tr>
        <td style="padding:12px;background:#f0f4f8;font-weight:bold">Total Tasks</td>
        <td style="padding:12px">${totalTasks}</td>
      </tr>
      <tr>
        <td style="padding:12px;background:#f0f4f8;font-weight:bold">Completed</td>
        <td style="padding:12px;color:#16a34a">${completedTasks}</td>
      </tr>
      <tr>
        <td style="padding:12px;background:#f0f4f8;font-weight:bold">Pending / Incomplete</td>
        <td style="padding:12px;color:#dc2626">${pendingTasks}</td>
      </tr>
      <tr>
        <td style="padding:12px;background:#f0f4f8;font-weight:bold">Completion Rate</td>
        <td style="padding:12px;color:#2563eb">${completionPercentage}%</td>
      </tr>
    </table>
    ${
      tasks.length > 0
        ? `<h3>Task Details</h3>
           <table style="border-collapse:collapse;width:100%">
             <thead>
               <tr>
                 <th style="padding:8px;border:1px solid #ddd;background:#f0f4f8">Title</th>
                 <th style="padding:8px;border:1px solid #ddd;background:#f0f4f8">Description</th>
                 <th style="padding:8px;border:1px solid #ddd;background:#f0f4f8">Status</th>
               </tr>
             </thead>
             <tbody>${taskRows}</tbody>
           </table>`
        : '<p>No tasks were found for this date.</p>'
    }
  `;

  await transporter.sendMail({
    from: process.env.MAILTRAP_FROM || `"TaskManager" <${process.env.MAILTRAP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `Daily Summary: ${targetDate} — ${completionPercentage}% completed`,
    html,
  });

  console.log(`[EOD] Email sent to ${process.env.NOTIFY_EMAIL}`);
}
