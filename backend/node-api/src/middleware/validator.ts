/**
 * ElderNest AI - Request Validator Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { sendValidationError } from '../utils/responses';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }
    const errorMessages = errors.array().map((err) => {
      if ('path' in err) return `${err.path}: ${err.msg}`;
      return err.msg;
    });
    sendValidationError(res, errorMessages);
  };
};

// Chat validations
export const sendChatValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 500 }).withMessage('Message must be 1-500 characters'),
];

export const chatHistoryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

// Elder validations
export const moodValidation = [
  body('score')
    .isFloat({ min: 0, max: 1 }).withMessage('Score must be 0-1'),
  body('label')
    .isIn(['very_bad', 'bad', 'neutral', 'good', 'very_good']),
  body('notes').optional().isString(),
];

export const profileValidation = [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('age').optional().isInt({ min: 18, max: 120 }),
  body('emergencyContact.name').optional().trim().notEmpty(),
  body('emergencyContact.phone').optional().isMobilePhone('any'),
];

export const medicineIdValidation = [
  param('id').notEmpty().withMessage('Medicine ID is required'),
];

// Family validations
export const elderIdValidation = [
  param('id').notEmpty().withMessage('Elder ID is required'),
];

export const connectCodeValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Connection code is required')
    .isLength({ min: 6, max: 10 }),
  body('relationship')
    .isIn(['son', 'daughter', 'spouse', 'sibling', 'grandchild', 'caregiver', 'other']),
];

export const notificationIdValidation = [
  param('id').notEmpty().withMessage('Notification ID is required'),
];

// Emotion analysis validation
export const emotionAnalysisValidation = [
  body('image')
    .notEmpty().withMessage('Image is required')
    .isString().withMessage('Image must be base64 string'),
];

export default validate;
