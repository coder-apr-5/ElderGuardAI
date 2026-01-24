// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Connection Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from 'express';
import connectionController from '../controllers/connection.controller';
import { authenticate } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   GET /api/connections/pending/:id
 * @desc    Get pending connection status
 * @access  Public
 */
router.get(
    '/pending/:id',
    generalLimiter,
    connectionController.getPendingConnectionStatus
);

/**
 * @route   GET /api/connections/elders
 * @desc    Get connected elders (for family)
 * @access  Private (Family only)
 */
router.get(
    '/elders',
    authenticate,
    connectionController.getElders
);

/**
 * @route   GET /api/connections/family
 * @desc    Get connected family (for elder)
 * @access  Private (Elder only)
 */
router.get(
    '/family',
    authenticate,
    connectionController.getFamily
);

/**
 * @route   GET /api/countries
 * @desc    Get supported countries
 * @access  Public
 */
router.get(
    '/countries',
    generalLimiter,
    connectionController.getCountries
);

/**
 * @route   GET /api/countries/search
 * @desc    Search countries
 * @access  Public
 */
router.get(
    '/countries/search',
    generalLimiter,
    connectionController.searchCountriesHandler
);

export default router;
