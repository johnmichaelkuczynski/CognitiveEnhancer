import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, ArrowUp, Upload } from "lucide-react";

interface AIChatProps {
  inputText: string;
  analysisOutput: string;
  analysisMode: string;
  onSendToInput: (text: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat({ inputText, analysisOutput, analysisMode, onSendToInput }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const sendMessage = async (messageText: string, includeContext: boolean = false) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: includeContext ? {
            inputText,
            analysisOutput,
            analysisMode
          } : undefined
        })
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.status === 'streaming' && data.content) {
                  fullResponse += data.content;
                  setCurrentResponse(fullResponse);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      if (fullResponse) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      }
      setCurrentResponse('');
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Failed to get response. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, false);
  };

  const sendWithContext = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input, true);
  };

  const sendInputToChat = () => {
    if (!inputText.trim()) return;
    sendMessage(`Here is the input text:\n\n${inputText}`, true);
  };

  const sendOutputToChat = () => {
    if (!analysisOutput.trim()) return;
    sendMessage(`Here is the analysis output:\n\n${analysisOutput}`, true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      setInput(prev => prev ? `${prev}\n\n${data.content}` : data.content);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-border bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">AI Chat</h2>
          <div className="flex gap-2">
            <Button
              onClick={sendInputToChat}
              variant="outline"
              size="sm"
              disabled={!inputText.trim() || isLoading}
              data-testid="button-send-input-to-chat"
            >
              Send Input to Chat
            </Button>
            <Button
              onClick={sendOutputToChat}
              variant="outline"
              size="sm"
              disabled={!analysisOutput.trim() || isLoading}
              data-testid="button-send-output-to-chat"
            >
              Send Output to Chat
            </Button>
          </div>
        </div>

        <Card className="bg-white p-4 mb-4 h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 && !currentResponse && (
              <div className="text-center text-muted-foreground py-20">
                <p className="text-lg mb-2">Start a conversation</p>
                <p className="text-sm">Ask me anything or send your input/output text for discussion</p>
              </div>
            )}
            
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  </div>
                  {message.role === 'assistant' && (
                    <Button
                      onClick={() => onSendToInput(message.content)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Send to Input"
                      data-testid={`button-send-message-${idx}-to-input`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {currentResponse && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg px-4 py-2 max-w-[80%]">
                  <div className="whitespace-pre-wrap break-words">{currentResponse}</div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type, paste, or upload text (Word/PDF supported)..."
              className="min-h-[120px] resize-none"
              disabled={isLoading}
              data-testid="input-chat-message"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-chat-file"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={isLoading}
                data-testid="button-upload-chat-file"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-[58px]"
              data-testid="button-send-chat"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={sendWithContext}
              disabled={!input.trim() || isLoading}
              variant="outline"
              className="h-[58px]"
              title="Send with analysis context"
              data-testid="button-send-with-context"
            >
              <Send className="h-4 w-4 mr-1" />
              +Ctx
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
