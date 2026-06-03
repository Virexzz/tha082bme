const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// ================= MIDDLEWARES =================
app.use(express.json()); // Parses incoming JSON body payloads

app.use(cors({
    origin: '*', // Allows all origins (Perfect for your Vercel deployments!)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ================= FILE UPLOADS (MULTER) =================
// ⚠️ NOTE: Local disk storage wipes upon Render service sleeping/restarting.
// Perfect for project testing, but long term consider integrating Cloudinary or Supabase Storage buckets.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure to create a folder named 'uploads' in your backend root!
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Prevents name conflicts
    }
});

const upload = multer({ storage: storage });

// Serve uploaded static files over public routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ANNOUNCEMENT ROUTES =================

// 🚀 CONSOLIDATED POST ROUTE FOR ANNOUNCEMENTS & FILES
app.post('/api/announcements', upload.single('file'), async (req, res) => {
    // Multer pushes text fields to req.body, and the file data metadata to req.file
    const { title, content, category, token } = req.body; 
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        if (!token) return res.status(401).json({ message: 'No token provided' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check structural validation against the authorization key match
        const userCheck = await db.query('SELECT is_admin, name FROM users WHERE id = $1', [decoded.id]);
        if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
            return res.status(403).json({ message: 'Unauthorized: Admin access required.' });
        }

        // Insert complete structural parameters into your Supabase Postgres Cluster
        const newPost = await db.query(
            'INSERT INTO announcements (title, content, category, file_url, posted_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, content, category || 'General', fileUrl, userCheck.rows[0].name]
        );

        res.status(201).json({ post: newPost.rows[0], message: 'Published successfully!' });
    } catch (err) {
        console.error('Announcement Posting Error:', err.message);
        res.status(500).send('Server Error while creating announcement.');
    }
});

// GET ALL ANNOUNCEMENTS
app.get('/api/announcements', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching announcements:', err.message);
        res.status(500).send('Error fetching announcements from database.');
    }
});

// DELETE AN ANNOUNCEMENT
app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Announcement not found." });
        }
        
        res.json({ message: "Announcement successfully deleted from the campus matrix." });
    } catch (err) {
        console.error('Deletion Error:', err.message);
        res.status(500).json({ message: "Database failure during deletion process." });
    }
});

// ================= AUTHENTICATION ROUTES =================

// REGISTER USER
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields.' });
        }

        // Enforce Thapathali Mechanical 2082 Email Criteria (Roll Numbers 001 to 048)
        const thapathaliEmailRegex = /^[a-zA-Z]+(\.[a-zA-Z]+)*\.082bme(0[0-3][0-9]|04[0-8])@tcioe\.edu\.np$/i;
        if (!thapathaliEmailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Access Denied! Must follow format: name.082bme###@tcioe.edu.np (Roll: 001 to 048)' 
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Check if user already exists
        const userExist = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered!' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save new profile entry to Cloud Instance
        const newUser = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, normalizedEmail, hashedPassword]
        );

        const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: newUser.rows[0], message: 'Registered successfully!' });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server Error during registration.');
    }
});

// LOGIN USER
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter both email and password.' });
        }

        const normalizedEmail = email.toLowerCase();

        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
            message: 'Logged in successfully!'
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server Error during login.');
    }
});

// VALIDATE AUTHENTICATED SESSION USER (`/me`)
app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1]; // Splits out "Bearer <token>"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await db.query(
            'SELECT id, name, email, is_admin FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});

// ================= HEALTH MONITORING =================
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to the Thapathali Campus Engineering Portal API!",
        status: "Green",
        database: "Connected"
    });
});

// ================= LIFECYCLE LISTEN =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend engine active on port ${PORT}`);
});