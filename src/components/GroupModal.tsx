import { useState } from 'react';
import { X, Users, Check, Camera, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';

interface GroupModalProps {
  availableUsers: User[];
  onClose: () => void;
  onCreateGroup: (name: string, description: string, memberIds: string[], avatarUrl: string) => void;
}

const DEFAULT_GROUP_AVATARS = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=200&q=80',
];

export const GroupModal = ({
  availableUsers,
  onClose,
  onCreateGroup,
}: GroupModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_GROUP_AVATARS[0]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedUserIds.length === 0) return;
    onCreateGroup(name.trim(), description.trim(), selectedUserIds, selectedAvatar);
  };

  return (
    <div id="group-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="group-modal-container"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">New Group Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="p-4 overflow-y-auto space-y-4">
          {/* Avatar chooser */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Group Avatar
            </label>
            <div className="flex items-center gap-3">
              <img
                src={selectedAvatar}
                alt="Group avatar"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500"
              />
              <div className="flex gap-2">
                {DEFAULT_GROUP_AVATARS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Option ${i}`}
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-9 h-9 rounded-full object-cover cursor-pointer transition-all ${
                      selectedAvatar === url ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Group Subject / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Parivaar Group, Tech Core, Project X"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Group Description (Optional)
            </label>
            <input
              type="text"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Select Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Select Members ({selectedUserIds.length} chosen)
              </label>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 border border-slate-800 rounded-xl bg-slate-850/50">
              {availableUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-600/15' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.about || user.phone}</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
