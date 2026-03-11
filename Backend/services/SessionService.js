const { v4: uuidv4 } = require("uuid");
const Session = require("../models/Session");

const NewSession = async (title, language) => {
  return await Session.create({
    roomId: uuidv4(),
    title: title || "Untitled Session",
    language: language,
    code: `// JavaScript Template\nfunction main() {\n  console.log("Hello, World!");\n}\nmain();\n`,
    ownerId: req.user.id,
  });
};

const SortedSessions = async () => {
  return Session.find({ ownerId: req.user.id })
    .select("title language roomId updatedAt createdAt -_id")
    .sort({ updatedAt: -1 })
    .lean();
};

const Get_Session = async (roomId) => {
  return await Session.findOne({ roomId: roomId })
    .select("title language code codeSnippet createdAt ownerId sharedWith -_id")
    .lean();
};

const UpdateSession = async (roomId, Userid) => {
  return await Session.findOneAndUpdate(
    { roomId: roomId, ownerId: Userid },
    { $set },
    { returnDocument: "after", lean: true },
  );
};

const deleteSession = async (roomId, userId) => {
  return await Session.findOneAndDelete({
    roomId: roomId,
    ownerId: userId,
  }).lean();
};

module.exports = {
  NewSession,
  SortedSessions,
  Get_Session,
  UpdateSession,
  deleteSession,
};
