import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Smartphone, 
  Users, 
  Share2, 
  Check, 
  Phone, 
  Sparkles, 
  ExternalLink,
  Plus,
  X,
  Upload,
  UserCheck
} from 'lucide-react';
import { User, DeviceContact } from '../types';
import { matchPhoneNumbers, formatPhoneNumber } from '../lib/phoneUtils';

interface NewChatModalProps {
  currentUser: User;
  registeredUsers: User[];
  onSelectUser: (user: User) => void;
  onOpenNewGroup: () => void;
  onClose: () => void;
}

const STORAGE_KEY_CONTACTS = 'yapp_it_device_contacts';

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  registeredUsers,
  onSelectUser,
  onOpenNewGroup,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTACTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [pickerStatus, setPickerStatus] = useState<string | null>(null);

  // Save device contacts to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(deviceContacts));
    } catch (e) {
      console.warn('Could not save contacts to localStorage', e);
    }
  }, [deviceContacts]);

  // Check which contacts are registered on Yapp It in real-time
  const matchedDeviceContacts = deviceContacts.map((contact) => {
    const matchedUser = registeredUsers.find(
      (u) => u.id !== currentUser.id && matchPhoneNumbers(u.phone || '', contact.phone)
    );
    return {
      ...contact,
      isOnYapp: !!matchedUser,
      yappUser: matchedUser,
    };
  });

  // Other registered users that might not be in saved device contacts yet
  const otherRegisteredUsers = registeredUsers.filter((u) => {
    if (u.id === currentUser.id) return false;
    // Check if already in matchedDeviceContacts
    return !matchedDeviceContacts.some(
      (c) => c.isOnYapp && c.yappUser?.id === u.id
    );
  });

  // Filter based on search query
  const query = searchQuery.trim().toLowerCase();

  const filteredOnYapp = matchedDeviceContacts.filter(
    (c) => c.isOnYapp && (c.name.toLowerCase().includes(query) || c.phone.includes(query))
  );

  const filteredOtherRegistered = otherRegisteredUsers.filter(
    (u) => u.name.toLowerCase().includes(query) || (u.phone && u.phone.includes(query))
  );

  const filteredInvite = matchedDeviceContacts.filter(
    (c) => !c.isOnYapp && (c.name.toLowerCase().includes(query) || c.phone.includes(query))
  );

  // Native Mobile Device & SIM Card Contact Picker API
  const handlePickFromDevice = async () => {
    const nav = navigator as any;
    if ('contacts' in nav && 'ContactsManager' in window) {
      try {
        setPickerStatus('Opening SIM & device contact picker...');
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const contacts = await nav.contacts.select(props, opts);

        if (contacts && contacts.length > 0) {
          const newEntries: DeviceContact[] = contacts
            .map((c: any, index: number) => {
              const name = Array.isArray(c.name) ? c.name[0] : c.name || 'Contact';
              const tel = Array.isArray(c.tel) ? c.tel[0] : c.tel || '';
              return {
                id: `dev-contact-${Date.now()}-${index}`,
                name: String(name),
                phone: String(tel),
              };
            })
            .filter((c: DeviceContact) => c.phone);

          setDeviceContacts((prev) => {
            const existingPhones = new Set(prev.map((p) => p.phone.replace(/\D/g, '')));
            const filtered = newEntries.filter(
              (n) => !existingPhones.has(n.phone.replace(/\D/g, ''))
            );
            return [...prev, ...filtered];
          });
          setPickerStatus(`Imported ${newEntries.length} contacts from SIM/device.`);
          setTimeout(() => setPickerStatus(null), 4000);
        } else {
          setPickerStatus(null);
        }
      } catch (err) {
        console.warn('Contact picker cancelled or failed:', err);
        setPickerStatus('Permission denied or picker closed. You can add contacts manually.');
        setTimeout(() => setPickerStatus(null), 4000);
      }
    } else {
      // Browser doesn't support Contact Picker API (desktop or standard browser)
      setShowAddContactModal(true);
    }
  };

  // Import VCF or CSV contacts file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsedContacts: DeviceContact[] = [];
      
      // Parse vCard (.vcf)
      if (file.name.endsWith('.vcf') || text.includes('BEGIN:VCARD')) {
        const cards = text.split('BEGIN:VCARD');
        cards.forEach((card, idx) => {
          const fnMatch = card.match(/FN:(.+)/i);
          const telMatch = card.match(/TEL.*:(.+)/i);
          if (telMatch) {
            const name = fnMatch ? fnMatch[1].trim() : `Contact ${idx + 1}`;
            const phone = telMatch[1].trim();
            parsedContacts.push({
              id: `vcf-${Date.now()}-${idx}`,
              name,
              phone,
            });
          }
        });
      } else {
        // Simple CSV parse: Name, Phone
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const phone = parts[1].trim();
            if (phone.replace(/\D/g, '').length >= 5) {
              parsedContacts.push({
                id: `csv-${Date.now()}-${idx}`,
                name: name || `Contact ${idx + 1}`,
                phone,
              });
            }
          }
        });
      }

      if (parsedContacts.length > 0) {
        setDeviceContacts((prev) => {
          const existingPhones = new Set(prev.map((p) => p.phone.replace(/\D/g, '')));
          const filtered = parsedContacts.filter(
            (n) => !existingPhones.has(n.phone.replace(/\D/g, ''))
          );
          return [...prev, ...filtered];
        });
        setPickerStatus(`Imported ${parsedContacts.length} contacts.`);
        setTimeout(() => setPickerStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // Add Contact manually
  const handleAddManualContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const contact: DeviceContact = {
      id: `manual-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
    };

    setDeviceContacts((prev) => [contact, ...prev]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContactModal(false);
  };

  // Share Yapp It with friends
  const handleShareApp = async () => {
    const shareUrl = window.location.origin;
    const shareText = `Hey! Join me on Yapp It for private end-to-end encrypted chats and high-clarity voice & video calls. Install it here: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Yapp It',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User dismissed
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleInviteContact = async (contact: DeviceContact) => {
    const shareUrl = window.location.origin;
    const text = `Hey ${contact.name}! I am on Yapp It. Let's chat securely here: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Yapp It',
          text,
          url: shareUrl,
        });
      } catch (err) {
        // Dismissed
      }
    } else {
      // Open SMS intent
      window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(text)}`;
    }
  };

  const totalRegistered = filteredOnYapp.length + filteredOtherRegistered.length;

  return (
    <div 
      id="new-chat-view"
      className="w-full h-full flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="new-chat-back-btn"
            onClick={onClose}
            className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">New Chat</h1>
            <p className="text-xs text-emerald-400 font-medium">
              {totalRegistered} friend{totalRegistered === 1 ? '' : 's'} on Yapp It
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddContactModal(true)}
            title="Add contact by phone number"
            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Number</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="new-chat-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or phone number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Picker Status Alert */}
      {pickerStatus && (
        <div className="px-4 py-2 bg-emerald-950/70 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{pickerStatus}</span>
        </div>
      )}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
        {/* Action 1: Access Device & SIM Contacts */}
        <div className="p-2 space-y-1">
          <button
            type="button"
            id="access-sim-contacts-btn"
            onClick={handlePickFromDevice}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-900/80 transition-all text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                <span>Access SIM &amp; Device Contacts</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                  Device Native
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Sync contacts from your mobile device or SIM card to check who's on Yapp It
              </p>
            </div>
          </button>

          {/* Action 2: New Group */}
          <button
            type="button"
            id="new-group-action-btn"
            onClick={() => {
              onClose();
              onOpenNewGroup();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-900/80 transition-all text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                New Group
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Group chat with encrypted voice &amp; video coordination
              </p>
            </div>
          </button>

          {/* Action 3: Share with Friends */}
          <button
            type="button"
            id="share-app-link-btn"
            onClick={handleShareApp}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-900/80 transition-all text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                Share Yapp It with Friends
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {copiedLink ? '✓ Invite link copied to clipboard!' : 'Send install link so friends appear on your contact list'}
              </p>
            </div>
          </button>
        </div>

        {/* SECTION: Real-time Friends on Yapp It */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Registered on Yapp It ({totalRegistered})</span>
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Real-Time
            </span>
          </div>

          {totalRegistered === 0 ? (
            <div className="p-6 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800/60 my-2">
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                No contacts registered on Yapp It yet
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tap <strong>Share Yapp It with Friends</strong> above or import contacts from your SIM to invite them. As soon as they install and sign in, they appear right here in real time!
              </p>
              <button
                type="button"
                onClick={handleShareApp}
                className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share App Link</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Matched from phone contacts */}
              {filteredOnYapp.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => contact.yappUser && onSelectUser(contact.yappUser)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-900 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={contact.yappUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.name}`}
                        alt={contact.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/60"
                      />
                      {contact.yappUser?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {contact.name}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30 shrink-0">
                          On Yapp It
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {contact.yappUser?.about || formatPhoneNumber(contact.phone)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-medium ${contact.yappUser?.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {contact.yappUser?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </button>
              ))}

              {/* Other registered users on the platform */}
              {filteredOtherRegistered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-900 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/60"
                      />
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {user.name}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30 shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {user.about || (user.phone ? formatPhoneNumber(user.phone) : 'Hey there! I am using Yapp It.')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-medium ${user.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: Invite to Yapp It (Device Contacts not yet installed) */}
        {filteredInvite.length > 0 && (
          <div className="p-3 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 pt-2">
              Invite to Yapp It ({filteredInvite.length})
            </h3>
            <div className="space-y-1">
              {filteredInvite.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-900/60 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300 font-bold shrink-0">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                      <p className="text-xs text-slate-400 truncate">{formatPhoneNumber(contact.phone)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInviteContact(contact)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs rounded-xl transition-all border border-emerald-500/30"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Contact Manually */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Add Contact</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter contact's name and mobile number. Yapp It will verify in real time if they have created an account.
            </p>

            <form onSubmit={handleAddManualContact} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Contact Name</label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <label className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import .vcf file</span>
                  <input
                    type="file"
                    accept=".vcf,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    Save &amp; Check
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
