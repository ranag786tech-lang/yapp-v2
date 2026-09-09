import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Check, 
  QrCode, 
  Wifi, 
  ChevronRight,
  Shield,
  Smartphone,
  Camera,
  Mic,
  Fingerprint,
  Users,
  Phone,
  MessageSquare,
  MapPin,
  FolderLock,
  Bluetooth,
  Bell,
  EyeOff,
  Activity,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Laptop,
  Globe,
  Sparkles,
  Info,
  X,
  ExternalLink,
  Download,
  Zap
} from 'lucide-react';
import { PrivacySettings, User, LinkedDevice } from '../types';
import { AboutEcosystemModal } from './AboutEcosystemModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PrivacySettingsViewProps {
  settings: PrivacySettings;
  currentUser: User;
  onUpdateSettings: (newSettings: Partial<PrivacySettings>) => void;
  onBack?: () => void;
}

export const PrivacySettingsView: React.FC<PrivacySettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'security' | 'devices' | 'permissions'>('privacy');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showQrLinkModal, setShowQrLinkModal] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeySuccessMessage, setPasskeySuccessMessage] = useState<string | null>(null);

  // PWA install hook
  const { isInstalled, openBanner, install } = usePWAInstall();

  // App-level permission manager state
  const [permissionStates, setPermissionStates] = useState<Record<string, boolean>>({
    camera: true,
    microphone: true,
    biometric: true,
    contacts: true,
    phone: true,
    sms: true,
    location: false,
    storage: true,
    network: true,
    foreground: true,
    screen_guard: true,
    bluetooth: true,
    notifications: true,
  });

  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>(
    settings.linkedDevices || [
      {
        id: 'dev-1',
        name: 'Yapp It Web',
        platform: 'web',
        browserOrOs: 'Google Chrome 128 on macOS',
        lastActive: 'Active now (This browser)',
        isCurrent: true,
        location: 'New Delhi, India',
      },
      {
        id: 'dev-2',
        name: 'Yapp It Desktop',
        platform: 'desktop',
        browserOrOs: 'Windows 11 Native 64-bit',
        lastActive: 'Yesterday at 8:40 PM',
        isCurrent: false,
        location: 'Mumbai, India',
      },
      {
        id: 'dev-3',
        name: 'Yapp It for Tablet',
        platform: 'tablet',
        browserOrOs: 'iPadOS 17.5',
        lastActive: '3 days ago',
        isCurrent: false,
        location: 'Bangalore, India',
      },
    ]
  );

  const notifyChange = (updated: Partial<PrivacySettings>) => {
    onUpdateSettings(updated);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const togglePermission = (key: string) => {
    setPermissionStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 1800);
  };

  const handleRegisterPasskey = () => {
    setIsRegisteringPasskey(true);
    setTimeout(() => {
      setIsRegisteringPasskey(false);
      setPasskeySuccessMessage('Passkey successfully registered via device biometric Enclave!');
      notifyChange({ passkeyEnabled: true, passkeyCount: (settings.passkeyCount || 1) + 1 });
      setTimeout(() => setPasskeySuccessMessage(null), 4000);
    }, 1800);
  };

  const handleUnlinkDevice = (deviceId: string) => {
    setLinkedDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 1800);
  };

  const PERMISSION_CONFIGS = [
    {
      id: 'camera',
      name: 'Camera Access',
      manifest: 'android.permission.CAMERA',
      category: 'Hardware',
      icon: Camera,
      purpose: 'Take photos & videos in chats, profile pictures, and high-definition video calls.',
      jitRule: 'Prompted only when user taps camera icon or answers video call.',
    },
    {
      id: 'microphone',
      name: 'Microphone Access',
      manifest: 'android.permission.RECORD_AUDIO',
      category: 'Hardware',
      icon: Mic,
      purpose: 'Record encrypted voice notes and facilitate low-latency voice/video calls.',
      jitRule: 'Prompted when tapping the mic icon or initiating any call.',
    },
    {
      id: 'biometric',
      name: 'Biometric / Fingerprint',
      manifest: 'android.permission.USE_BIOMETRIC',
      category: 'Hardware',
      icon: Fingerprint,
      purpose: 'Lock/unlock Yapp It securely using hardware biometric sensors (Fingerprint / Face ID / Passkeys).',
      jitRule: 'Prompted upon enabling app biometric lock or registering passkeys.',
    },
    {
      id: 'contacts',
      name: 'Contacts Access',
      manifest: 'android.permission.READ_CONTACTS',
      category: 'Communication',
      icon: Users,
      purpose: 'Identify friends & family already using Yapp It using cryptographic phone number hashing.',
      jitRule: 'Prompted during contact discovery with salted SHA-256 hashes.',
    },
    {
      id: 'phone',
      name: 'Phone State & Audio Focus',
      manifest: 'android.permission.READ_PHONE_STATE',
      category: 'Communication',
      icon: Phone,
      purpose: 'Gracefully pause voice notes or calls when an incoming cellular phone call arrives.',
      jitRule: 'Requested on first active call session.',
    },
    {
      id: 'sms',
      name: 'SMS Retriever API',
      manifest: 'SMS Retriever API (Zero Permissions)',
      category: 'Communication',
      icon: MessageSquare,
      purpose: 'Securely auto-fill OTP codes during initial registration without granting raw SMS reading permissions.',
      jitRule: 'Triggered during initial phone onboarding flow.',
    },
    {
      id: 'location',
      name: 'Live Location Sharing',
      manifest: 'android.permission.ACCESS_FINE_LOCATION',
      category: 'System',
      icon: MapPin,
      purpose: 'Share temporary, encrypted live location with friends or family in private chats.',
      jitRule: 'Strictly opt-in only when user chooses Share Location.',
    },
    {
      id: 'storage',
      name: 'Scoped Storage & Media',
      manifest: 'android.permission.READ_MEDIA_IMAGES',
      category: 'System',
      icon: FolderLock,
      purpose: 'Send and receive photos, videos, and documents without accessing entire device storage.',
      jitRule: 'Using Android Photo Picker (zero broad storage permission needed).',
    },
    {
      id: 'bluetooth',
      name: 'Bluetooth Audio Devices',
      manifest: 'android.permission.BLUETOOTH_CONNECT',
      category: 'Advanced',
      icon: Bluetooth,
      purpose: 'Route call audio automatically to wireless headphones and vehicle Bluetooth kits.',
      jitRule: 'Requested when Bluetooth device connects during call.',
    },
    {
      id: 'notifications',
      name: 'Push Notifications',
      manifest: 'android.permission.POST_NOTIFICATIONS',
      category: 'System',
      icon: Bell,
      purpose: 'Receive instant incoming call rings and end-to-end encrypted message previews.',
      jitRule: 'Prompted on first app launch after onboarding.',
    },
  ];

  return (
    <div id="privacy-settings-view" className="flex-1 flex flex-col h-full bg-slate-950 min-w-0 select-none">
      {/* Header */}
      <div className="h-16 px-4 md:px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base">Privacy &amp; Security</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Default E2EE
              </span>
            </div>
            <p className="text-xs text-slate-400">Passkeys, linked devices, and cryptographic permissions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSavedFeedback && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={() => setShowAboutModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Learn about Yapp It Ecosystem and Digid identity"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">About Yapp It</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-4 md:px-6 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Passkeys &amp; Security</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'devices'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Linked Devices &amp; Web</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'border-emerald-400 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Permissions Manager</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* TAB 1: PRIVACY CONTROLS */}
        {activeTab === 'privacy' && (
          <div className="max-w-2xl space-y-6">
            {/* Visibility Settings */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Who can see my personal info
              </h2>

              {/* Last Seen */}
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">Last seen &amp; online</h3>
                  <p className="text-xs text-slate-400">Controls whether contacts see when you were last active</p>
                </div>
                <select
                  value={settings.lastSeen}
                  onChange={(e) => notifyChange({ lastSeen: e.target.value as any })}
                  className="bg-slate-800 text-xs text-emerald-400 font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              {/* Read Receipts */}
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">Read receipts (Double check marks)</h3>
                  <p className="text-xs text-slate-400">If turned off, you won't send or receive read receipts</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.readReceipts}
                  onChange={(e) => notifyChange({ readReceipts: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                >
                </input>
              </div>

              {/* Disappearing Messages */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">Default message timer</h3>
                  <p className="text-xs text-slate-400">Start new chats with disappearing messages</p>
                </div>
                <select
                  value={settings.disappearingMessagesDefault}
                  onChange={(e) => notifyChange({ disappearingMessagesDefault: e.target.value as any })}
                  className="bg-slate-800 text-xs text-emerald-400 font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none"
                >
                  <option value="off">Off</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                  <option value="90d">90 days</option>
                </select>
              </div>
            </div>

            {/* Low Data Mode */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Low data mode for calls</h3>
                  <p className="text-xs text-slate-400">
                    Reduces bandwidth on 2G/3G networks using Opus dynamic bitrate scaling
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.lowDataForCalls}
                onChange={(e) => notifyChange({ lowDataForCalls: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 2: PASSKEYS & ACCOUNT SECURITY */}
        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            {/* Passkeys Highlight Card */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Passkeys &amp; Hardware Protection (FIDO2 Standard)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Over <strong>a billion users</strong> are now protected with passkeys on Yapp It. Sign in securely with your device fingerprint, Face ID, or Windows Hello. Passkeys are phishing-resistant and replace vulnerable SMS verification codes.
              </p>

              {passkeySuccessMessage && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{passkeySuccessMessage}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span>Registered passkeys on this account: </span>
                  <strong className="text-white">{settings.passkeyCount || 2}</strong>
                </div>

                <button
                  type="button"
                  disabled={isRegisteringPasskey}
                  onClick={handleRegisterPasskey}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  {isRegisteringPasskey ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Biometric...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Register New Passkey</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Default E2EE Protocol */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                <Shield className="w-5 h-5" />
                <span>Default Protection: Automatic End-to-End Encryption</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Yapp It protects every message, call, photo, video, and file with automatic 256-bit AES-GCM and ephemeral Diffie-Hellman ratchets. Encryption is built-in by default—users do not need to enable it manually. Even Yapp It itself cannot read or listen.
              </p>
            </div>

            {/* Safety Number & Key Verification */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Public Identity Fingerprint</h3>
                  <p className="text-xs text-slate-400">Ed25519 public safety number for peer verification</p>
                </div>
                <QrCode className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 grid grid-cols-3 gap-2 text-center">
                <span>49201</span>
                <span>83912</span>
                <span>00291</span>
                <span>94812</span>
                <span>74921</span>
                <span>19402</span>
              </div>
            </div>

            {/* App Biometric Lock */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Unlock with Biometrics</h3>
                  <p className="text-xs text-slate-400">Require Fingerprint or Face ID when opening Yapp It</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.fingerprintLock}
                onChange={(e) => notifyChange({ fingerprintLock: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 3: LINKED DEVICES & WEB */}
        {activeTab === 'devices' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white">Cross-Device Synchronization</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Use Yapp It across mobile, desktop, tablet, and browser-based Yapp It Web with seamless multi-device end-to-end encryption.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowQrLinkModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Link a Device</span>
              </button>
            </div>

            {/* Connected Sessions List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Currently Connected Devices ({linkedDevices.length})
              </h3>

              {linkedDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-800 text-indigo-400">
                      {dev.platform === 'web' ? (
                        <Globe className="w-5 h-5" />
                      ) : dev.platform === 'desktop' ? (
                        <Laptop className="w-5 h-5" />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{dev.name}</h4>
                        {dev.isCurrent && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{dev.browserOrOs}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{dev.lastActive} • {dev.location}</p>
                    </div>
                  </div>

                  {!dev.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleUnlinkDevice(dev.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      Log Out
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Progressive Web App (PWA) & Offline Status */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span>Progressive Web App (PWA) &amp; Offline Cache</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isInstalled ? 'Standalone Mode' : 'Web Installed'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Yapp It is fully compliant with the Progressive Web App standard. It features a standalone manifest, background Workbox service worker caching for offline access, and fast home screen launching.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Service Worker:</span>
                  <span className="text-emerald-400 font-bold">Active &amp; Caching</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Manifest:</span>
                  <span className="text-emerald-400 font-bold">Loaded (v1.0)</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px]">Security:</span>
                  <span className="text-emerald-400 font-bold">HTTPS Enforced</span>
                </div>
              </div>

              {!isInstalled && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => openBanner()}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Yapp It (Add to Home)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PERMISSIONS MANAGER */}
        {activeTab === 'permissions' && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Production Permission Architecture (Android &amp; iOS)</span>
              </div>
              <p className="text-xs text-slate-300">
                In compliance with Google Play Store &amp; Apple App Store policies, Yapp It uses <strong>Just-in-Time (JIT)</strong> permission requests with transparent rationale dialogs. Permissions are only requested at the moment the feature is activated.
              </p>
            </div>

            {/* Permission list */}
            <div className="space-y-3">
              {PERMISSION_CONFIGS.map((perm) => {
                const IconComponent = perm.icon;
                const isGranted = permissionStates[perm.id];

                return (
                  <div
                    key={perm.id}
                    className="bg-slate-850 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                          isGranted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{perm.name}</h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {perm.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {perm.purpose}
                          </p>
                          <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <span className="text-slate-500">Manifest:</span>
                            <span className="text-emerald-400/90">{perm.manifest}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            <strong className="text-slate-300">JIT Strategy:</strong> {perm.jitRule}
                          </div>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        onClick={() => togglePermission(perm.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isGranted
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isGranted ? 'Granted' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Link New Device QR Modal */}
      {showQrLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Link Yapp It Web</h3>
              <button onClick={() => setShowQrLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Open <strong>web.yappit.app</strong> on your computer and scan this QR code using your camera.
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QrCode className="w-44 h-44 text-slate-950 mx-auto" />
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session verified with Double Ratchet key exchange</span>
            </div>

            <button
              onClick={() => setShowQrLinkModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* About Ecosystem Modal */}
      {showAboutModal && (
        <AboutEcosystemModal onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
};
