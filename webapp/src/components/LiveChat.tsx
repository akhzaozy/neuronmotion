'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import styles from './LiveChat.module.css';

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
  id: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  parts: [{ text: 'Halo! Saya **NeuroBot**, asisten kesehatan virtual NeuronMotion 👋\n\nSaya siap membantu Anda memahami hasil skrining, menjawab pertanyaan seputar kesehatan motorik, dan memberikan informasi umum tentang gangguan saraf.\n\nApa yang ingin Anda tanyakan hari ini?' }],
  id: 'welcome',
};

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
    else if (messages.length > 1) setHasUnread(true);
  }, [messages, isOpen, scrollToBottom]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      parts: [{ text }],
      id: `user-${Date.now()}`,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build conversation history for API (exclude welcome id, exclude our ids)
    const history = [...messages, userMsg].map(({ role, parts }) => ({ role, parts }));

    try {
      // Lewat api.ts agar mengarah ke backend Express (NEXT_PUBLIC_API_URL),
      // sama seperti seluruh pemanggilan API lain. Sebelumnya memakai URL
      // relatif '/api/chat', yang di produksi diteruskan nginx ke Express
      // sebagai POST /chat dan berakhir 404.
      const data = await api.chat(history);

      const botMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: data.reply }],
        id: `model-${Date.now()}`,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: `⚠️ ${err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.'}` }],
        id: `err-${Date.now()}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([WELCOME_MESSAGE]);
  }

  return (
    <>
      {/* Floating button */}
      <button
        id="livechat-toggle-btn"
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Tutup chat' : 'Buka chat dengan NeuroBot'}
        title={isOpen ? 'Tutup chat' : 'Chat dengan NeuroBot AI'}
      >
        {hasUnread && !isOpen && <span className={styles.unreadDot} />}
        <span className={styles.fabIcon}>
          {isOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h8M8 14h5" strokeWidth="1.8" />
            </svg>
          )}
        </span>
        {!isOpen && <span className={styles.fabLabel}>NeuroBot</span>}
      </button>

      {/* Chat window */}
      <div
        id="livechat-window"
        className={`${styles.chatWindow} ${isOpen ? styles.chatWindowOpen : ''}`}
        role="dialog"
        aria-label="Chat dengan NeuroBot AI"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.botAvatar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3z" />
            </svg>
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.botName}>NeuroBot</div>
            <div className={styles.botStatus}>
              <span className={styles.statusDot} />
              Asisten AI · Powered by Last Dance
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              id="livechat-clear-btn"
              className={styles.iconBtn}
              onClick={clearChat}
              title="Hapus riwayat chat"
              aria-label="Hapus riwayat chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
            <button
              id="livechat-close-btn"
              className={styles.iconBtn}
              onClick={() => setIsOpen(false)}
              title="Tutup chat"
              aria-label="Tutup chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.chatBody} ref={chatBodyRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot}`}
            >
              {msg.role === 'model' && (
                <div className={styles.bubbleAvatar}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3z" />
                  </svg>
                </div>
              )}
              <div
                className={styles.bubbleContent}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text) }}
              />
            </div>
          ))}

          {loading && (
            <div className={`${styles.bubble} ${styles.bubbleBot}`}>
              <div className={styles.bubbleAvatar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3z" />
                </svg>
              </div>
              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className={styles.quickPrompts}>
            {[
              'Apa arti skor risiko saya?',
              'Apa itu tremor Parkinson?',
              'Kapan saya harus ke dokter?',
            ].map(q => (
              <button
                key={q}
                className={styles.quickPromptBtn}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className={styles.chatInputArea}>
          <textarea
            id="livechat-input"
            ref={inputRef}
            className={styles.chatInput}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan Anda... (Enter kirim)"
            rows={1}
            disabled={loading}
            aria-label="Pesan untuk NeuroBot"
          />
          <button
            id="livechat-send-btn"
            className={`${styles.sendBtn} ${(!input.trim() || loading) ? styles.sendBtnDisabled : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Kirim pesan"
          >
            {loading ? (
              <div className={styles.sendSpinner} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <div className={styles.disclaimer}>
          ⚕️ NeuroBot bukan dokter — selalu konsultasikan kondisi Anda ke tenaga medis
        </div>
      </div>
    </>
  );
}
