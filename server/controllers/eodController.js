import { runEOD } from '../services/eodService.js';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export async function triggerEOD(req, res) {
  try {
    const targetDate = req.body.date || getTodayDate();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const result = await runEOD(targetDate);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[triggerEOD]', err.message);
    res.status(500).json({ success: false, error: err.message || 'EOD process failed' });
  }
}
