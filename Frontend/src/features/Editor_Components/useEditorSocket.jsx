import { useEffect } from "react";

export default function EditorSocket({
  editorRef,
  suppressEmitRef,
  roomId,
  myUserId,
  getSocket,
  setCode,
  setLanguage,
  codeRef,
  languageRef,
}) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit("join:session", roomId);

    const onCodeChange = ({
      code: incomingCode,
      language: incomingLang,
      sender,
    }) => {
      if (sender === myUserId) return;

      const position = editorRef.current?.getPosition();

      suppressEmitRef.current = true;

      codeRef.current = incomingCode;
      languageRef.current = incomingLang;

      setCode(incomingCode);
      setLanguage(incomingLang);

      setTimeout(() => {
        if (position) editorRef.current?.setPosition(position);
      }, 0);
    };

    socket.on("code:change", onCodeChange);

    return () => {
      socket.emit("leave:session", roomId);
      socket.off("code:change", onCodeChange);
    };
  }, [roomId, myUserId, getSocket]);
}
