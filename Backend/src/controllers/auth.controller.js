const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const JWT_EXPIRES_IN = '7d'

async function signup(req, res) {
	try {
		const { name, email, password } = req.body
		if (!name || !email || !password) {
			return res.status(400).json({ error: 'Name, email and password are required' })
		}

		const existing = await User.findOne({ email })
		if (existing) {
			return res.status(409).json({ error: 'User already exists with this email' })
		}

		const hashed = await bcrypt.hash(password, 10)
		const user = await User.create({ name, email, password: hashed })

		const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN
		})

			// set cookie for auth (httpOnly)
			const cookieMaxAge = (() => {
				// parse values like '7d', '24h' fallback to days
				try {
					if (typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('d')) {
						const days = parseInt(JWT_EXPIRES_IN.slice(0, -1), 10) || 7;
						return days * 24 * 60 * 60 * 1000;
					}
					if (typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('h')) {
						const hours = parseInt(JWT_EXPIRES_IN.slice(0, -1), 10) || 24;
						return hours * 60 * 60 * 1000;
					}
				} catch (e) {
					// ignore and fallthrough
				}
				// default 7 days
				return 7 * 24 * 60 * 60 * 1000;
			})();

			res.cookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: cookieMaxAge
			});

			const userSafe = { id: user._id, name: user.name, email: user.email, logo: user.logo };

			return res.status(201).json({
				message: 'User created successfully',
				user: userSafe,
				token
			});
	} catch (err) {
		console.error('Signup error', err)
		return res.status(500).json({ error: 'Failed to sign up' })
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body
		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' })
		}

		const user = await User.findOne({ email })
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' })
		}

		const match = await bcrypt.compare(password, user.password)
		if (!match) {
			return res.status(401).json({ error: 'Invalid credentials' })
		}

		const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN
		})

			// set cookie for auth (httpOnly)
			const cookieMaxAge = (() => {
				try {
					if (typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('d')) {
						const days = parseInt(JWT_EXPIRES_IN.slice(0, -1), 10) || 7;
						return days * 24 * 60 * 60 * 1000;
					}
					if (typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('h')) {
						const hours = parseInt(JWT_EXPIRES_IN.slice(0, -1), 10) || 24;
						return hours * 60 * 60 * 1000;
					}
				} catch (e) {}
				return 7 * 24 * 60 * 60 * 1000;
			})();

			res.cookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: cookieMaxAge
			});

			const userSafe = { id: user._id, name: user.name, email: user.email, logo: user.logo };

			return res.json({
				message: 'Login successful',
				user: userSafe,
				token
			});
	} catch (err) {
		console.error('Login error', err)
		return res.status(500).json({ error: 'Failed to log in' })
	}
}


module.exports = {
    signup,
    login
}
