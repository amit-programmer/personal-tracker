const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		logo: {
			type: String,
			default: "https://tse1.explicit.bing.net/th/id/OIP.L15G2RFltrzUm-clTXjtUQHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
			optional: true
		}
	},
	{ timestamps: true }
)

const userModel = mongoose.model('user', userSchema)

module.exports = userModel
