import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Lock, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  CheckCheck, 
  Play, 
  Pause, 
  Image as ImageIcon,
  ArrowLeft,
  X,
  Volume2,
  BarChart2,
  FileText,
  Check,
  Sparkles,
  Users,
  AtSign
} from 'lucide-react';
import { Chat, Message, User, PollData } from '../types';
import { CreatePollModal } from './CreatePollModal';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  currentUser: User;
  onSendMessage: (
    text: string, 
    mediaType?: 'image' | 'audio' | 'video' | 'file' | 'sticker' | 'gif', 
    mediaUrl?: string, 
    audioDuration?: string
  ) => void;
  onSendPoll?: (poll: PollData) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onOpenChatInfo: () => void;
  onOpenPrivacyInfo: () => void;
  onBackToSidebar?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '👏', '🎉', '🙌', '🚀', '💯', '✨', '😍', '☕'];

const STICKER_PACK = [
  { id: 'stk-1', name: 'Party Yapp 🎉', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80' },
  { id: 'stk-2', name: 'Rocket Boost 🚀', url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=300&q=80' },
  { id: 'stk-3', name: 'Big Love ❤️', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80' },
  { id: 'stk-4', name: 'High Five 🙌', url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=300&q=80' },
  { id: 'stk-5', name: 'Fire Energy 🔥', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80' },
  { id: 'stk-6', name: 'Coffee Break ☕', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80' },
];

const GIF_PACK = [
  { id: 'gif-1', title: 'Excited Celebration', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80' },
  { id: 'gif-2', title: 'Mind Blown', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
  { id: 'gif-3', title: 'Thumbs Up Victory', url: 'https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?auto=format&fit=crop&w=400&q=80' },
  { id: 'gif-4', title: 'Team High Energy', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80' },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onSendPoll,
  onVotePoll,
  onStartCall,
  onOpenChatInfo,
  onOpenPrivacyInfo,
  onBackToSidebar,
}) => {
  const [inputText, setInputText] = useState('');
  const [mediaDrawerTab, setMediaDrawerTab] = useState<'emoji' | 'sticker' | 'gif' | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSpeeds, setPlaybackSpeeds] = useState<Record<string, '1x' | '1.5x' | '2x'>>({});
  const [showMentionPopup, setShowMentionPopup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice recording simulation timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Detect @ symbol for mentions
    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentionPopup(true);
    } else {
      setShowMentionPopup(false);
    }
  };

  const handleSelectMention = (mentionTag: string) => {
    const words = inputText.split(' ');
    words.pop(); // Remove the incomplete @
    words.push(mentionTag + ' ');
    setInputText(words.join(' '));
    setShowMentionPopup(false);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setMediaDrawerTab(null);
    setShowMentionPopup(false);
  };

  const handleSendSticker = (stickerUrl: string, name: string) => {
    onSendMessage(name, 'sticker', stickerUrl);
    setMediaDrawerTab(null);
  };

  const handleSendGif = (gifUrl: string, title: string) => {
    onSendMessage(title, 'gif', gifUrl);
    setMediaDrawerTab(null);
  };

  const handleStopAndSendVoice = () => {
    setIsRecording(false);
    const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 6}`;
    onSendMessage(`Voice note (${durationStr})`, 'audio', undefined, durationStr);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
      onSendMessage(file.name, 'image', fileUrl);
    } else {
      onSendMessage(file.name, 'file', fileUrl);
    }
    setShowAttachmentMenu(false);
  };

  const toggleAudioPlay = (msgId: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      setTimeout(() => {
        setPlayingAudioId((curr) => (curr === msgId ? null : curr));
      }, 5000);
    }
  };

  const togglePlaybackSpeed = (msgId: string) => {
    setPlaybackSpeeds((prev) => {
      const current = prev[msgId] || '1x';
      const next = current === '1x' ? '1.5x' : current === '1.5x' ? '2x' : '1x';
      return { ...prev, [msgId]: next };
    });
  };

  const renderMessageContent = (msg: Message) => {
    // 1. POLL RENDERING
    if (msg.poll) {
      const poll = msg.poll;
      const totalVotes = poll.options.reduce((acc, o) => acc + o.voterIds.length, 0);

      return (
        <div className="w-full min-w-[240px] sm:min-w-[300px] p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-2xl text-white space-y-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-snug">{poll.question}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {poll.allowMultiple ? 'Select one or more options' : 'Select one option'} • Tap option to vote
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {poll.options.map((opt) => {
              const isSelected = opt.voterIds.includes(currentUser.id);
              const percent = totalVotes > 0 ? Math.round((opt.voterIds.length / totalVotes) * 100) : 0;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onVotePoll?.(msg.id, opt.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'border-emerald-500/80 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  {/* Progress bar fill */}
                  <div
                    className="absolute inset-0 bg-emerald-500/20 transition-all duration-300 pointer-events-none"
                    style={{ width: `${percent}%` }}
                  />

                  <div className="relative flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-semibold truncate">{opt.text}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 shrink-0">
                      <span>{opt.voterIds.length}</span>
                      {totalVotes > 0 && <span className="text-[10px] text-emerald-400">({percent}%)</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            <span>{totalVotes} total votes</span>
            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
              <Lock className="w-2.5 h-2.5" /> End-to-end encrypted
            </span>
          </div>
        </div>
      );
    }

    // 2. STICKER RENDERING
    if (msg.mediaType === 'sticker') {
      return (
        <div className="p-1">
          <img
            src={msg.mediaUrl}
            alt={msg.text}
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-2xl drop-shadow-md hover:scale-105 transition-transform"
          />
          <div className="text-[10px] text-slate-400 text-right mt-1">{msg.text}</div>
        </div>
      );
    }

    // 3. GIF RENDERING
    if (msg.mediaType === 'gif') {
      return (
        <div className="rounded-xl overflow-hidden max-w-xs space-y-1">
          <div className="relative">
            <img
              src={msg.mediaUrl}
              alt={msg.text}
              className="w-full h-40 object-cover rounded-xl"
            />
            <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded">
              GIF
            </span>
          </div>
          <p className="text-xs text-slate-200">{msg.text}</p>
        </div>
      );
    }

    // 4. IMAGE ATTACHMENT
    if (msg.mediaType === 'image') {
      return (
        <div className="mb-2 rounded-xl overflow-hidden max-w-sm">
          <img
            src={msg.mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
            alt="Shared media"
            className="w-full h-auto max-h-60 object-cover rounded-xl"
          />
        </div>
      );
    }

    // 5. AUDIO / VOICE NOTE
    if (msg.mediaType === 'audio') {
      const isMe = msg.senderId === currentUser.id;
      const isPlaying = playingAudioId === msg.id;
      const speed = playbackSpeeds[msg.id] || '1x';

      return (
        <div className="flex items-center gap-3 py-1 min-w-[220px] sm:min-w-[250px]">
          <button
            onClick={() => toggleAudioPlay(msg.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
              isMe ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-emerald-500 text-slate-950 font-bold'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-0.5 h-6 mb-1">
              {[40, 70, 30, 90, 60, 80, 45, 100, 30, 70, 50, 85, 40, 65, 90, 50].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-1 rounded-full transition-all ${
                    isPlaying
                      ? 'bg-emerald-400 animate-pulse'
                      : isMe ? 'bg-emerald-300/60' : 'bg-slate-500/60'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] opacity-85">
              <span className="flex items-center gap-1 font-medium">
                <Volume2 className="w-3 h-3" />
                Voice note
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{msg.audioDuration || '0:18'}</span>
                <button
                  type="button"
                  onClick={() => togglePlaybackSpeed(msg.id)}
                  className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-bold text-[9px] hover:bg-slate-700"
                >
                  {speed}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 6. REGULAR TEXT WITH MENTION HIGHLIGHTING
    return (
      <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
        {msg.text.split(' ').map((token, idx) => {
          if (token.startsWith('@')) {
            return (
              <span
                key={idx}
                className="inline-block font-semibold text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded-md mx-0.5"
              >
                {token}{' '}
              </span>
            );
          }
          return token + ' ';
        })}
      </p>
    );
  };

  return (
    <div id="chat-area" className="flex-1 flex flex-col h-full bg-slate-950 min-w-0 select-none">
      {/* Chat Header */}
      <div id="chat-header" className="h-16 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToSidebar && (
            <button 
              type="button"
              id="chat-back-to-list-btn"
              onClick={onBackToSidebar}
              className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              title="Back to all chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div 
            onClick={onOpenChatInfo}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="relative shrink-0">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover group-hover:ring-2 ring-emerald-500 transition-all"
              />
              {chat.type === 'direct' && chat.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-sm text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                  {chat.name}
                </h2>
                {chat.isEncrypted && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPrivacyInfo();
                    }}
                    title="End-to-End Encrypted" 
                    className="text-emerald-400 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {chat.type === 'group' 
                  ? `${chat.participants.length} members • Tap for group info`
                  : chat.isOnline ? 'Online now' : 'End-to-End Encrypted'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons: Clear Calling */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id="start-audio-call-btn"
            onClick={() => onStartCall('audio')}
            title="Start Clear Audio Call"
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
          </button>
          
          <button
            id="start-video-call-btn"
            onClick={() => onStartCall('video')}
            title="Start HD Video Call"
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenChatInfo}
            title="Conversation Options"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div id="messages-container" className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
        {/* Encryption Security Banner */}
        <div 
          onClick={onOpenPrivacyInfo}
          className="max-w-md mx-auto my-2 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400 cursor-pointer hover:border-emerald-500/40 transition-colors shadow-sm"
        >
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Messages and calls are secured with default end-to-end encryption. No one outside of this chat, not even Yapp It, can read or listen to them.
          </p>
        </div>

        {/* Message bubbles */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          return (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Group sender name */}
              {chat.type === 'group' && !isMe && (
                <span className="text-[11px] font-semibold text-emerald-400 ml-3 mb-1">
                  {msg.senderName}
                </span>
              )}

              <div className="relative max-w-[88%] sm:max-w-[75%]">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/50'
                  }`}
                >
                  {renderMessageContent(msg)}

                  {/* Metadata: Time and Status */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline" />
                    )}
                  </div>
                </div>

                {/* Reactions badge */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <span
                        key={emoji}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/60 rounded-full text-xs shadow-xs"
                      >
                        <span>{emoji}</span>
                        {count > 1 && <span className="text-[10px] text-slate-300 font-semibold">{count}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Active Bar */}
      {isRecording && (
        <div className="px-4 py-2.5 bg-emerald-950/90 border-t border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="font-semibold">Recording Voice Note...</span>
            <span className="font-mono text-white">0:0{recordSeconds}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsRecording(false)}
              className="px-2.5 py-1 text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStopAndSendVoice}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
            >
              Send Note
            </button>
          </div>
        </div>
      )}

      {/* Mentions Autocomplete Popup */}
      {showMentionPopup && (
        <div className="p-2 border-t border-slate-800 bg-slate-900 shadow-xl space-y-1 max-h-40 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
            <AtSign className="w-3 h-3 text-emerald-400" />
            <span>Mention in this chat</span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectMention('@all')}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              @
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400">@all</span>
              <span className="text-[10px] text-slate-400 ml-2">Notify everyone in this chat</span>
            </div>
          </button>

          {chat.participants.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectMention(`@${p.name.split(' ')[0]}`)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
            >
              <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
              <span className="text-xs font-medium text-white">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Options Popover */}
      {showAttachmentMenu && (
        <div className="p-3 border-t border-slate-800 bg-slate-900 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-200 transition-colors"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Photos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-200 transition-colors"
          >
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Document</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachmentMenu(false);
              setShowPollModal(true);
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700/80 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-200 transition-colors"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-400">Create Poll</span>
          </button>
        </div>
      )}

      {/* Expression Drawer (Emojis, Stickers, GIFs) */}
      {mediaDrawerTab !== null && (
        <div className="border-t border-slate-800 bg-slate-900 flex flex-col">
          {/* Drawer Tabs */}
          <div className="flex border-b border-slate-800 px-3 bg-slate-850">
            <button
              type="button"
              onClick={() => setMediaDrawerTab('emoji')}
              className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
                mediaDrawerTab === 'emoji' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'
              }`}
            >
              😀 Emojis
            </button>
            <button
              type="button"
              onClick={() => setMediaDrawerTab('sticker')}
              className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
                mediaDrawerTab === 'sticker' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'
              }`}
            >
              🏷️ Stickers
            </button>
            <button
              type="button"
              onClick={() => setMediaDrawerTab('gif')}
              className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
                mediaDrawerTab === 'gif' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'
              }`}
            >
              🎬 GIFs
            </button>
            <button
              type="button"
              onClick={() => setMediaDrawerTab(null)}
              className="ml-auto p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-3 max-h-48 overflow-y-auto">
            {mediaDrawerTab === 'emoji' && (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setMediaDrawerTab(null);
                    }}
                    className="p-2 text-xl hover:bg-slate-800 rounded-lg transition-transform active:scale-125 text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {mediaDrawerTab === 'sticker' && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {STICKER_PACK.map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => handleSendSticker(stk.url, stk.name)}
                    className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center gap-1 group transition-all"
                  >
                    <img src={stk.url} alt={stk.name} className="w-14 h-14 object-contain rounded-lg group-hover:scale-105 transition-transform" />
                    <span className="text-[10px] text-slate-300 truncate w-full text-center">{stk.name}</span>
                  </button>
                ))}
              </div>
            )}

            {mediaDrawerTab === 'gif' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GIF_PACK.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleSendGif(gif.url, gif.title)}
                    className="relative rounded-xl overflow-hidden group border border-slate-800 hover:border-emerald-500/50 transition-all"
                  >
                    <img src={gif.url} alt={gif.title} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                      {gif.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
      />

      {/* Message Input Form */}
      <form
        id="message-input-form"
        onSubmit={handleSendText}
        className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2 shrink-0"
      >
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu((prev) => !prev)}
          title="Share Photos, Files, or Create Poll"
          className={`p-2 rounded-xl transition-colors ${
            showAttachmentMenu ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Expression (Emoji, Stickers, GIFs) Button */}
        <button
          type="button"
          onClick={() => setMediaDrawerTab((prev) => (prev ? null : 'emoji'))}
          title="Emojis, Stickers, & GIFs"
          className={`p-2 rounded-xl transition-colors ${
            mediaDrawerTab ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          id="message-text-input"
          type="text"
          placeholder={chat.type === 'group' ? 'Message, @mention, or voice note...' : 'Message or voice note...'}
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />

        {/* Voice Note Button or Send Button */}
        {inputText.trim() ? (
          <button
            id="send-message-btn"
            type="submit"
            className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors shadow-sm shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            id="voice-record-btn"
            type="button"
            onClick={() => {
              if (isRecording) {
                handleStopAndSendVoice();
              } else {
                setIsRecording(true);
              }
            }}
            title={isRecording ? 'Stop & Send Recording' : 'Hold or click to record voice note'}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              isRecording 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Create Poll Modal */}
      {showPollModal && (
        <CreatePollModal
          creatorName={currentUser.name}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={(poll) => onSendPoll?.(poll)}
        />
      )}
    </div>
  );
};
