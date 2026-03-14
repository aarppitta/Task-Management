
import pool from '../config/db.js';

/**
 * GET /api/tasks/today
 * Fetch all tasks created today.
 */
export const getTodayTasks = async (req, res, next) => {

  try {
    const result = await pool.query(
    `SELECT * FROM tasks
    WHERE DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
    ORDER BY created_at DESC`
);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks
 * Create a new task with title, optional description, and optional status.
 * Status defaults to 'Pending' via DB column default if not provided.
 */
export const createTask = async (req, res, next) => {

    try {
    const { title, description = null, status } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (title, description${status ? ', status' : ''})
       VALUES ($1, $2${status ? ', $3' : ''})
       RETURNING *`,
      status ? [title, description, status] : [title, description]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * Update an existing task. Only provided fields are updated.
 * Dynamically builds the SET clause based on which fields are present in the body.
 * Always sets updated_at = NOW().
 */
export const updateTask = async (req, res, next) => {

  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined)       { fields.push(`title = $${idx++}`);       values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (status !== undefined)      { fields.push(`status = $${idx++}`);      values.push(status); }

    // Always refresh updated_at
    fields.push(`updated_at = NOW()`);

    // id is the final parameter
    values.push(id);

    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task from the active tasks table by id.
 */
export const deleteTask = async (req, res, next) => {

  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/history?date=YYYY-MM-DD
 * Fetch archived tasks for a specific date.
 * Requires the `date` query param — returns 400 if missing.
 */
export const getHistory = async (req, res, next) => {

    try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT * FROM archived_tasks
       WHERE archive_date = $1
       ORDER BY created_at DESC`,
      [date]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/summary?date=YYYY-MM-DD
 * Fetch the daily summary for a given date.
 * `date` query param is optional — defaults to today (UTC).
 * Returns { data: null } if no summary exists for the date.
 */
export const getDailySummary = async (req, res, next) => {

  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT * FROM daily_summaries WHERE summary_date = $1`,
      [date]
    );

    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
};
