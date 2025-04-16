import React from "react";
import { ChatMessage } from "../../../src/shared/types";
import { ChatMessageComponent } from "./ChatMessage";
import { AgentBadge } from "./badges/AgentBadge";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  agentTypingState?: Record<string, Record<string, boolean>>;
  scrollLockEnabled?: Record<string, boolean>;
}

// Raggruppa i messaggi per threadId
function groupMessagesByThread(messages: ChatMessage[]) {
  const groups: Record<string, ChatMessage[]> = {};
  for (const msg of messages) {
    const threadId = msg.threadId || "main";
    if (!groups[threadId]) groups[threadId] = [];
    groups[threadId].push(msg);
  }
  return groups;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, agentTypingState, scrollLockEnabled }) => {
  const grouped = groupMessagesByThread(messages);
  const sortedThreadIds = Object.keys(grouped).sort();

  return (
    <div className="message-list">
      {sortedThreadIds.map((threadId) => (
        <div key={threadId} className="thread-segment">
          <div className="thread-separator">
            <AgentBadge agentId={grouped[threadId][0]?.agentId} />
            <span className="thread-label">
              Thread: {threadId !== "main" ? threadId : "Default"}
            </span>
            {/* Indicatore di scroll lock thread-aware */}
            {scrollLockEnabled && scrollLockEnabled[threadId] === true && (
              <span className="scroll-lock-indicator" title="Scroll lock attivo per questo thread">
                🔒{/* lucchetto unicode */}
              </span>
            )}
          </div>
          {grouped[threadId].map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          {/* Mostra indicatori di typing agent-specifici per thread, in stile animazione "..." e badge visuale */}
          {agentTypingState && agentTypingState[threadId] &&
            Object.entries(agentTypingState[threadId])
              .filter(([_, isTyping]) => isTyping)
              .map(([agentId], index) => (
                <div key={agentId+"-typing-indicator"} className="message typing-indicator">
                  <AgentBadge agentId={agentId} isTyping />
                  <span className="typing-ellipsis">&nbsp;sta scrivendo <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></span>
                </div>
              ))
          }
        </div>
      ))}
    </div>
  );
};