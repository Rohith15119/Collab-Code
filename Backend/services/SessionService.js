const { v4: uuidv4 } = require("uuid");
const Session = require("../models/Session");

const NewSession = async (title, language, userId) => {
  return Session.create({
    roomId: uuidv4(),
    title: title || "Untitled Session",
    language: language,
    code: `// JavaScript Template\nfunction main() {\n  console.log("Hello, World!");\n}\nmain();\n`,
    ownerId: userId,
  });
};

const SortedSessions = async (userId, limit) => {
  const query = Session.find({ ownerId: userId })
    .select("title language roomId updatedAt createdAt -_id")
    .sort({ updatedAt: -1 });

  if (limit > 0) query.limit(limit);

  return query.lean();
};

const Get_Session = async (roomId) => {
  return Session.findOne({ roomId: roomId })
    .select("title language code codeSnippet createdAt ownerId sharedWith -_id")
    .lean();
};

const UpdateSession = async (roomId, Userid, data) => {
  return Session.findOneAndUpdate(
    { roomId: roomId },
    { $set: data },
    { returnDocument: "after", lean: true },
  );
};

const deleteSession = async (roomId, userId) => {
  return Session.findOneAndDelete({
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
