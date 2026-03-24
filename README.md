# 💬 My WhatsApp Web Clone

Hey! I built this full-stack WhatsApp Web clone to dive deep into real-time applications. It's built with the MERN stack (MongoDB, Express, React, Node.js) and uses Socket.io heavily for the instant messaging features.

I tried to make it look and feel as close to the real WhatsApp Web as possible, including smooth animations, the exact color schemes, and even the modern filter tabs!

## ✨ What I've built so far:
- **Instant Messaging**: Real-time chat with online status and live messages using WebSockets.
- **Voice Notes**: You can actually click the mic icon, record a voice message, and send it directly in the chat!
- **WebRTC Calls**: Added full peer-to-peer audio and video calling with an authentic incoming call screen.
- **Custom Wallpapers**: Every user can upload and set their own custom chat backgrounds.
- **Aesthetic Profiles**: Seeded the database with nice Unsplash images for contact avatars instead of boring default icons.
- **Modern UI**: Added the sliding Settings panel, the 3-dots dropdown menus, and the new "All / Unread / Groups" filter bubbles.

## 🛠️ The Tech Stack I used:
**Frontend:**
- React 19 (built with Vite for speed)
- React Router DOM (for navigating between login and chat pages)
- Axios (for API calls)
- Socket.io-client
- Vanilla CSS (I styled everything manually to match WhatsApp perfectly!)
- Lucide-React (for the icons)

**Backend:**
- Node.js & Express
- MongoDB & Mongoose (to save all the chats and users securely)
- Socket.io (for the real-time node server)
- JWT & bcryptjs (for secure login and auth)

---

## 🚀 How to run it locally



### 1. Set up the Backend

cd backend
npm install

PORT=5000
MONGO_URI=mongodb://localhost:27017/whatsapp-clone
JWT_SECRET=any_secret_key_you_want



node seedUsers.js
node updateAvatars.js

npm run dev

### 2. Set up the Frontend

cd frontend
npm install
npm run dev
```

1. Go to `http://localhost:5173` in your browser.
2. Register an account.
3. Open an Incognito window, register a second account, and try chatting/calling between them!

---

