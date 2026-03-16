import pool from '../config/db.js';

export async function getSummary(req, res) {
  try {
    const { date } = req.params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM daily_summaries WHERE summary_date = $1',
      [date]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No summary found for this date' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[getSummary]', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
}
