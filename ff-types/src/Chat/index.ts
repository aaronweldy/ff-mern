export type MessageType = "chat" | "draft" | "user";

export type ChatMessage = {
  sender: string;
  message: string;
  timestamp: string;
  type: MessageType;
};
