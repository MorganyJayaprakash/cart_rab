import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';
import { LogOut, MoreVertical, MessageSquare, Search, Filter, CircleDashed, Users, X, Phone, PhoneMissed, PhoneCall, Image as ImageIcon, Smile, ArrowLeft, Lock, Bell, MessageCircle, Settings, Archive, Aperture, MessageSquareDashed, UserCircle, Key, Paintbrush, Keyboard, HelpCircle, Plus } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const Sidebar = ({ activeUser, setActiveUser, customWallpaper, setCustomWallpaper }) => {
  const { user, logout } = useContext(AuthContext);
  const { onlineUsers } = useContext(SocketContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [viewingStatusOf, setViewingStatusOf] = useState(null);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'calls', 'status'
  const [callHistory, setCallHistory] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeUserStatuses, setActiveUserStatuses] = useState([]);
  const fileInputRef = React.useRef(null);
  const dropdownRef = React.useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState('main'); // 'main', 'Privacy', 'Account', 'Chats', etc.
  const [emailValue, setEmailValue] = useState(user?.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newStatusText, setNewStatusText] = useState('');

  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: 'Nobody',
    profilePhoto: 'Everyone',
    about: 'Everyone',
    status: 'My contacts',
    defaultTimer: 'Off',
    groups: 'Everyone',
    theme: 'System default'
  });

  const [toggles, setToggles] = useState({
    readReceipts: true,
    enterIsSend: false,
    messageNotifications: true,
    showPreviews: true,
    reactionNotifications: true,
    sounds: true,
    wallpaperDimming: true,
  });

  const cycleOption = (key, optionsArray) => {
    setPrivacySettings(prev => {
      const currentIndex = optionsArray.indexOf(prev[key]);
      const nextIndex = (currentIndex + 1) % optionsArray.length;
      return { ...prev, [key]: optionsArray[nextIndex] };
    });
  };

  const toggleSwitch = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const visibilityOpts = ['Everyone', 'My contacts', 'Nobody'];
  const timerOpts = ['Off', '24 hours', '7 days', '90 days'];
  const themeOpts = ['System default', 'Light', 'Dark'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    
    const fetchCalls = async () => {
      try {
        const res = await api.get('/calls');
        setCallHistory(res.data);
      } catch (err) {
        console.error('Failed to fetch calls', err);
      }
    };
    
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/statuses');
        setActiveUserStatuses(res.data);
      } catch (err) {
        console.error('Failed to fetch statuses', err);
      }
    };

    fetchUsers();
    fetchStatuses();
    if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [activeTab]);

  const openStatusViewer = (targetUser = null) => {
    setViewingStatusOf(targetUser || user);
    setShowStatusViewer(true);
  };

  const filteredUsers = users.filter(u => {
    if (!u.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeFilter === 'unread') return false; // mocked: no unread chats
    if (activeFilter === 'groups') return false; // mocked: no groups
    return true;
  });

  const onEmojiClick = (emojiData) => {
    setNewStatusText(prev => prev + emojiData.emoji);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStatus = async () => {
    if (!newStatusText.trim() && !imagePreview) return;
    try {
      const payload = imagePreview 
        ? { content: imagePreview, type: 'image' }
        : { content: newStatusText, type: 'text' };
        
      await api.post('/statuses', payload);
      setNewStatusText('');
      setImagePreview(null);
      setShowEmojiPicker(false);
      setShowStatusViewer(false);
      const res = await api.get('/statuses');
      setActiveUserStatuses(res.data);
    } catch (err) {
      console.error('Failed to post status', err);
    }
  };

  const DefaultAvatarSVG = () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#d1d7db">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
  );

  return (
    <>
      {showStatusViewer && (
        <div className="status-viewer-overlay">
           <div className="status-viewer-header">
              <div className="status-viewer-user">
                 <div className="avatar">
                   {viewingStatusOf?.avatar ? <img src={viewingStatusOf.avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} /> : viewingStatusOf?.username?.charAt(0).toUpperCase()}
                 </div>
                 <span style={{ color: 'white', fontWeight: 600, fontSize: '18px' }}>
                   {viewingStatusOf?._id === user?._id ? 'My Status' : viewingStatusOf?.username}
                 </span>
              </div>
              <X color="white" size={32} style={{ cursor: 'pointer' }} onClick={() => setShowStatusViewer(false)} />
           </div>
           
           <div className="status-viewer-content">
              {viewingStatusOf?._id === user?._id && (
                <div className="add-status-container" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                  <ImageIcon color="white" size={24} style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} />
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                  
                  <Smile color="white" size={24} style={{ cursor: 'pointer' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                  {showEmojiPicker && (
                    <div style={{ position: 'absolute', bottom: '50px', left: 0, zIndex: 1000 }}>
                      <EmojiPicker onEmojiClick={onEmojiClick} searchDisabled width={300} height={350} theme="dark" />
                    </div>
                  )}
                  
                  <input 
                    type="text" 
                    placeholder="Type a new status..." 
                    value={newStatusText}
                    onChange={(e) => setNewStatusText(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: 'none', width: '300px', backgroundColor: '#2a3942', color: '#d1d7db' }}
                    disabled={!!imagePreview}
                  />
                  <button onClick={handleAddStatus} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#00a884', color: 'white', cursor: 'pointer' }}>
                    Post
                  </button>
                </div>
              )}
              {imagePreview ? (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img src={imagePreview} alt="pvw" style={{ maxWidth: '80%', maxHeight: '400px', objectFit: 'contain' }} />
                </div>
              ) : (
                <>
                  <div className="status-progress-bar">
                     <div className="status-progress-fill"></div>
                  </div>
                  <div className="status-image-mock">
                    {(() => {
                      const userGroup = activeUserStatuses.find(group => group.user._id === viewingStatusOf?._id);
                      const latestStatus = userGroup && userGroup.statuses.length > 0 ? userGroup.statuses[userGroup.statuses.length - 1] : null;
                      
                      if (!latestStatus) {
                        return <h1 className="status-text-mock">No status updates available.</h1>;
                      }
                      
                      if (latestStatus.type === 'image') {
                        return <img src={latestStatus.content} alt="status" style={{maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain'}} />;
                      }
                      
                      return (
                         <h1 className="status-text-mock" style={{ backgroundColor: latestStatus.backgroundColor || 'transparent' }}>
                           {latestStatus.content}
                         </h1>
                      );
                    })()}
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      <div className="sidebar-wrapper">
        {/* Nav Rail */}
        <div className="nav-rail">
          <div className="nav-rail-top">
            <div className={`nav-icon-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')} title="Chats">
              <MessageSquare size={22} strokeWidth={2} />
            </div>
            <div className={`nav-icon-btn ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')} title="Calls">
              <Phone size={22} strokeWidth={2} />
            </div>
            <div className={`nav-icon-btn ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')} title="Status">
              <Aperture size={22} strokeWidth={2} />
            </div>
            <div className={`nav-icon-btn`} title="Channels">
              <MessageSquareDashed size={22} strokeWidth={2} />
            </div>
            <div className={`nav-icon-btn`} title="Communities">
              <Users size={22} strokeWidth={2} />
            </div>
            <div className={`nav-icon-btn meta-ai-btn`} title="Meta AI">
              <div className="meta-ai-ring"></div>
            </div>
          </div>
          <div className="nav-rail-bottom">
            <div className="nav-icon-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
              <Settings size={22} strokeWidth={2} />
            </div>
            <div className="nav-profile-btn" onClick={() => setShowSettings(!showSettings)} title="Profile">
              {user?.avatar ? <img src={user.avatar} alt="avatar" /> : <DefaultAvatarSVG />}
            </div>
          </div>
        </div>

        {/* Main Sidebar */}
        <div className="sidebar" style={{ position: 'relative' }}>
          {showSettings && (
            <div className="settings-sidebar">
              <div className="settings-header">
                <ArrowLeft size={24} style={{ cursor: 'pointer' }} onClick={() => {
                  if (settingsView === 'main') setShowSettings(false);
                  else setSettingsView('main');
                }} />
                <span style={{ fontSize: '19px', fontWeight: 600 }}>{settingsView === 'main' ? 'Settings' : settingsView}</span>
              </div>
              
              {settingsView === 'main' && (
                <div className="settings-content">
                  <div className="settings-profile">
                    <div className="avatar settings-avatar">
                      {user?.avatar ? <img src={user.avatar} alt="avatar" /> : <DefaultAvatarSVG />}
                    </div>
                    <div className="settings-profile-info">
                      <span className="settings-name">{user?.username}</span>
                      <span className="settings-bio">{user?.bio || 'Available'}</span>
                    </div>
                  </div>
                  <div className="settings-options">
                    <div className="settings-option" onClick={() => setSettingsView('Avatar')}>
                      <UserCircle size={20} className="settings-icon" />
                      <span>Avatar</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Account')}>
                      <Key size={20} className="settings-icon" />
                      <span>Account</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Privacy')}>
                      <Lock size={20} className="settings-icon" />
                      <span>Privacy</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Chats')}>
                      <MessageSquare size={20} className="settings-icon" />
                      <span>Chats</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Notifications')}>
                      <Bell size={20} className="settings-icon" />
                      <span>Notifications</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Personalization')}>
                      <Paintbrush size={20} className="settings-icon" />
                      <span>Personalization</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Keyboard shortcuts')}>
                      <Keyboard size={20} className="settings-icon" />
                      <span>Keyboard shortcuts</span>
                    </div>
                    <div className="settings-option" onClick={() => setSettingsView('Help')}>
                      <HelpCircle size={20} className="settings-icon" />
                      <span>Help</span>
                    </div>
                    <div className="settings-option logout-btn" onClick={logout} style={{ color: '#ef4444' }}>
                      <LogOut size={20} color="#ef4444" />
                      <span>Log out</span>
                    </div>
                  </div>
                </div>
              )}

              {settingsView === 'Privacy' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-section-title">Who can see my personal info</div>
                  <div className="settings-option-item" onClick={() => cycleOption('lastSeen', visibilityOpts)}><span>Last seen and online</span><span className="settings-subval">{privacySettings.lastSeen}</span></div>
                  <div className="settings-option-item" onClick={() => cycleOption('profilePhoto', visibilityOpts)}><span>Profile photo</span><span className="settings-subval">{privacySettings.profilePhoto}</span></div>
                  <div className="settings-option-item" onClick={() => cycleOption('about', visibilityOpts)}><span>About</span><span className="settings-subval">{privacySettings.about}</span></div>
                  <div className="settings-option-item" onClick={() => cycleOption('status', visibilityOpts)}><span>Status</span><span className="settings-subval">{privacySettings.status}</span></div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('readReceipts')}>
                    <div className="toggle-info"><span>Read receipts</span><span className="settings-hint">If turned off, you won't send or receive Read receipts.</span></div>
                    <div className={`mock-toggle ${toggles.readReceipts ? 'active' : ''}`}></div>
                  </div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-section-title">Disappearing messages</div>
                  <div className="settings-option-item" onClick={() => cycleOption('defaultTimer', timerOpts)}><span>Default message timer</span><span className="settings-subval">{privacySettings.defaultTimer}</span></div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-option-item" onClick={() => cycleOption('groups', visibilityOpts)}><span>Groups</span><span className="settings-subval">{privacySettings.groups}</span></div>
                  <div className="settings-option-item"><span>Blocked contacts</span><span className="settings-subval">None</span></div>
                  <div className="settings-option-item"><span>App lock</span></div>
                </div>
              )}

              {settingsView === 'Account' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-option-item"><span>Security notifications</span></div>
                  <div className="settings-option-item"><span>Passkeys</span></div>
                  <div className="settings-option-item" onClick={() => setIsEditingEmail(!isEditingEmail)}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <span>Email address</span>
                      {isEditingEmail ? (
                         <input 
                           type="email" 
                           value={emailValue} 
                           onChange={(e) => setEmailValue(e.target.value)} 
                           placeholder="Enter your email" 
                           style={{ marginTop: '10px', padding: '8px', borderRadius: '5px', border: 'none', backgroundColor: '#2a3942', color: '#e9edef', width: '100%' }}
                           onBlur={() => setIsEditingEmail(false)}
                           autoFocus
                         />
                      ) : (
                         <span className="settings-subval" style={{ marginTop: '5px' }}>{emailValue || 'Tap to enter email'}</span>
                      )}
                    </div>
                  </div>
                  <div className="settings-option-item"><span>Two-step verification</span></div>
                  <div className="settings-option-item"><span>Change number</span></div>
                  <div className="settings-option-item"><span>Request account info</span></div>
                  <div className="settings-option-item" style={{ color: '#ef4444' }}><span>Delete account</span></div>
                </div>
              )}
              
              {settingsView === 'Chats' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-section-title">Display</div>
                  <div className="settings-option-item" onClick={() => cycleOption('theme', themeOpts)}><span>Theme</span><span className="settings-subval">{privacySettings.theme}</span></div>
                  <div className="settings-option-item" onClick={() => setSettingsView('Wallpaper')}><span>Chat wallpaper</span></div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-section-title">Chat settings</div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('enterIsSend')}>
                     <div className="toggle-info"><span>Enter is send</span><span className="settings-hint">Enter key will send your message</span></div>
                     <div className={`mock-toggle ${toggles.enterIsSend ? 'active' : ''}`}></div>
                  </div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-option-item"><span>Chat history</span></div>
                </div>
              )}

              {settingsView === 'Avatar' && (
                <div className="settings-content sub-settings-content">
                  <div style={{ padding: '30px', textAlign: 'center' }}>
                    <div className="avatar settings-avatar" style={{ margin: '0 auto 20px', width: '150px', height: '150px' }}>
                      {user?.avatar ? <img src={user.avatar} alt="avatar" /> : <DefaultAvatarSVG />}
                    </div>
                    <p style={{ color: '#8696a0', marginBottom: '20px' }}>Say more with avatars now on WhatsApp.</p>
                    <button style={{ backgroundColor: '#00a884', color: '#111b21', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: 500, cursor: 'pointer' }}>Create your Avatar</button>
                  </div>
                </div>
              )}

              {settingsView === 'Notifications' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-section-title">Messages</div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('messageNotifications')}>
                     <div className="toggle-info"><span>Message notifications</span><span className="settings-hint">Show notifications for new messages</span></div>
                     <div className={`mock-toggle ${toggles.messageNotifications ? 'active' : ''}`}></div>
                  </div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('showPreviews')}>
                     <div className="toggle-info"><span>Show previews</span></div>
                     <div className={`mock-toggle ${toggles.showPreviews ? 'active' : ''}`}></div>
                  </div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('reactionNotifications')}>
                     <div className="toggle-info"><span>Show reaction notifications</span></div>
                     <div className={`mock-toggle ${toggles.reactionNotifications ? 'active' : ''}`}></div>
                  </div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('sounds')}>
                     <div className="toggle-info"><span>Sounds</span><span className="settings-hint">Play sounds for incoming messages</span></div>
                     <div className={`mock-toggle ${toggles.sounds ? 'active' : ''}`}></div>
                  </div>
                </div>
              )}

              {settingsView === 'Personalization' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-section-title">App Color Theme</div>
                  <div className="settings-option-item" onClick={() => cycleOption('theme', themeOpts)}><span>Theme</span><span className="settings-subval">{privacySettings.theme}</span></div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-section-title">Chat Wallpaper</div>
                  <div className="settings-option-item" onClick={() => setSettingsView('Wallpaper')}><span>Wallpaper</span><span className="settings-subval">Custom</span></div>
                  <div className="settings-option-item toggle-item" onClick={() => toggleSwitch('wallpaperDimming')}>
                     <div className="toggle-info"><span>Wallpaper Dimming</span><span className="settings-hint">Dim wallpaper in dark mode</span></div>
                     <div className={`mock-toggle ${toggles.wallpaperDimming ? 'active' : ''}`}></div>
                  </div>
                </div>
              )}

              {settingsView === 'Wallpaper' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-section-title">Custom Wallpaper</div>
                  <div className="settings-option-item" onClick={() => document.getElementById('sidebar-wallpaper-upload').click()}>
                    <span>Upload from device</span>
                  </div>
                  <input type="file" id="sidebar-wallpaper-upload" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setCustomWallpaper(reader.result);
                      reader.readAsDataURL(file);
                    }
                    e.target.value = null;
                  }} />
                  <div className="settings-section-divider"></div>
                  <div className="settings-section-title">Colors</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '15px 30px' }}>
                     {['#0b141a', '#1e2022', '#2c3e50', '#8e44ad', '#27ae60', '#c0392b', '#d35400', '#f39c12', '#16a085', '#2980b9'].map(color => (
                        <div key={color} onClick={() => setCustomWallpaper(color)} style={{ width: '45px', height: '45px', backgroundColor: color, borderRadius: '8px', cursor: 'pointer', border: customWallpaper === color ? '3px solid #00a884' : '3px solid transparent' }}></div>
                     ))}
                  </div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-option-item" onClick={() => setCustomWallpaper(null)}>
                    <span style={{ color: '#ef4444' }}>Reset to default doodle</span>
                  </div>
                </div>
              )}

              {settingsView === 'Keyboard shortcuts' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-option-item"><span>Mark as unread</span><span className="settings-subval">Ctrl + Shift + U</span></div>
                  <div className="settings-option-item"><span>Archive chat</span><span className="settings-subval">Ctrl + E</span></div>
                  <div className="settings-option-item"><span>Pin chat</span><span className="settings-subval">Ctrl + Shift + P</span></div>
                  <div className="settings-option-item"><span>Search chat</span><span className="settings-subval">Ctrl + Shift + F</span></div>
                  <div className="settings-option-item"><span>New chat</span><span className="settings-subval">Ctrl + N</span></div>
                  <div className="settings-option-item"><span>Settings</span><span className="settings-subval">Ctrl + ,</span></div>
                  <div className="settings-option-item"><span>Mute chat</span><span className="settings-subval">Ctrl + Shift + M</span></div>
                </div>
              )}

              {settingsView === 'Help' && (
                <div className="settings-content sub-settings-content">
                  <div className="settings-option-item"><span>Help Center</span><span className="settings-subval">Opens in browser</span></div>
                  <div className="settings-option-item"><span>Contact us</span></div>
                  <div className="settings-option-item"><span>Terms and Privacy Policy</span></div>
                  <div className="settings-option-item"><span>Channel Reports</span></div>
                  <div className="settings-section-divider"></div>
                  <div className="settings-option-item"><span>App info</span></div>
                </div>
              )}
            </div>
          )}
          
          <div className="sidebar-header-windows">
            <h1 className="sidebar-title">WhatsApp</h1>
            <div className="sidebar-actions">
              <MessageSquare className="action-icon" size={20} title="New Chat" onClick={() => setActiveTab('chats')} />
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <MoreVertical 
                  className={`action-icon ${showDropdown ? 'active' : ''}`} 
                  size={20} 
                  onClick={() => setShowDropdown(!showDropdown)}
                />
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={() => { setShowDropdown(false); alert('New group feature to be implemented'); }}>New group</div>
                    <div className="dropdown-item" onClick={() => { setShowDropdown(false); setShowSettings(true); }}>Settings</div>
                    <div className="dropdown-item" onClick={() => { setShowDropdown(false); logout(); }}>Log out</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="search-container">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search or start a new chat" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-bubbles">
             <span className={`filter-bubble ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All</span>
             <span className={`filter-bubble ${activeFilter === 'unread' ? 'active' : ''}`} onClick={() => { setActiveFilter('unread'); }}>Unread</span>
             <span className={`filter-bubble ${activeFilter === 'groups' ? 'active' : ''}`} onClick={() => { setActiveFilter('groups'); }}>Groups</span>
          </div>

          {activeFilter === 'all' && (
            <div className="archived-section">
              <div className="archived-icon-wrapper">
                <Archive size={18} />
              </div>
              <span className="archived-text">Archived</span>
              <span className="archived-count">1</span>
            </div>
          )}

          <div className="user-list">
            {activeTab === 'chats' ? (
              activeFilter === 'unread' ? (
                <div className="empty-filter-state">
                   <span className="empty-filter-text">No unread chats</span>
                </div>
              ) : activeFilter === 'groups' ? (
                <div className="empty-filter-state">
                   <span className="empty-filter-text">No groups</span>
                </div>
              ) : filteredUsers.length > 0 ? filteredUsers.map(u => {
              const isOnline = onlineUsers.includes(u._id);
              const isActive = activeUser?._id === u._id;
              
              return (
                <div 
                  key={u._id} 
                  className={`user-item gap-wrapper ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveUser(u)}
                >
                  <div className={`avatar img-rounded`} onDoubleClick={(e) => { e.stopPropagation(); openStatusViewer(u); }} title="Double click for Status">
                    {u.avatar ? <img src={u.avatar} alt="avatar" /> : <DefaultAvatarSVG />}
                    {isOnline && <div className="online-badge"></div>}
                  </div>
                  <div className="user-info border-none">
                    <div className="user-name-row">
                      <span className="user-name">{u.username}</span>
                      <span className="user-time" style={{ color: isActive ? '#00a884' : '#8696a0' }}>Yesterday</span>
                    </div>
                    <div className="user-status-row">
                      <span className="user-last-msg">
                        {isOnline ? 'Typing...' : (u.bio || 'Available')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }) : (
               <div className="empty-filter-state">
                 <span className="empty-filter-text">No chats found</span>
               </div>
            )) : activeTab === 'status' ? (
              <div className="status-list-container">
                 <div className="status-section" style={{ padding: '0px 15px' }}>
                   <div className="status-section-title" style={{ color: '#00a884', fontSize: '22px', marginBottom: '20px', marginTop: '10px', fontWeight: 'bold' }}>Status</div>
                   
                   <div className="user-item gap-wrapper" onClick={() => openStatusViewer(user)} style={{ padding: '12px 15px' }}>
                      <div className="avatar img-rounded" style={{ position: 'relative' }}>
                         {user?.avatar ? <img src={user.avatar} alt="my status" /> : <DefaultAvatarSVG />}
                         <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#00a884', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={14} color="#111b21" strokeWidth={4} />
                         </div>
                      </div>
                      <div className="user-info border-none">
                         <div className="user-name" style={{ color: '#e9edef' }}>My status</div>
                         <div className="user-last-msg">Click to add status update</div>
                      </div>
                   </div>
                   
                   <div className="settings-section-divider"></div>
                   
                   <div style={{ color: '#00a884', fontSize: '16px', margin: '20px 15px 15px', fontWeight: 400 }}>RECENT</div>
                   
                   {activeUserStatuses.filter(g => g.user._id !== user?._id).map((group, idx) => (
                      <div key={idx} className="user-item gap-wrapper" onClick={() => openStatusViewer(group.user)} style={{ padding: '12px 15px' }}>
                         <div className="avatar img-rounded" style={{ padding: '2px', border: '2px solid #00a884' }}>
                            {group.user?.avatar ? <img src={group.user.avatar} alt="status" style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : <DefaultAvatarSVG />}
                         </div>
                         <div className="user-info border-none">
                            <div className="user-name" style={{ color: '#e9edef' }}>{group.user?.username}</div>
                            <div className="user-last-msg">Today</div>
                         </div>
                      </div>
                   ))}
                   {activeUserStatuses.filter(g => g.user._id !== user?._id).length === 0 && (
                      <div style={{ padding: '15px', color: '#8696a0', fontSize: '14px' }}>No recent updates.</div>
                   )}
                 </div>
              </div>
            ) : (
              callHistory.length > 0 ? callHistory.map(call => {
                const parseDuration = (d) => `${Math.floor(d/60)}:${(d%60).toString().padStart(2,'0')}`;
                const isOutgoing = call.callerId._id === user._id;
                const remoteParty = isOutgoing ? call.receiverId : call.callerId;
                const date = new Date(call.startedAt);
                
                return (
                  <div key={call._id} className="user-item gap-wrapper">
                    <div className="avatar img-rounded">
                      {remoteParty?.avatar ? <img src={remoteParty.avatar} alt="avatar" /> : <DefaultAvatarSVG />}
                    </div>
                    <div className="user-info border-none">
                       <div className="user-name-row">
                          <span className="user-name" style={{ color: call.status === 'missed' ? '#ef4444' : '#e9edef' }}>
                            {remoteParty?.username}
                          </span>
                          <span className="user-time">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       <div className="user-status-row">
                          <span className="user-last-msg call-msg">
                             {isOutgoing ? <PhoneCall size={14} color={call.status === 'missed' ? '#ef4444' : '#00a884'} /> : <PhoneMissed size={14} color={call.status === 'missed' ? '#ef4444' : '#00a884'} />}
                             {call.status === 'missed' ? 'Missed Call' : `Duration: ${parseDuration(call.duration)}`}
                          </span>
                       </div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#8696a0' }}>No call history.</div>
              )
            )}
          </div>
          
          <div className="windows-app-banner">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#25d366" style={{marginRight: '8px'}}><path d="M12.001 2.016A9.98 9.98 0 0 0 3.43 17.51l-1.397 5.092 5.212-1.365a9.982 9.982 0 1 0 4.756-19.22zM12 20.24A8.257 8.257 0 0 1 7.79 19.06l-2.924.766.777-2.852a8.272 8.272 0 1 1 6.357 3.266z"></path><path d="M16.143 14.122c-.227-.113-1.343-.663-1.55-.74-.207-.076-.358-.113-.508.113-.15.226-.583.74-.715.89-.131.15-.262.17-.488.057a6.29 6.29 0 0 1-1.85-1.144 6.945 6.945 0 0 1-1.286-1.605c-.131-.227-.014-.35.1-.462.103-.102.227-.264.34-.396.113-.131.15-.226.227-.377.075-.15.037-.282-.02-.395-.056-.113-.508-1.226-.696-1.678-.184-.442-.372-.382-.508-.388-.13-.005-.282-.005-.433-.005A.82.82 0 0 0 8.355 8.7c-.17.189-.64.623-.64 1.51s.658 1.745.752 1.868c.094.122 1.282 1.956 3.1 2.744a10.38 10.38 0 0 0 1.033.376c.433.136.828.117 1.14.07.348-.052 1.074-.438 1.225-.86.151-.423.151-.786.104-.86-.048-.076-.18-.114-.407-.227z"></path></svg>
              <span className="windows-app-text">Get WhatsApp for Windows</span>
          </div>

        </div>
      </div>
    </>
  );
};

export default Sidebar;
