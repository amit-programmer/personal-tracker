const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		logo: {
			type: String,
			default: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
			optional: true
		}
	},
	{ timestamps: true }
)

const userModel = mongoose.model('user', userSchema)

module.exports = userModel
