'use client';

import React, { useState, useRef, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import ChatService, { ChatMessage } from '../_lib/ChatService';

type Props = {
    show: boolean;
    onHide: () => void;
};

export default function ChatModal({ show, onHide }: Props) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear history when modal closes
    useEffect(() => {
        if (!show) {
            setMessages([]);
            setInput('');
            setError(null);
        }
    }, [show]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setInput('');
        setError(null);

        // Add user message to local history
        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setSending(true);

        try {
            // Send only the user message; server returns LLM response
            const res = await ChatService.sendMessage(text);
            const assistantContent = res.data?.assistant || '(No response)';

            // Add assistant response to local history
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: assistantContent,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (e) {
            console.error(e);
            // Remove the optimistic user message on error
            setMessages(prev => prev.slice(0, -1));
            setError('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Chat Assistant (LLM + MCP Tools)</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-3" style={{ minHeight: 400 }}>
                    {/* Messages Container */}
                    <div
                        className="flex-1 overflow-y-auto p-3 border rounded"
                        style={{ borderColor: '#ddd', backgroundColor: '#f9f9f9' }}
                    >
                        {messages.length === 0 ? (
                            <div className="text-muted text-sm">No messages yet. Start a conversation!</div>
                        ) : (
                            <>
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`mb-3 ${m.role === 'user' ? 'text-end' : 'text-start'}`}>
                                        <div
                                            style={{
                                                display: 'inline-block',
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                background: m.role === 'user' ? '#007bff' : '#e9ecef',
                                                color: m.role === 'user' ? '#fff' : '#000',
                                                maxWidth: '85%',
                                                wordWrap: 'break-word',
                                            }}
                                        >
                                            <div className="text-xs opacity-75 mb-1 font-semibold">
                                                {m.role === 'user' ? 'You' : 'Assistant'}
                                            </div>
                                            <div className="text-sm">{m.content}</div>
                                            {m.created_at && (
                                                <div className="text-xs opacity-50 mt-1">
                                                    {new Date(m.created_at).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && <div className="text-danger text-sm">{error}</div>}

                    {/* Input Area */}
                    <InputGroup>
                        <Form.Control
                            placeholder="Type a message... (Shift+Enter for newline)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            as="textarea"
                            rows={2}
                            disabled={sending}
                        />
                        <Button
                            variant="primary"
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                        >
                            {sending ? <Spinner animation="border" size="sm" /> : 'Send'}
                        </Button>
                    </InputGroup>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-danger" size="sm" onClick={handleClearChat}>
                    Clear
                </Button>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}