// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Connection Controller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Request, Response } from 'express';
import {
    getPendingConnection,
    getConnectedElders,
    getConnectedFamily,
} from '../services/family-connection.service';
import { getAllCountries, searchCountries } from '../services/phone.service';
import { logger } from '../utils/logger';

/**
 * Get pending connection status
 * GET /api/connections/pending/:id
 */
export async function getPendingConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const pending = await getPendingConnection(id);

        if (!pending) {
            res.status(404).json({ success: false, error: 'Connection not found' });
            return;
        }

        res.json({
            success: true,
            connection: {
                id: pending.id,
                elderName: pending.elderName,
                status: pending.status,
                expiresAt: pending.expiresAt.toDate().toISOString(),
                familyRelation: pending.familyRelation,
            },
        });
    } catch (error) {
        logger.error('Get pending connection error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Get connected elders for family member
 * GET /api/connections/elders
 */
export async function getElders(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user || req.user.role !== 'family') {
            res.status(403).json({ success: false, error: 'Only family members can access this' });
            return;
        }

        const elders = await getConnectedElders(req.user.uid);

        res.json({
            success: true,
            elders: elders.map((elder: Record<string, unknown>) => ({
                uid: elder.uid,
                fullName: elder.fullName,
                phone: elder.phone,
                age: elder.age,
                accountStatus: elder.accountStatus,
                lastLogin: elder.lastLogin,
            })),
        });
    } catch (error) {
        logger.error('Get connected elders error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Get connected family for elder
 * GET /api/connections/family
 */
export async function getFamily(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user || req.user.role !== 'elder') {
            res.status(403).json({ success: false, error: 'Only elders can access this' });
            return;
        }

        const family = await getConnectedFamily(req.user.uid);

        res.json({
            success: true,
            family: family.map((member: Record<string, unknown>) => ({
                uid: member.uid,
                fullName: member.fullName,
                email: member.email,
                phone: member.phone,
            })),
        });
    } catch (error) {
        logger.error('Get connected family error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Get supported countries
 * GET /api/countries
 */
export async function getCountries(_req: Request, res: Response): Promise<void> {
    try {
        const countries = getAllCountries();

        res.json({
            success: true,
            countries: countries.map(c => ({
                code: c.code,
                name: c.name,
                callingCode: c.callingCode,
                flag: c.flag,
            })),
        });
    } catch (error) {
        logger.error('Get countries error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Search countries
 * GET /api/countries/search?q=...
 */
export async function searchCountriesHandler(req: Request, res: Response): Promise<void> {
    try {
        const query = (req.query.q as string) || '';
        const countries = searchCountries(query);

        res.json({
            success: true,
            countries: countries.map(c => ({
                code: c.code,
                name: c.name,
                callingCode: c.callingCode,
                flag: c.flag,
            })),
        });
    } catch (error) {
        logger.error('Search countries error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export default {
    getPendingConnectionStatus,
    getElders,
    getFamily,
    getCountries,
    searchCountriesHandler,
};
