const User = require("../models/User");

function authorize(role) {
  return async (req, res, next) => {
    const user = await User.findByPk(req.user.id);
    if (user.role !== role) return res.status(403).json({ error: "Forbidden" });

    next();
  };
}

module.exports = authorize;
