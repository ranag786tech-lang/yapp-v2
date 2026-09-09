import { useState, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  Eye, 
  ShieldCheck, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Send,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { StatusStory, User } from '../types';

interface StatusViewProps {
  stories: StatusStory[];
  currentUser: User;
  onAddStory: (story: StatusStory) => void;
  onBack?: () => void;
}

export const StatusView = ({ stories, currentUser, onAddStory, onBack }: StatusViewProps) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'
  );

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  // Auto-advance progress when a story is active
  useEffect(() => {
    if (activeStoryIndex === null) return;

    setStoryProgress(0);
    const stepTime = 50; // 50ms
    const totalDuration = 5000; // 5s total
    const increment = (stepTime / totalDuration) * 100;

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Go to next story or close
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + increment;
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [activeStoryIndex, stories.length]);

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const newStory: StatusStory = {
      id: `story-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      mediaUrl: selectedPhoto,
      caption: newCaption.trim() || 'Enjoying life with Yapp It ✨',
      timestamp: 'Just now',
      isViewed: false,
    };
    onAddStory(newStory);
    setShowAddModal(false);
    setNewCaption('');
  };

  const samplePhotos = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <div id="status-view" className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="status-back-button"
              onClick={onBack}
              className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 rounded-full transition-colors flex items-center justify-center shrink-0"
              title="Back to Chats"
              aria-label="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Status</h1>
            <p className="text-xs text-slate-400">Disappears after 24 hours • End-to-end encrypted</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md font-semibold flex items-center gap-1 text-xs"
        >
          <Camera className="w-4 h-4" />
          <span>Add Status</span>
        </button>
      </div>

      {/* Stories list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* My Status Card */}
        <div
          onClick={() => setShowAddModal(true)}
          className="p-3 bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full text-slate-950 ring-2 ring-slate-900">
                <Plus className="w-3 h-3" />
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">My Status</h3>
              <p className="text-xs text-slate-400">Tap to add status update</p>
            </div>
          </div>

          <div className="p-2 text-indigo-400 hover:text-white bg-slate-800 rounded-xl">
            <Camera className="w-4 h-4" />
          </div>
        </div>

        {/* Recent Updates Header */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">
          Recent updates ({stories.length})
        </div>

        {/* Contacts Story Cards */}
        <div className="space-y-2">
          {stories.map((story, index) => (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(index)}
              className="p-3 flex items-center justify-between bg-slate-850/40 hover:bg-slate-850 border border-slate-800/80 rounded-2xl cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3.5">
                {/* Glowing ring */}
                <div
                  className={`p-0.5 rounded-full ${
                    story.isViewed
                      ? 'border-2 border-slate-600'
                      : 'border-2 border-emerald-400 ring-2 ring-emerald-500/20'
                  }`}
                >
                  <img
                    src={story.userAvatar}
                    alt={story.userName}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{story.userName}</h4>
                  <p className="text-xs text-slate-400">{story.timestamp}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={story.mediaUrl}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Privacy Notice */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Your status updates are end-to-end encrypted and visible only to your contacts</span>
      </div>

      {/* FULL-SCREEN STORY VIEWER MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full max-w-md h-full bg-slate-950 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Top Progress bar */}
            <div className="p-3 flex items-center gap-1 z-20">
              {stories.map((s, idx) => {
                let barFill = 0;
                if (idx < (activeStoryIndex || 0)) barFill = 100;
                else if (idx === activeStoryIndex) barFill = storyProgress;

                return (
                  <div
                    key={s.id}
                    className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      style={{ width: `${barFill}%` }}
                      className="h-full bg-white transition-all duration-75"
                    />
                  </div>
                );
              })}
            </div>

            {/* Top Header details */}
            <div className="px-4 py-2 flex items-center justify-between z-20 text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStory.userAvatar}
                  alt={activeStory.userName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-400"
                />
                <div>
                  <p className="text-xs font-bold leading-tight">{activeStory.userName}</p>
                  <p className="text-[10px] text-slate-300">{activeStory.timestamp}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryIndex(null)}
                className="p-1 text-white/80 hover:text-white rounded-full bg-black/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Story Image */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <img
                src={activeStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-contain"
              />

              {/* Tap Left / Right navigation triggers */}
              <div
                onClick={() => {
                  if ((activeStoryIndex || 0) > 0) {
                    setActiveStoryIndex((activeStoryIndex || 0) - 1);
                  }
                }}
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
              />
              <div
                onClick={() => {
                  if ((activeStoryIndex || 0) < stories.length - 1) {
                    setActiveStoryIndex((activeStoryIndex || 0) + 1);
                  } else {
                    setActiveStoryIndex(null);
                  }
                }}
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
              />
            </div>

            {/* Caption & Reply Box */}
            <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-20 space-y-3">
              {activeStory.caption && (
                <p className="text-white text-center text-sm font-medium drop-shadow-md">
                  {activeStory.caption}
                </p>
              )}

              {/* Reply field */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Reply to status..."
                  className="flex-1 bg-white/20 border border-white/30 rounded-full px-4 py-2 text-xs text-white placeholder-white/70 focus:outline-none focus:bg-black/50 transition-all"
                />
                <button className="p-2 bg-emerald-500 rounded-full text-slate-950">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Status Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                Add Status Update
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo preview */}
            <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
              <img
                src={selectedPhoto}
                alt="Status Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Choose sample image */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Choose sample photo:</p>
              <div className="grid grid-cols-4 gap-2">
                {samplePhotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Option ${i}`}
                    onClick={() => setSelectedPhoto(url)}
                    className={`h-12 w-full object-cover rounded-lg cursor-pointer transition-all ${
                      selectedPhoto === url ? 'ring-2 ring-emerald-400 scale-105' : 'opacity-60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Add a caption...</label>
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="What's happening today?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleCreateStatus}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share to My Status</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
