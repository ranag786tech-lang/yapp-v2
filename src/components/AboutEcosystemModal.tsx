import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  BarChart2, 
  Globe, 
  HelpCircle, 
  FileText, 
  Building2, 
  Sparkles, 
  Check, 
  ExternalLink,
  ChevronRight,
  PhoneCall,
  Lock,
  Radio,
  Zap,
  Award
} from 'lucide-react';
import { YappLogo } from './YappLogo';

interface AboutEcosystemModalProps {
  onClose: () => void;
}

export const AboutEcosystemModal: React.FC<AboutEcosystemModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'identity' | 'security' | 'help' | 'legal'>('highlights');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareApp = () => {
    navigator.clipboard?.writeText?.('https://yappit.app - Simple, reliable, end-to-end encrypted messaging and calling.');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <YappLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">About Yapp It &amp; Ecosystem</h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                  v2.4 LTS
                </span>
              </div>
              <p className="text-xs text-slate-400">Yapp It LLC • An independent communication platform by Digid</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'highlights'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>News &amp; Tips</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Yapp It LLC</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Security &amp; Passkeys</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'help'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Help Center</span>
          </button>

          <button
            onClick={() => setActiveTab('legal')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'legal'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Legal &amp; Policy</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* TAB 1: RECENT HIGHLIGHTS & TIPS */}
          {activeTab === 'highlights' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Core Platform Update
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">Universal Privacy &amp; Group Coordination</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Yapp It positions itself as a secure, universal communication platform that blends personal intimacy (friends &amp; family), expressive tools (stickers, voice notes), and group collaboration enhancements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Feature 1: Passkeys */}
                <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Passkeys &amp; Account Security</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    Over a billion users now protected with passkeys! Sign in with your device biometric fingerprint or face scan without relying on vulnerable SMS codes.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Active on this device
                  </span>
                </div>

                {/* Feature 2: Enhanced Groups */}
                <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Interactive Polls &amp; @all Mentions</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    Effortless group decision-making: create multi-option encrypted polls and notify members instantly with <code className="text-emerald-400 bg-slate-800 px-1 rounded">@all</code>.
                  </p>
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                    Available in all groups
                  </span>
                </div>

                {/* Feature 3: Web Calling */}
                <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Browser-Based Web Calling</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    Make and receive high-definition encrypted audio &amp; video calls directly inside any modern web browser with spatial audio simulation and AI noise suppression.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    No downloads required
                  </span>
                </div>

                {/* Feature 4: Expression */}
                <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Stickers, GIFs &amp; Voice Speed</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    Express emotions with curated Yapp sticker packs, instant animated reaction GIFs, and voice notes with 1.5x / 2x playback speed toggles.
                  </p>
                  <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider">
                    Full expression suite
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATIONAL IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Yapp It LLC</h3>
                    <p className="text-xs text-slate-400">Independent subsidiary owned by Digid</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Yapp It LLC operates as a privacy-first communication enterprise. While proudly backed by Digid's infrastructure, Yapp It is branded and governed independently with zero monetization of user messages, call logs, or metadata.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Headquarters</span>
                    <span className="text-white font-semibold">Silicon Valley &amp; Zurich</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Architecture</span>
                    <span className="text-white font-semibold">Decentralized E2EE</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Parent Company</span>
                    <span className="text-white font-semibold">Digid Group Inc.</span>
                  </div>
                </div>
              </div>

              {/* Portal Links */}
              <div className="bg-slate-850 border border-slate-800 rounded-2xl divide-y divide-slate-800">
                <div className="p-3.5 flex items-center justify-between text-xs font-semibold text-white hover:bg-slate-800/60 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Brand Center &amp; Press Assets</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-3.5 flex items-center justify-between text-xs font-semibold text-white hover:bg-slate-800/60 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Careers @ Yapp It (Open Engineering Roles)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-3.5 flex items-center justify-between text-xs font-semibold text-white hover:bg-slate-800/60 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    <span>Yapp It Official Engineering Blog</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSKEYS */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Default End-to-End Encryption</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every message, call, photo, video, and document sent on Yapp It is locked with unique cryptographic keys generated on your device. Only you and the recipient hold the keys to unlock them. Even Yapp It itself cannot read or listen to your communication.
                </p>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Default Protection: Encryption is automatic—users never need to manually configure it.</span>
                </div>
              </div>

              <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Passkeys &amp; FIDO2 Authentication</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Yapp It implements the modern FIDO Alliance WebAuthn standard. Over a billion accounts are shielded from SIM-swapping and credential stuffing through hardware-bound biometric authentication.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                    🔒 Biometric Touch ID / Face ID
                  </span>
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                    🛡️ Phishing-Resistant
                  </span>
                  <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                    🔑 FIDO2 / WebAuthn Certified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HELP CENTER */}
          {activeTab === 'help' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Frequently Asked Questions</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <details className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 cursor-pointer">
                    <summary className="font-semibold text-white">How does Web Calling work in Yapp It?</summary>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      Yapp It uses browser-native WebRTC with hardware acceleration. You can make or receive calls directly on Google Chrome, Safari, Edge, or Firefox without downloading third-party plugins.
                    </p>
                  </details>

                  <details className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 cursor-pointer">
                    <summary className="font-semibold text-white">How do I create group polls?</summary>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      Tap the paperclip or (+) attachment button at the bottom of any group chat and choose &quot;Create Poll&quot;. Add your question and options. All members can vote immediately with live percentage bars.
                    </p>
                  </details>

                  <details className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 cursor-pointer">
                    <summary className="font-semibold text-white">Can I mention everyone in a group?</summary>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      Yes! Simply type <span className="text-emerald-400 font-bold">@all</span> or pick a contact from the popup list to highlight and notify members.
                    </p>
                  </details>
                </div>
              </div>

              {/* Network Diagnostic */}
              <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Connection &amp; Relay Status</h4>
                  <p className="text-[11px] text-slate-400">WebSocket Ping: 18ms • WebRTC STUN/TURN: Connected</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Operational</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEGAL & POLICY */}
          {activeTab === 'legal' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Terms of Service &amp; Privacy Policy</span>
                </h3>
                <p className="leading-relaxed">
                  Yapp It LLC is committed to transparency. Because all data is protected under default end-to-end encryption, we do not store your chat transcripts, voice messages, call recordings, or media on central servers.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span>Privacy Policy (Last updated February 2026)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span>Terms of Service (Yapp It LLC)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                    <span>Security Advisories &amp; Cryptographic Whitepaper</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between shrink-0">
          <button
            onClick={handleShareApp}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Globe className="w-4 h-4" />}
            <span>{copiedLink ? 'Link copied to clipboard!' : 'Share Yapp It Web'}</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
