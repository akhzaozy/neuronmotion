'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import styles from './LiveChat.module.css';

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
  id: string;
}

function welcomeMessage(text: string): ChatMessage {
  return { role: 'model', parts: [{ text }], id: 'welcome' };
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

export default function LiveChat() {
  const { t, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Sapaan pembuka ikut berganti saat bahasa diubah, selama percakapan belum
  // dimulai. Bila pengguna sudah bertanya, isi percakapan dibiarkan apa adanya.
  useEffect(() => {
    setMessages(prev => (prev.length <= 1 ? [welcomeMessage(t('bot.welcome'))] : prev));
  }, [t]);

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
      const data = await api.chat(history, lang);

      const botMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: data.reply }],
        id: `model-${Date.now()}`,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: `**${t('bot.errorPrefix')}** ${err instanceof Error ? err.message : t('bot.error')}` }],
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
    setMessages([welcomeMessage(t('bot.welcome'))]);
  }

  return (
    <>
      {/* Tombol pembuka. Isinya kata, bukan ikon gelembung percakapan, dan
          keadaan belum terbaca juga dinyatakan kata. */}
      <button
        id="livechat-toggle-btn"
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? t('bot.closeChat') : t('bot.openChat')}
        title={isOpen ? t('bot.closeChat') : t('bot.chatWith')}
      >
        <span className={styles.fabLabel} data-no-translate="">NeuroBot</span>
        {hasUnread && !isOpen && (
          <span className={styles.unreadFlag}>{t('bot.newMessage')}</span>
        )}
      </button>

      {/* Chat window */}
      <div
        id="livechat-window"
        className={`${styles.chatWindow} ${isOpen ? styles.chatWindowOpen : ''}`}
        role="dialog"
        aria-label={t('bot.chatWith')}
        aria-hidden={!isOpen}
      >
        {/* Kop lembar percakapan. Kendalinya kata bergaris bawah, bukan tombol
            kotak berikon, dan tetap memenuhi lantai sasaran sentuh. */}
        <div className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.botName} data-no-translate="">NeuroBot</div>
            <div className={styles.botStatus}>{t('bot.status')}</div>
          </div>
          <div className={styles.headerActions}>
            <button
              id="livechat-clear-btn"
              className={styles.headerBtn}
              onClick={clearChat}
              title={t('bot.clearHistory')}
              aria-label={t('bot.clearHistory')}
            >
              {t('common.delete')}
            </button>
            <button
              id="livechat-close-btn"
              className={styles.headerBtn}
              onClick={() => setIsOpen(false)}
              title={t('bot.closeChat')}
              aria-label={t('bot.closeChat')}
            >
              {t('common.close')}
            </button>
          </div>
        </div>

        {/* Giliran percakapan. Siapa yang berbicara dibawa label mono di atas
            isinya, bukan sisi kiri kanan dan warna gelembung. */}
        <div className={styles.chatBody} ref={chatBodyRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : ''}`}
            >
              <span className={styles.bubbleWho}>
                {msg.role === 'user' ? t('bot.you') : <span data-no-translate="">NeuroBot</span>}
              </span>
              {/* Pesan pengguna adalah kalimat yang ia ketik sendiri, jadi
                  dibiarkan apa adanya. Balasan bot sudah dihasilkan dalam
                  bahasa yang dipilih, sehingga juga tidak perlu diterjemahkan. */}
              <div
                className={styles.bubbleContent}
                data-no-translate=""
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text) }}
              />
            </div>
          ))}

          {loading && (
            <div className={styles.bubble}>
              <span className={styles.bubbleWho} data-no-translate="">NeuroBot</span>
              <p className={styles.typing} role="status" aria-live="polite">
                {t('common.loading')}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className={styles.quickPrompts}>
            {[t('bot.q1'), t('bot.q2'), t('bot.q3')].map(q => (
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
            placeholder={t('bot.placeholder')}
            rows={1}
            disabled={loading}
            aria-label={t('bot.messageLabel')}
          />
          <button
            id="livechat-send-btn"
            className={`${styles.sendBtn} ${(!input.trim() || loading) ? styles.sendBtnDisabled : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label={t('bot.send')}
          >
            {loading ? t('common.loading') : t('bot.send')}
          </button>
        </div>
        <div className={styles.disclaimer}>
          {t('bot.disclaimer')}
        </div>
      </div>
    </>
  );
}
