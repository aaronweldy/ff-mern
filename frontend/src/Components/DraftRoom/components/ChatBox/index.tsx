import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { useSocket } from "../../../../Context/SocketContext";
import { useStore } from "../../store";
import "./style.css";

type ChatBoxProps = {
  draftId: string;
};

export const ChatBox = ({ draftId }: ChatBoxProps) => {
  const { socket } = useSocket();
  const [curMessage, setCurMessage] = useState("");
  const messages = useStore((store) => store.messages);
  const scrollToLatestMessage = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);
  return (
    <div className="chatbox">
      <div className="past-messages">
        {messages.map((message, idx) => {
          const senderName =
            message.sender.length > 7
              ? message.sender.substring(0, 7) + "..."
              : message.sender;
          return (
            <div
              className="message"
              key={message.timestamp}
              ref={idx === messages.length - 1 ? scrollToLatestMessage : null}
            >
              <div className="message-sender">{senderName}</div>
              <div className="message-text" data-type={message.type}>
                {message.message}
              </div>
              <div className="message-time">
                {dayjs(message.timestamp).format("hh:mm")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="send-message-input">
        <input
          placeholder="Send a message..."
          type="text"
          value={curMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCurMessage(e.target.value)
          }
          className="send-box"
        />
        <button
          onClick={() => {
            setCurMessage("");
            socket?.emit("sendMessage", curMessage, draftId);
          }}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};
