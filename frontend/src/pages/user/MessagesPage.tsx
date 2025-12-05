import { useEffect, useState } from 'react';
import { Input, Button, Spin, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  Conversation,
  Message,
  messageService,
} from '../../services/messageService';
import UserAvatar from '../../components/common/UserAvatar';
import styles from './MessagesPage.module.scss';

const MessagesPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await messageService.getConversations();
        setConversations(data.items);
        if (data.items.length > 0 && !selectedConv) {
          setSelectedConv(data.items[0]);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConv) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const data = await messageService.getMessages(selectedConv.id);
        setMessages(data.items.reverse()); // Reverse to show oldest first
        await messageService.markConversationRead(selectedConv.id);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedConv?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    setSending(true);
    try {
      const msg = await messageService.sendMessage({
        recipient_id: selectedConv.other_user.id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch (error) {
      message.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.messagesPage}>
      <div className={styles.container}>
        {/* Conversation List */}
        <div className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Messages</h2>
          {conversations.length === 0 ? (
            <div className={styles.empty}>No conversations</div>
          ) : (
            <div className={styles.convList}>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`${styles.convItem} ${selectedConv?.id === conv.id ? styles.active : ''}`}
                  onClick={() => setSelectedConv(conv)}
                >
                  <UserAvatar
                    src={conv.other_user.avatar}
                    username={conv.other_user.username}
                    size={40}
                  />
                  <div className={styles.convInfo}>
                    <div className={styles.convName}>
                      {conv.other_user.nickname || conv.other_user.username}
                    </div>
                    <div className={styles.convPreview}>
                      {conv.last_message_preview}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className={styles.unreadBadge}>{conv.unread_count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Area */}
        <div className={styles.main}>
          {selectedConv ? (
            <>
              <div className={styles.chatHeader}>
                <UserAvatar
                  src={selectedConv.other_user.avatar}
                  username={selectedConv.other_user.username}
                  size={36}
                />
                <span className={styles.chatName}>
                  {selectedConv.other_user.nickname || selectedConv.other_user.username}
                </span>
              </div>

              <div className={styles.messageList}>
                {messagesLoading ? (
                  <div className={styles.loading}><Spin /></div>
                ) : messages.length === 0 ? (
                  <div className={styles.noMessages}>No messages yet</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.message} ${msg.sender_id !== selectedConv.other_user.id ? styles.sent : styles.received}`}
                    >
                      <div className={styles.msgContent}>{msg.content}</div>
                      <div className={styles.msgTime}>
                        {dayjs(msg.created_at).format('HH:mm')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.inputArea}>
                <Input.TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sending}
                  disabled={!newMessage.trim()}
                />
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;

