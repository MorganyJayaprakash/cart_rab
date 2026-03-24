const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const bioMap = {
  'resma': 'Living in a world of my creation',
  'asvita': 'Rooted in hope, blooming in dreams',
  'nandhini': 'Stardust soul, moonlight dreams',
  'alfiya': 'Chasing sunsets and daydreams',
  'varun': 'Surviving on vibes, WiFi, and snacks',
  'valan': 'My life is 10% plans, 90% jokes',
  'yadhu': 'Loading… life in progress',
  'felix': 'I’m like coffee: dark, bitter, and too hot for you',
  'famitha': 'Born to express, not impress',
  'einiya': 'Dream big, hustle harder',
  'kris': 'Less perfection, more authenticity'
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-clone')
  .then(async () => {
    console.log('Connected to DB');
    for (const [username, bio] of Object.entries(bioMap)) {
      await User.updateOne({ username }, { bio });
      console.log(`Updated ${username} with bio: ${bio}`);
    }
    console.log('Finished updating bios.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
