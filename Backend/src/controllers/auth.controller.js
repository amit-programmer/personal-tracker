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
	
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: cookieMaxAge
			});

			

			// Set userId cookie for easy access
			res.cookie('userId', user._id.toString(), {
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: cookieMaxAge
			});

			res.cookie('logo', user.logo, {
				
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
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: cookieMaxAge
			});

				res.cookie('logo', user.logo, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: cookieMaxAge
				});

			// Set userId cookie for easy access
			res.cookie('userId', user._id.toString(), {
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: cookieMaxAge
			});

			const userSafe = { id: user._id, name: user.name, email: user.email, logo: user.logo };

// after login API success
// localStorage.setItem("token", response.data.token);



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

async function me(req, res) {
	try {
		const userId = req.user && req.user.sub
		if (!userId) return res.status(401).json({ error: 'Unauthorized' })

		const user = await User.findById(userId).select('-password')
		if (!user) return res.status(404).json({ error: 'User not found' })

		return res.json({ user })
	} catch (err) {
		console.error('Me error', err)
		return res.status(500).json({ error: 'Failed to fetch user' })
	}
}

async function logout(req, res) {
	try {
		res.removeCookie('userId')
		res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
		return res.json({ message: 'Logged out' })
	} catch (err) {
		console.error('Logout error', err)
		return res.status(500).json({ error: 'Failed to logout' })
	}
}

async function getUserById(req, res) {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).json({ error: 'User ID is required' })
		}

		const user = await User.findById(id).select('-password')
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		return res.json({ user })
	} catch (err) {
		console.error('Get user by ID error', err)
		return res.status(500).json({ error: 'Failed to fetch user' })
	}
}

module.exports = {
	signup,
	login,
	me,
	logout,
	getUserById
}
