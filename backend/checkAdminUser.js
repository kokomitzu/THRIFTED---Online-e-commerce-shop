const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/thrifted';

const userSchema = new mongoose.Schema({
    username: String,
    handle: String,
    email: String,
    passwordHash: String,
    isAdmin: Boolean
});

const User = mongoose.model('User', userSchema);

async function checkAdminUser() {
    try {
        await mongoose.connect(mongoURI);
        const user = await User.findOne({ handle: 'adminreal' });
        if (!user) {
            console.log('User adminreal not found');
        } else {
            console.log('User found:', {
                username: user.username,
                handle: user.handle,
                email: user.email,
                isAdmin: user.isAdmin,
                passwordHash: user.passwordHash
            });
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdminUser();
