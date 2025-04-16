import React, { useEffect } from 'react';

export function ChatView() {
  useEffect(() => {
    // Qui si dovrebbe definire unsubscribeTyping e unsubscribeTypingDone, oppure lasciare la pulizia se esistono
    return () => {
      unsubscribeTyping();
      unsubscribeTypingDone();
    };
  }, []);

  return (
    <div>
      ChatView funziona!
    </div>
  );
  // Chiusura del componente corretta (React function component)
}
