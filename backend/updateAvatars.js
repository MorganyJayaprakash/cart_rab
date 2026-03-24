const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const avatarMap = {
  'resma': 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=200&h=200',
  'asvita': 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=200&h=200',
  'nandhini': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=200&h=200',
  'alfiya': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=200&h=200',
  'varun': 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=200&h=200',
  'valan': 'https://images.unsplash.com/photo-1555861496-0666c8981751?auto=format&fit=crop&q=80&w=200&h=200',
  'yadhu': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=200&h=200',
  'felix': 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=200&h=200',
  'famitha': 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&q=80&w=200&h=200',
  'einiya': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=200&h=200',
  'kris': 'https://images.unsplash.com/photo-1506744626753-1fa44df31c7f?auto=format&fit=crop&q=80&w=200&h=200'
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-clone')
  .then(async () => {
    console.log('Connected to DB');
    for (const [username, avatar] of Object.entries(avatarMap)) {
      await User.updateOne({ username }, { avatar });
      console.log(`Updated ${username} with avatar ${avatar}`);
    }
    console.log('Finished updating avatars.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
