
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const csurf = require('csurf');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(cors({
    origin: 'http://localhost:3002', // Adjusted to backend server origin serving frontend files
    credentials: true
}));

const { contentSecurityPolicy } = require('helmet');

// Use helmet for security headers with strict Content Security Policy
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"]
        }
    }
}));

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

const PORT = process.env.PORT || 3002;

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, {
    setHeaders: (res, path) => {
        console.log(`Attempting to serve: ${path}`);
    }
}));

// Middleware to parse JSON requests
app.use(express.json());

// Add session middleware
app.use(session({
    secret: 'your-secret-key', // Change this to a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set secure: true if using HTTPS in production
}));

// CSRF protection middleware
const csrfProtection = csurf({
    cookie: false
});

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/thrifted'; // Use thrifted database

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const multer = require('multer');
const fs = require('fs');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + Date.now() + ext;
        cb(null, filename);
    }
});
const upload = multer({ storage: storage });

const crypto = require('crypto');
const nodemailer = require('nodemailer');

const userSchema = new mongoose.Schema({
    username: { type: String, default: '', required: true }, // display name renamed to username, now unique
    handle: { type: String, required: true, unique: true }, // username renamed to handle
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    profilePictureUrl: { type: String, default: '' },
    coverPhotoUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

const User = mongoose.model('User', userSchema);

// Signup route
app.post('/signup', async (req, res) => {
    console.log('Signup request body:', req.body);
    let { username, handle, email, password } = req.body;
    if (!username || !handle || !email || !password) {
        return res.status(400).json({ message: 'Missing username, handle, email or password' });
    }
    // Trim inputs
    username = username.trim();
    handle = handle.trim();
    email = email.trim().toLowerCase();

    // Password validation: at least 8 characters, 1 number, 1 special character
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long and include at least one number and one special character' });
    }

    try {
        const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        console.log('existingUsername:', existingUsername);
        if (existingUsername) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        const existingHandle = await User.findOne({ handle: { $regex: new RegExp(`^${handle}$`, 'i') } });
        console.log('existingHandle:', existingHandle);
        if (existingHandle) {
            return res.status(409).json({ message: 'Handle already exists' });
        }
        const existingEmail = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        console.log('existingEmail:', existingEmail);
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ username, handle, email, passwordHash });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', loginLimiter, async (req, res) => {
    console.log('Login request body:', req.body);
    const { handleOrEmail, password } = req.body;
    if (!handleOrEmail || !password) {
        return res.status(400).json({ message: 'Missing username or email or password' });
    }
    try {
        const user = await User.findOne({ $or: [{ handle: handleOrEmail }, { email: handleOrEmail }] });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Save user info in session including isAdmin flag
        req.session.user = { handle: user.handle, username: user.username, email: user.email, isAdmin: user.isAdmin };
        res.json({ message: 'Login successful', handle: user.handle, username: user.username, isAdmin: user.isAdmin });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/me', isAuthenticated, async (req, res) => {
    if (req.session.user) {
        try {
            const user = await User.findOne({ handle: req.session.user.handle });
            if (!user) {
                return res.json({ loggedIn: false });
            }
            res.json({
                loggedIn: true,
                user: {
                    _id: user._id,
                    username: user.username,
                    handle: user.handle,
                    email: user.email,
                    profilePictureUrl: user.profilePictureUrl,
                    coverPhotoUrl: user.coverPhotoUrl,
                    bio: user.bio,
                    isAdmin: user.isAdmin
                }
            });
        } catch (error) {
            console.error('Error fetching user info:', error);
            res.status(500).json({ loggedIn: false });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

// Modify the root route to redirect to homei.html
app.get('/', (req, res) => {
    if (req.session.user && req.session.user.isAdmin) {
        res.redirect('/admin-dashboard.html');
    } else {
        res.redirect('/homei.html'); // Redirect to the static file
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: 'Logout successful' });
    });
});

app.post('/api/profile/upload', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 }
]), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const username = req.session.user.username;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.files['profilePicture']) {
            const profilePicPath = '/uploads/' + req.files['profilePicture'][0].filename;
            user.profilePictureUrl = profilePicPath;
        }
        if (req.files['coverPhoto']) {
            const coverPhotoPath = '/uploads/' + req.files['coverPhoto'][0].filename;
            user.coverPhotoUrl = coverPhotoPath;
        }

        if (req.body.bio !== undefined) {
            user.bio = req.body.bio;
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            profilePictureUrl: user.profilePictureUrl,
            coverPhotoUrl: user.coverPhotoUrl,
            bio: user.bio
        });
    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Endpoint to clear profile and cover images
app.post('/api/profile/clear-images', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const username = req.session.user.username;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.profilePictureUrl = '';
        user.coverPhotoUrl = '';
        await user.save();
        res.json({ message: 'Profile and cover images cleared successfully' });
    } catch (error) {
        console.error('Error clearing images:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    clothingType: { type: String, default: '' },
    brand: { type: String, default: '' },
    price: { type: Number, required: true },
    condition: { type: String, default: 'New' },
    likes: { type: Number, default: 0 },
    coverPhotoUrl: { type: String, default: '' },
    sellerUsername: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Cart schema and model
const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema]
});

const Cart = mongoose.model('Cart', cartSchema);

// Order schema and model
const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
    priceAtPurchase: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
    });
});

// API endpoint to add a new product
app.post('/api/products', upload.fields([
    { name: 'coverPhoto', maxCount: 1 },
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'backPhoto', maxCount: 1 },
    { name: 'sidePhoto', maxCount: 1 },
    { name: 'labelPhoto', maxCount: 1 },
    { name: 'detailPhoto', maxCount: 1 },
    { name: 'flawPhoto', maxCount: 1 }
]), async (req, res) => {
    console.log('Received /api/products POST request');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);

    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { name, description, category, clothingType, brand, price, condition } = req.body;
        if (!name || !price) {
            return res.status(400).json({ message: 'Name and price are required' });
        }
        let coverPhotoUrl = '';
        if (req.files['coverPhoto'] && req.files['coverPhoto'][0]) {
            coverPhotoUrl = '/uploads/' + req.files['coverPhoto'][0].filename;
        }
        const newProduct = new Product({
            name,
            description: description || '',
            category: category || '',
            clothingType: clothingType || '',
            brand: brand || '',
            price,
            condition: condition || 'New',
            coverPhotoUrl,
            sellerUsername: req.session.user.username
        });
        await newProduct.save();

        // Notify connected clients about the new product
        if (wss) {
            const productData = {
                id: newProduct._id,
                name: newProduct.name,
                price: newProduct.price,
                condition: newProduct.condition,
                likes: newProduct.likes,
                coverPhotoUrl: newProduct.coverPhotoUrl,
                sellerUsername: newProduct.sellerUsername
            };
            wss.clients.forEach(client => {
                if (client.readyState === 1) { // OPEN
                    client.send(JSON.stringify({ type: 'newProduct', product: productData }));
                }
            });
        }

        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API endpoint to get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/myproducts', isAuthenticated, async (req, res) => {
    try {
        const username = req.session.user.username;
        const products = await Product.find({ sellerUsername: username }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching user products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Removed ownership check to allow all authenticated users to view product details
        res.json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API endpoint to delete a product by ID (only owner can delete)
app.delete('/api/products/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.sellerUsername !== req.session.user.username) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this product' });
        }
        await Product.findByIdAndDelete(productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API endpoint to update a product by ID (only owner can update)
app.put('/api/products/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.sellerUsername !== req.session.user.username) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this product' });
        }

        // Update allowed fields
        const { name, description, category, clothingType, brand, price, condition, coverPhotoUrl } = req.body;
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (category !== undefined) product.category = category;
        if (clothingType !== undefined) product.clothingType = clothingType;
        if (brand !== undefined) product.brand = brand;
        if (price !== undefined) product.price = price;
        if (condition !== undefined) product.condition = condition;
        if (coverPhotoUrl !== undefined) product.coverPhotoUrl = coverPhotoUrl;

        await product.save();
        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * CART API ENDPOINTS
 */

// Get current user's cart
app.get('/api/cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const user = await User.findOne({ handle: req.session.user.handle });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (!cart) {
            cart = new Cart({ userId: user._id, items: [] });
            await cart.save();
        }
        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add item to cart
app.post('/api/cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { productId, quantity } = req.body;
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }
    try {
        const user = await User.findOne({ handle: req.session.user.handle });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let cart = await Cart.findOne({ userId: user._id });
        if (!cart) {
            cart = new Cart({ userId: user._id, items: [] });
        }
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity ? quantity : 1;
        } else {
            cart.items.push({ productId, quantity: quantity ? quantity : 1 });
        }
        await cart.save();
        res.json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Remove item from cart
app.delete('/api/cart/:productId', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const productId = req.params.productId;
    try {
        const user = await User.findOne({ handle: req.session.user.handle });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let cart = await Cart.findOne({ userId: user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        res.json({ message: 'Item removed from cart', cart });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * ORDER API ENDPOINTS
 */

// Place an order
app.post('/api/orders', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const user = await User.findOne({ handle: req.session.user.handle });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        const orderItems = cart.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            priceAtPurchase: item.productId.price
        }));
        const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.priceAtPurchase, 0);
        const newOrder = new Order({
            userId: user._id,
            items: orderItems,
            totalAmount,
            status: 'Pending'
        });
        await newOrder.save();
        // Clear cart after order placement
        cart.items = [];
        await cart.save();
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get order history for user
app.get('/api/orders', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const user = await User.findOne({ handle: req.session.user.handle });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).populate('items.productId');
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/users/:handle', async (req, res) => {
    const handle = req.params.handle;
    try {
        const user = await User.findOne({ handle: handle });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.username,
            handle: user.handle,
            profilePictureUrl: user.profilePictureUrl,
            coverPhotoUrl: user.coverPhotoUrl,
            bio: user.bio
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

function isAdminMiddleware(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    User.findOne({ handle: req.session.user.handle }).then(user => {
        if (user && user.isAdmin) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Admins only' });
        }
    }).catch(err => {
        console.error('Error checking admin status:', err);
        res.status(500).json({ message: 'Internal server error' });
    });
}

const transporter = nodemailer.createTransport({
    // For testing, use Ethereal SMTP or configure your SMTP server here
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'your_ethereal_username', // replace with your Ethereal user
        pass: 'your_ethereal_password'  // replace with your Ethereal password
    }
});

// POST /forgot-password - request password reset
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Generate reset token and expiration (1 hour)
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

        // Send email with reset link
        const mailOptions = {
            from: '"Thrifted Support" <no-reply@thrifted.com>',
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
            html: `<p>You requested a password reset.</p><p>Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending reset email:', error);
                return res.status(500).json({ message: 'Error sending reset email' });
            }
            console.log('Password reset email sent:', info.response);
            res.json({ message: 'Password reset link has been sent to your email' });
        });
    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /reset-password - reset password using token
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/users - list all users (admin only)
app.get('/api/admin/users', isAdminMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, 'username handle email isAdmin');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
    }
});
