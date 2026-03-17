import { getSocket } from "../socket/index";

export default function EditorSocket({
  editorRef,
  suppressEmitRef,
  roomId,
  myUserId,
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
      setCode(incomingCode);
      setLanguage(incomingLang);

      if (editorRef.current) {
        editorRef.current.setValue(incomingCode);
      }

      setTimeout(() => {
        if (position) editorRef.current?.setPosition(position);
      }, 0);
    };

    socket.on("code:change", onCodeChange);

    return () => {
      socket.emit("leave:session", roomId);
      socket.off("code:change", onCodeChange);
    };
  }, [roomId]);
}
