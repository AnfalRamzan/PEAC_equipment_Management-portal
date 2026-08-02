const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Generate report
router.get('/', authenticate, async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        let data = [];

        if (type === 'monthly') {
            data = await query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as total_errors,
                    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_errors
                FROM error_logs
                WHERE created_at BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            `, [startDate, endDate]);
        } else if (type === 'hospital') {
            data = await query(`
                SELECT 
                    h.name as hospital_name,
                    COUNT(el.id) as total_errors,
                    COUNT(DISTINCT e.id) as affected_equipment
                FROM hospitals h
                LEFT JOIN equipment e ON h.id = e.hospital_id
                LEFT JOIN error_logs el ON e.id = el.equipment_id
                WHERE el.created_at BETWEEN ? AND ?
                GROUP BY h.id
            `, [startDate, endDate]);
        }

        res.json({ success: true, report: data });
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
});

// Export PDF
router.get('/export/pdf', authenticate, async (req, res) => {
    try {
        // In production, use PDFKit to generate PDF
        // For now, return a placeholder
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        res.send('PDF content would be here');
    } catch (error) {
        console.error('Export PDF error:', error);
        res.status(500).json({ success: false, message: 'Failed to export PDF' });
    }
});

// Export Excel
router.get('/export/excel', authenticate, async (req, res) => {
    try {
        // In production, use ExcelJS to generate Excel
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
        res.send('Excel content would be here');
    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({ success: false, message: 'Failed to export Excel' });
    }
});

// Export CSV
router.get('/export/csv', authenticate, async (req, res) => {
    try {
        // In production, use csv-writer to generate CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
        res.send('CSV content would be here');
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ success: false, message: 'Failed to export CSV' });
    }
});

module.exports = router;