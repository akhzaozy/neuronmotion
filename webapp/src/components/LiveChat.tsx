'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, User, Send, Trash2, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import styles from './LiveChat.module.css';

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
  id: string;
  time?: string;
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

  // Tutup chat saat menekan Escape atau klik di luar jendela chat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const chatWin = document.getElementById('livechat-window');
      const toggleBtn = document.getElementById('livechat-toggle-btn');
      if (
        isOpen &&
        chatWin &&
        !chatWin.contains(e.target as Node) &&
        toggleBtn &&
        !toggleBtn.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sapaan pembuka ikut berganti saat bahasa diubah, selama percakapan belum dimulai.
  useEffect(() => {
    setMessages(prev => (prev.length <= 1 ? [welcomeMessage(t('bot.welcome'))] : prev));
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
    else if (messages.length > 1) setHasUnread(true);
  }, [messages, isOpen, scrollToBottom]);

  // Tinggi textarea dinamis mengikuti konten
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input, isOpen]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const timeStr = new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      role: 'user',
      parts: [{ text }],
      id: `user-${Date.now()}`,
      time: timeStr,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const history = [...messages, userMsg].map(({ role, parts }) => ({ role, parts }));

    try {
      const data = await api.chat(history, lang);

      const botMsg: ChatMessage = {
        role: 'model',
        parts: [{ text: data.reply }],
        id: `model-${Date.now()}`,
        time: new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
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
      {/* Floating Action Button */}
      <button
        id="livechat-toggle-btn"
        className={`${styles.fab} ${isOpen ? styles.fabHidden : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? t('bot.closeChat') : t('bot.openChat')}
        title={isOpen ? t('bot.closeChat') : t('bot.chatWith')}
      >
        <span className={styles.fabIcon}>
          <Bot size={20} />
          <span className={styles.fabPulse} />
        </span>
        <span className={styles.fabLabel} data-no-translate="">NeuroBot</span>
        {hasUnread && !isOpen && (
          <span className={styles.unreadFlag}>{t('bot.newMessage')}</span>
        )}
      </button>

      {/* Chat Window Dialog */}
      <div
        id="livechat-window"
        className={`${styles.chatWindow} ${isOpen ? styles.chatWindowOpen : ''}`}
        role="dialog"
        aria-label={t('bot.chatWith')}
        aria-hidden={!isOpen}
      >
        {/* Kop Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.botAvatar}>
            <Bot size={22} className={styles.botAvatarIcon} />
            <span className={styles.onlineDot} title="Online" />
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.botName}>
              <span data-no-translate="">NeuroBot</span>
              <span className={styles.aiBadge}>AI</span>
            </div>
            <div className={styles.botStatus}>{t('bot.status')}</div>
          </div>
          <div className={styles.headerActions}>
            <button
              id="livechat-clear-btn"
              className={styles.headerIconBtn}
              onClick={clearChat}
              title={t('bot.clearHistory')}
              aria-label={t('bot.clearHistory')}
            >
              <Trash2 size={16} />
            </button>
            <button
              id="livechat-close-btn"
              className={styles.headerIconBtn}
              onClick={() => setIsOpen(false)}
              title={t('bot.closeChat')}
              aria-label={t('bot.closeChat')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Badan Percakapan Selang-Seling (Kiri & Kanan) */}
        <div className={styles.chatBody} ref={chatBodyRef}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${isUser ? styles.msgRowUser : styles.msgRowBot}`}
              >
                <div className={`${styles.avatarWrap} ${isUser ? styles.avatarUser : styles.avatarBot}`}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className={styles.bubbleCol}>
                  <div className={styles.bubbleHeader}>
                    <span className={styles.senderName}>
                      {isUser ? t('bot.you') : <span data-no-translate="">NeuroBot</span>}
                    </span>
                    {msg.time && <span className={styles.msgTime}>{msg.time}</span>}
                  </div>

                  <div
                    className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}
                    data-no-translate=""
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text) }}
                  />
                </div>
              </div>
            );
          })}

          {/* Typing Indicator (Animasi 3 Titik) */}
          {loading && (
            <div className={`${styles.msgRow} ${styles.msgRowBot}`}>
              <div className={`${styles.avatarWrap} ${styles.avatarBot}`}>
                <Bot size={16} />
              </div>
              <div className={styles.bubbleCol}>
                <div className={styles.bubbleHeader}>
                  <span className={styles.senderName} data-no-translate="">NeuroBot</span>
                </div>
                <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typingBubble}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 1 && (
          <div className={styles.quickPrompts}>
            <div className={styles.quickPromptsTitle}>
              <Sparkles size={13} className={styles.sparkleIcon} />
              <span>{t('bot.qHeader') || 'Pertanyaan yang sering diajukan:'}</span>
            </div>
            <div className={styles.chipsScroll}>
              {[t('bot.q1'), t('bot.q2'), t('bot.q3')].map((q, idx) => (
                <button
                  key={idx}
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
          </div>
        )}

        {/* Area Input Pesan */}
        <div className={styles.chatInputArea}>
          <div className={styles.inputWrap}>
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
              title={t('bot.send')}
            >
              <Send size={16} />
            </button>
          </div>

          <div className={styles.chatInputFooter}>
            <span className={styles.enterHint}>{t('bot.enterHint')}</span>
          </div>
        </div>

        {/* Catatan Kaki / Disclaimer */}
        <div className={styles.disclaimer}>
          {t('bot.disclaimer')}
        </div>
      </div>
    </>
  );
}
