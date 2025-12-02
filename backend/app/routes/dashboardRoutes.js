/**
 * Dashboard Routes
 * Aggregate endpoint for efficient frontend data loading
 */

import express from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard/init
 * @desc    Initialize dashboard with all critical and secondary data
 * @access  Public
 * @returns {Object} Critical and secondary tier data in single response
 * 
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     critical: {
 *       priceSummary: {...},
 *       latestBlock: {...},
 *       aiPrediction: {...}
 *     },
 *     secondary: {
 *       priceHistory: [...],
 *       models: [...],
 *       treasuries: [...],
 *       mempoolStats: {...},
 *       miningEconomics: {...}
 *     }
 *   },
 *   metadata: {
 *     timestamp: 1701234567890,
 *     duration: 342,
 *     version: '1.0'
 *   }
 * }
 */
router.get('/init', dashboardController.initializeDashboard);

export default router;
