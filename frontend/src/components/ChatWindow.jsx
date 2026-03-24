import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';
import { Send, Search, MoreVertical, Paperclip, Smile, Mic, CheckCheck, Phone, Video, MonitorSmartphone, User as UserIcon, MapPin, Image as ImageIcon, Music, Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = ({ activeUser, customWallpaper, setCustomWallpaper }) => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const chatMenuRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const [callState, setCallState] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [userLastSeen, setUserLastSeen] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  
  const messagesEndRef = useRef(null);
  const pickerRef = useRef(null);
  
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const docInputRef = useRef(null);

  const initWebRTC = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        let receiverId = incomingCall ? incomingCall.caller._id : activeUser._id;
        socket.emit('webrtcSignal', { receiverId, signal: { type: 'candidate', candidate: event.candidate }, senderId: user._id });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.current = pc;
    return pc;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    if (activeUser) {
      setUserLastSeen(activeUser.lastSeen);
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/messages/${activeUser._id}`);
          setMessages(res.data);
          setTimeout(scrollToBottom, 50);
        } catch (err) {
          console.error(err);
        }
      };
      fetchMessages();
    }
  }, [activeUser]);

  useEffect(() => {
    let timerInterval;
    if (callStatus === 'connected') {
      timerInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timerInterval);
  }, [callStatus]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, callState]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (newMessage) => {
        if (activeUser && (newMessage.senderId === activeUser._id || newMessage.receiverId === activeUser._id)) {
          setMessages(prev => [...prev, newMessage]);
          setTimeout(scrollToBottom, 50);
        }
      };
      
      socket.on('receiveMessage', handleReceiveMessage);

      socket.on('incomingCall', (data) => {
        setIncomingCall(data);
      });

      socket.on('callAnswered', async (data) => {
        if (data.accepted) {
          setCallStatus('connected');
          // Caller creates offer
          const pc = await initWebRTC();
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtcSignal', { receiverId: activeUser._id, signal: offer, senderId: user._id });
        } else {
          endCallCleanup();
        }
      });

      socket.on('callEnded', () => {
        endCallCleanup();
      });

      socket.on('webrtcSignal', async (data) => {
        if (data.senderId !== (incomingCall ? incomingCall.caller._id : activeUser?._id)) return;
        
        const signal = data.signal;
        
        if (signal.type === 'offer') {
          const pc = await initWebRTC();
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtcSignal', { receiverId: data.senderId, signal: answer, senderId: user._id });
        } 
        else if (signal.type === 'answer') {
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
          }
        } 
        else if (signal.type === 'candidate') {
          if (peerConnection.current) {
            try {
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.error('Error adding ICE candidate', e);
            }
          }
        }
      });

      socket.on('userOffline', (data) => {
        if (activeUser && data.userId === activeUser._id) {
          setUserLastSeen(data.lastSeen);
        }
      });

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('incomingCall');
        socket.off('callAnswered');
        socket.off('callEnded');
        socket.off('webrtcSignal');
        socket.off('userOffline');
      };
    }
  }, [socket, activeUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
        setShowAttachMenu(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerRef]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activeUser) return;

    try {
      const res = await api.post('/messages/send', {
        receiverId: activeUser._id,
        text
      });

      const newMessage = res.data;
      socket.emit('sendMessage', newMessage);
      
      setMessages(prev => [...prev, newMessage]);
      setText('');
      setShowEmojiPicker(false);
      setShowAttachMenu(false);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error(err);
    }
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          try {
            const res = await api.post('/messages/send', {
              receiverId: activeUser._id,
              text: base64Audio
            });
            const newMessage = res.data;
            socket.emit('sendMessage', newMessage);
            setMessages(prev => [...prev, newMessage]);
            setTimeout(scrollToBottom, 50);
          } catch (err) {
            console.error('Error sending voice message', err);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone', error);
      alert('Please allow microphone access to record voice messages.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Attachment feature selected file: ${file.name}\n\n(Backend upload functionality to be implemented)`);
    }
    setShowAttachMenu(false);
    // Reset the value so the same file can be selected again
    e.target.value = null;
  };

  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomWallpaper(reader.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const endCallCleanup = async () => {
    stopMediaTracks();
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Logic to save call state for the caller
    if (callState && !incomingCall) {
      try {
        const status = callStatus === 'connected' ? 'completed' : 'missed';
        await api.post('/calls', {
          receiverId: activeUser._id,
          callType: callState,
          status: status,
          duration: callDuration,
          startedAt: callStartTime || new Date(),
          endedAt: new Date()
        });
        
        let callText = '';
        if (status === 'missed') {
          callText = `❌ Missed ${callState} call`;
        } else {
          callText = `${callState === 'video' ? '📹 Video' : '📞 Voice'} call - ${formatDuration(callDuration)}`;
        }
        
        const msgRes = await api.post('/messages/send', {
          receiverId: activeUser._id,
          text: callText
        });

        socket.emit('sendMessage', msgRes.data);
        setMessages(prev => [...prev, msgRes.data]);

      } catch (err) {
        console.error('Failed to save call record', err);
      }
    }

    setRemoteStream(null);
    setCallState(null);
    setCallStatus(null);
    setIncomingCall(null);
    setCallStartTime(null);
    setCallDuration(0);
  };

  const getMediaStream = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Error accessing media devices.", err);
      return null;
    }
  };

  const stopMediaTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
  };

  const startCall = async (type) => {
    await getMediaStream(type);
    setCallState(type);
    setCallStartTime(new Date());
    setCallStatus('ringing');
    socket.emit('callUser', { receiverId: activeUser._id, callType: type, caller: user });
  };

  const answerIncomingCall = async (accepted) => {
    if (accepted) {
      await getMediaStream(incomingCall.callType);
    }
    socket.emit('answerCall', { callerId: incomingCall.caller._id, accepted });
    if (accepted) {
      setCallState(incomingCall.callType);
      setCallStatus('connected');
    } else {
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    const otherUserId = incomingCall ? incomingCall.caller._id : activeUser?._id;
    if (otherUserId) socket.emit('endCall', { otherUserId });
    endCallCleanup();
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString([], options);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderMessageContent = (msgText) => {
    if (msgText.startsWith('data:audio')) {
      return (
        <audio controls src={msgText} style={{ height: '40px', maxWidth: '250px', outline: 'none' }} />
      );
    }
    return <span className="message-content">{msgText}</span>;
  };

  // Global Incoming Call Overlay component
  const callOverlayUI = (incomingCall && !callStatus) ? (
    <div className="call-overlay">
      <div className="call-box shimmer-box">
        <div className="call-avatar-container">
          <div className="call-avatar ripple-animation">
            {incomingCall.caller.avatar ? <img src={incomingCall.caller.avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} /> : incomingCall.caller.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <h2 className="call-title">
          Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call
        </h2>
        <h3 className="call-name">{incomingCall.caller.username}</h3>
        <div className="call-actions" style={{ marginTop: '40px' }}>
          <div className="call-btn-hangup" onClick={() => answerIncomingCall(false)}>
            <Phone size={30} fill="white" style={{ transform: 'rotate(135deg)' }} />
          </div>
          <div className="call-btn-accept" onClick={() => answerIncomingCall(true)}>
            <Phone size={30} fill="white" />
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (!activeUser) {
    return (
      <div className="empty-chat">
        {callOverlayUI}
        <MonitorSmartphone size={120} color="#a6b0b6" strokeWidth={0.5} style={{ marginBottom: '28px' }} />
        <h2 className="empty-chat-title">WhatsApp for Web</h2>
        <p className="empty-chat-subtitle">Send and receive messages without keeping your phone online.<br/>Use WhatsApp on up to 4 linked devices and 1 phone at the same time.</p>
        <div className="empty-chat-encryption">
          <span style={{ fontSize: '12px', color: '#8696a0', display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Your personal messages are end-to-end encrypted</span>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(activeUser._id);

  return (
    <>
      <style>{`
        .chat-window::before {
          ${customWallpaper && customWallpaper.startsWith('#') ? `background-image: none; background-color: ${customWallpaper}; opacity: 1;` : `background-image: url('${customWallpaper || "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"}');`}
          ${(customWallpaper && !customWallpaper.startsWith('#')) ? 'opacity: 0.6; background-size: cover; background-position: center;' : (!customWallpaper ? 'opacity: 0.15; background-repeat: repeat;' : '')}
        }
      `}</style>
      <div className="chat-window">
        {callOverlayUI}
      {callState && (
        <div className="call-overlay">
          {callState === 'video' && localStream && (
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="local-video-preview" 
              style={{ position: 'absolute', top: '20px', right: '20px', width: '200px', borderRadius: '12px', border: '2px solid white', backgroundColor: '#000', zIndex: 10, objectFit: 'cover' }}
            />
          )}
          {callState === 'video' && remoteStream && (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="remote-video-preview" 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
            />
          )}
          <div className="call-box" style={{ zIndex: 5, background: remoteStream ? 'transparent' : '#f0f2f5', boxShadow: remoteStream ? 'none' : '0 4px 15px rgba(0,0,0,0.2)' }}>
            {(!remoteStream || callState !== 'video') && (
              <div className="call-avatar-container">
                <div className={`call-avatar ${callStatus === 'ringing' ? 'ripple-animation' : ''}`}>
                  {(incomingCall ? incomingCall.caller.avatar : activeUser.avatar) ? <img src={incomingCall ? incomingCall.caller.avatar : activeUser.avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} /> : (incomingCall ? incomingCall.caller.username.charAt(0).toUpperCase() : activeUser.username.charAt(0).toUpperCase())}
                </div>
              </div>
            )}
            <h2 className="call-title" style={{ color: remoteStream ? 'white' : '#54656f', textShadow: remoteStream ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>
              {callState === 'video' ? 'Video Calling' : 'Voice Calling'}
            </h2>
            <h3 className="call-name" style={{ color: remoteStream ? 'white' : '#111b21', textShadow: remoteStream ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>
              {incomingCall ? incomingCall.caller.username : activeUser.username}
            </h3>
            <p className="call-status" style={{ color: remoteStream ? 'white' : '#54656f', textShadow: remoteStream ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>
               {callStatus === 'ringing' ? 'Ringing...' : `${formatDuration(callDuration)} - Connected`}
            </p>
            <div className="call-actions">
              <div className="call-btn-hangup" onClick={endCall}>
                <Phone size={30} fill="white" style={{ transform: 'rotate(135deg)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chat-header">
        <div className="chat-header-info">
          <div className="avatar">
            {activeUser.avatar ? <img src={activeUser.avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} /> : activeUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="chat-header-text">
            <span className="chat-contact-name">{activeUser.username}</span>
            <span className="chat-contact-status" title={activeUser.bio}>
              {isOnline 
                ? 'online' 
                : userLastSeen 
                  ? `last seen today at ${formatTime(userLastSeen)}`
                  : (activeUser.bio || 'click here for contact info')}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <Video className="action-icon" size={22} onClick={() => startCall('video')} title="Video Call" />
          <Phone className="action-icon" size={20} onClick={() => startCall('audio')} title="Audio Call" />
          <div className="divider"></div>
          <Search className="action-icon" size={20} />
          <div style={{ position: 'relative' }} ref={chatMenuRef}>
            <MoreVertical 
              className={`action-icon ${showChatMenu ? 'active' : ''}`} 
              size={20} 
              onClick={() => setShowChatMenu(!showChatMenu)}
            />
            {showChatMenu && (
              <div className="dropdown-menu">
                 <div className="dropdown-item" onClick={() => { setShowChatMenu(false); wallpaperInputRef.current?.click(); }}>Change Wallpaper</div>
                 <div className="dropdown-item" onClick={() => { setShowChatMenu(false); setCustomWallpaper(null); }}>Reset Wallpaper</div>
              </div>
            )}
          </div>
          <input type="file" ref={wallpaperInputRef} hidden accept="image/*" onChange={handleWallpaperUpload} />
        </div>
      </div>
      
      <div className="chat-messages" onClick={() => { setShowEmojiPicker(false); setShowAttachMenu(false); setShowChatMenu(false); }}>
        <div className="encryption-bubble">
          🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even ChatVerse, can read or listen to them.
        </div>

        {messages.map((msg, idx) => {
          const isSentByMe = msg.senderId === user._id;
          return (
            <div key={idx} className={`message-bubble-wrapper ${isSentByMe ? 'sent-wrapper' : 'received-wrapper'}`}>
              <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                <span className="tail"></span>
                {renderMessageContent(msg.text)}
                <div className="message-meta">
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                  {isSentByMe && <CheckCheck className="read-receipt" size={15} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-actions" ref={pickerRef} style={{ position: 'relative' }}>
          <Smile 
             className={`action-icon ${showEmojiPicker ? 'active-icon' : ''}`} 
             size={26} 
             onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }} 
          />
          {showEmojiPicker && (
            <div className="emoji-picker-container">
               <EmojiPicker onEmojiClick={onEmojiClick} searchDisabled width={300} height={350} />
            </div>
          )}
          <Paperclip 
             className={`action-icon ${showAttachMenu ? 'active-icon' : ''}`} 
             size={24} 
             onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }} 
          />
          {showAttachMenu && (
            <div className="attach-menu-container">
              <div className="attach-menu-item" onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}>
                <div className="attach-icon-wrapper contact-icon"><UserIcon size={20} color="white" /></div>
                <span>Contact</span>
              </div>
              <div className="attach-menu-item" onClick={() => { alert('Location sharing to be implemented'); setShowAttachMenu(false); }}>
                <div className="attach-icon-wrapper location-icon"><MapPin size={20} color="white" /></div>
                <span>Location</span>
              </div>
              <div className="attach-menu-item" onClick={() => { audioInputRef.current?.click(); setShowAttachMenu(false); }}>
                <div className="attach-icon-wrapper audio-icon"><Music size={20} color="white" /></div>
                <span>Audio</span>
              </div>
              <div className="attach-menu-item" onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}>
                <div className="attach-icon-wrapper image-icon"><ImageIcon size={20} color="white" /></div>
                <span>Image</span>
              </div>
            </div>
          )}
          
          <input type="file" ref={imageInputRef} hidden accept="image/*,video/*" onChange={handleAttachmentChange} />
          <input type="file" ref={audioInputRef} hidden accept="audio/*" onChange={handleAttachmentChange} />
          <input type="file" ref={docInputRef} hidden onChange={handleAttachmentChange} />
          
        </div>
        
        {isRecording ? (
          <div className="chat-input-form" style={{ display: 'flex', alignItems: 'center', paddingLeft: '15px' }}>
            <Trash2 className="action-icon" size={24} color="#f43f5e" onClick={cancelRecording} title="Cancel Recording" />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: 600 }}>
              <span className="pulse-animation" style={{ width: 10, height: 10, backgroundColor: '#f43f5e', borderRadius: '50%' }}></span>
              {formatDuration(recordingTime)}
            </div>
          </div>
        ) : (
          <form className="chat-input-form" onSubmit={handleSend}>
            <input 
              type="text" 
              className="chat-input"
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </form>
        )}
        
        <div className="chat-input-actions">
          {isRecording ? (
            <Send className="action-icon send-icon" size={24} color="#00a884" onClick={stopRecording} title="Send Voice Message" />
          ) : text.trim() ? (
            <Send className="action-icon send-icon" size={24} onClick={handleSend} />
          ) : (
            <Mic className="action-icon" size={24} onClick={startRecording} title="Record Voice Message" />
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatWindow;
