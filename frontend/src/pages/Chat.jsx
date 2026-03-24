import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const [activeUser, setActiveUser] = useState(null);
  const [customWallpaper, setCustomWallpaper] = useState(localStorage.getItem('chatWallpaper') || null);

  const handleSetWallpaper = (val) => {
    setCustomWallpaper(val);
    if (val) localStorage.setItem('chatWallpaper', val);
    else localStorage.removeItem('chatWallpaper');
  };

  return (
    <div className="app-container">
      <Sidebar activeUser={activeUser} setActiveUser={setActiveUser} customWallpaper={customWallpaper} setCustomWallpaper={handleSetWallpaper} />
      <ChatWindow activeUser={activeUser} customWallpaper={customWallpaper} setCustomWallpaper={handleSetWallpaper} />
    </div>
  );
};

export default Chat;
