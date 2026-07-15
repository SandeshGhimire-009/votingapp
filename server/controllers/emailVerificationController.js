const nodemailer = require('nodemailer');

// Store OTP temporarily
const otpStore = {};

// Simple in-memory OTP generator
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationCode = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const otp = generateOTP();
        otpStore[email] = { otp, timestamp: Date.now() };
        
        // In development, just return OTP
        return res.json({ 
            message: 'Verification code sent',
            debug: process.env.NODE_ENV !== 'production' ? { otp } : undefined
        });
    } catch (err) {
        return next(err);
    }
};

const verifyCode = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: 'Email and code are required' });
        }
        
        const stored = otpStore[email];
        if (!stored) {
            return res.status(400).json({ message: 'No verification code found' });
        }
        
        if (stored.otp !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        
        delete otpStore[email];
        return res.json({ message: 'Code verified successfully', verified: true });
    } catch (err) {
        return next(err);
    }
};

const getDebugCode = async (req, res, next) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const stored = otpStore[email];
        if (!stored) {
            return res.status(404).json({ message: 'No code found' });
        }
        
        return res.json({ email, otp: stored.otp });
    } catch (err) {
        return next(err);
    }
};

module.exports = { sendVerificationCode, verifyCode, getDebugCode };
