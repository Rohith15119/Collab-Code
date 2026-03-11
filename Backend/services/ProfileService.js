const Session = require("../models/Session");
const User = require("../models/User");

const UserName = async (name, id) => {
  User.update({ name }, { where: { id: id } });
};

const Delete = async (userId) => {
  Promise.all([
    Session.deleteMany({ ownerId: userId }),
    Session.updateMany(
      { sharedWith: userId },
      { $pull: { sharedWith: userId } },
    ),
    User.destroy({ where: { id: userId } }),
  ]);
};

module.exports = { UserName, Delete };
