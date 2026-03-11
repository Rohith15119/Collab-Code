const Session = require("../models/Session");

const SharedRequest = async (id) => {
  return Session.find({
    sharedWith: id,
  }).sort({ updatedAt: -1 });
};

const Fetch_Requests = async (id) => {
  return Session.find({
    ownerId: id,
    sharedWith: { $exists: true, $not: { $size: 0 } },
  }).sort({ updatedAt: -1 });
};

const Fetch_Session_Share = async (roomId) => {
  return Session.findOne({ roomId });
};

const Remove_Shared_Session = async (roomId, targetUser) => {
  return Session.updateOne(
    { roomId: roomId },
    { $pull: { sharedWith: targetUser.id } },
  );
};

module.exports = {
  SharedRequest,
  Fetch_Requests,
  Fetch_Session_Share,
  Remove_Shared_Session,
};
