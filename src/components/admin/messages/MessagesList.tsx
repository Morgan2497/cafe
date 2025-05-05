import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  reply?: {
    text: string;
    repliedAt: Timestamp;
  };
}

const MessagesList: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(messagesQuery);

        const messagesList: Message[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          messagesList.push({
            id: docSnap.id,
            name: data.name || 'Unknown',
            email: data.email || 'No email provided',
            subject: data.subject || 'No subject',
            message: data.message || '',
            read: data.read || false,
            createdAt: data.createdAt || null,
            reply: data.reply || undefined
          });
        });

        setMessages(messagesList);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const markAsRead = async (message: Message) => {
    try {
      const messageRef = doc(db, 'messages', message.id);
      await updateDoc(messageRef, { read: true });

      setMessages(messages.map(m =>
        m.id === message.id ? { ...m, read: true } : m
      ));

      if (selectedMessage && selectedMessage.id === message.id) {
        setSelectedMessage({ ...selectedMessage, read: true });
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const sendReply = async (message: Message) => {
    if (!replyText.trim()) {
      alert('Reply cannot be empty');
      return;
    }

    try {
      const messageRef = doc(db, 'messages', message.id);
      await updateDoc(messageRef, {
        reply: {
          text: replyText,
          repliedAt: Timestamp.now()
        }
      });

      alert('Reply sent successfully!');
      setReplyText('');
      closeMessageDetail();
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply.');
    }
  };

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp || !timestamp.toDate) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const viewMessageDetail = (message: Message) => {
    setSelectedMessage(message);
    setReplyText(message.reply?.text || '');
    setShowMessageDetail(true);
    if (!message.read) markAsRead(message);
  };

  const closeMessageDetail = () => {
    setShowMessageDetail(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><p>Loading messages...</p></div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><p>No messages found.</p></div>;
  }

  const renderMessageDetail = () => {
    if (!selectedMessage) return null;

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '8px', padding: '2rem',
          maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>{selectedMessage.subject}</h2>
            <button
              onClick={closeMessageDetail}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >×</button>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <p><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
            <p><strong>Date:</strong> {formatDate(selectedMessage.createdAt)}</p>
          </div>

          <div style={{
            backgroundColor: '#fff', padding: '1rem',
            borderRadius: '4px', border: '1px solid #eee', whiteSpace: 'pre-wrap'
          }}>
            {selectedMessage.message}
          </div>

          {selectedMessage.reply && (
            <div style={{ backgroundColor: '#e8f5e9', padding: '1rem', borderRadius: '4px', marginTop: '1.5rem' }}>
              <strong>Your Previous Reply:</strong>
              <p>{selectedMessage.reply.text}</p>
              <small>{formatDate(selectedMessage.reply.repliedAt)}</small>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Reply to this message:</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              onClick={() => sendReply(selectedMessage)}
              style={{
                marginTop: '1rem', padding: '0.5rem 1rem',
                backgroundColor: '#2ecc71', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              Send Reply
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2>Customer Messages</h2>
      {showMessageDetail && renderMessageDetail()}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>From</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Subject</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {messages.map(message => (
            <tr key={message.id} style={{
              borderBottom: '1px solid #eee',
              backgroundColor: message.read ? 'transparent' : '#f9f9f9'
            }}>
              <td style={{ padding: '10px' }}>
                <span style={{
                  padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem',
                  backgroundColor: message.read ? '#e0e0e0' : '#bbdefb',
                  color: message.read ? '#757575' : '#1565c0'
                }}>
                  {message.read ? 'Read' : 'Unread'}
                </span>
              </td>
              <td style={{ padding: '10px' }}>{formatDate(message.createdAt)}</td>
              <td style={{ padding: '10px' }}>{message.name}</td>
              <td style={{ padding: '10px' }}>
                <div style={{
                  fontWeight: message.read ? 'normal' : 'bold',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: '250px'
                }}>
                  {message.subject}
                </div>
              </td>
              <td style={{ padding: '10px' }}>
                <button
                  onClick={() => viewMessageDetail(message)}
                  style={{
                    padding: '5px 10px', backgroundColor: '#3498db', color: 'white',
                    border: 'none', borderRadius: '4px', marginRight: '5px', cursor: 'pointer'
                  }}
                >
                  View
                </button>
                {!message.read && (
                  <button
                    onClick={() => markAsRead(message)}
                    style={{
                      padding: '5px 10px', backgroundColor: '#2c3e50', color: 'white',
                      border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MessagesList;
