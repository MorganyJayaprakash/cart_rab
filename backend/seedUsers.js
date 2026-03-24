const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const usersToCreate = [
  'resma', 'asvita', 'nandhini', 'alfiya', 'varun', 
  'valan', 'yadhu', 'felix', 'famitha', 'einiya', 'kris'
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-clone')
  .then(async () => {
    console.log('Connected to DB for seeding users...');
    for (const username of usersToCreate) {
      const email = `${username}@gmail.com`;
      const password = '12345678';
      
      const existing = await User.findOne({ username });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.create({ username, email, password: hashedPassword });
        console.log(`Created user: ${username}`);
      } else {
        console.log(`User ${username} already exists, skipping.`);
      }
    }
    console.log('Finished seeding users.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
