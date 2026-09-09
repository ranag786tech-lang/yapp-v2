import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2, CheckCircle2, Shield } from 'lucide-react';
import { PollData, PollOption } from '../types';

interface CreatePollModalProps {
  onClose: () => void;
  onCreatePoll: (poll: PollData) => void;
  creatorName: string;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  onClose,
  onCreatePoll,
  creatorName,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!validQuestion || validOptions.length < 2) return;

    const pollOptions: PollOption[] = validOptions.map((text, idx) => ({
      id: `opt-${Date.now()}-${idx}`,
      text,
      voterIds: [],
    }));

    const pollData: PollData = {
      id: `poll-${Date.now()}`,
      question: validQuestion,
      options: pollOptions,
      allowMultiple,
      createdBy: creatorName,
      createdAt: 'Just now',
      isClosed: false,
    };

    onCreatePoll(pollData);
    onClose();
  };

  const isValid = question.trim().length > 0 && options.filter((o) => o.trim().length > 0).length >= 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create a Poll</h2>
              <p className="text-xs text-slate-400">Ask a question for smooth group decisions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Question
            </label>
            <input
              type="text"
              placeholder="e.g., Where should we meet for weekend football?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              autoFocus
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Options (min. 2)
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 text-center text-xs font-mono text-slate-400 font-semibold">
                    {idx + 1}.
                  </div>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          {/* Multiple answers toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white block">Allow multiple answers</span>
              <span className="text-[11px] text-slate-400">Voters can pick more than one option</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowMultiple(!allowMultiple)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                allowMultiple ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  allowMultiple ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Security note */}
          <div className="p-2.5 bg-slate-850/80 border border-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Poll responses are end-to-end encrypted like all Yapp It messages.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Post Poll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
