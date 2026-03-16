import { validationResult } from 'express-validator';
import pool from '../config/db.js';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export async function getTasks(req, res) {
  try {
    const date = req.query.date || getTodayDate();
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE task_date = $1 ORDER BY created_at ASC',
      [date]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[getTasks]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
}

export async function createTask(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { title, description, status } = req.body;
    const task_date = req.body.task_date || getTodayDate();

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, task_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description || null, status || 'pending', task_date]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[createTask]', err.message);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
}

export async function updateTask(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[updateTask]', err.message);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[deleteTask]', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
}

export async function getArchivedTasks(req, res) {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'date query param required (YYYY-MM-DD)' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM archived_tasks WHERE task_date = $1 ORDER BY archived_at ASC',
      [date]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[getArchivedTasks]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch archived tasks' });
  }
}
