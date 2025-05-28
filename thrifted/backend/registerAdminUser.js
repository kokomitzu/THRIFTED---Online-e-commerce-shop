const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const mongoURI = 'mongodb://localhost:27017/thrifted';

const userSchema = new mongoose.Schema({
    username: { type: String, default: '', required: true },
    handle: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

async function registerAdminUser() {
    try {
        await mongoose.connect(mongoURI);

        const existingUser = await User.findOne({ handle: 'adminreal' });
        if (existingUser) {
            console.log('User adminreal already exists');
            await mongoose.disconnect();
            return;
        }

        const password = 'njmsjmdct9!';
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: 'Admin Real',
            handle: 'adminreal',
            email: 'adminreal@gmail.com',
            passwordHash,
            isAdmin: true
        });

        await newUser.save();
        console.log('Admin user registered successfully');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error registering admin user:', error);
    }
}

registerAdminUser();
