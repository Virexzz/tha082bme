const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Parses incoming JSON body payloads

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure to create a folder named 'uploads' in your backend root!
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Prevents files with duplicate names from overwriting each other
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// UPGRADED POST ROUTE FOR ANNOUNCEMENTS & FILES
app.post('/api/announcements', upload.single('file'), async (req, res) => {
    // Multer puts the text fields in req.body, and the file data in req.file
    const { title, content, category, token } = req.body; 
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        if (!token) return res.status(401).json({ message: 'No token provided' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userCheck = await db.query('SELECT is_admin, name FROM users WHERE id = $1', [decoded.id]);
        if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const newPost = await db.query(
            'INSERT INTO announcements (title, content, category, file_url, posted_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, content, category, fileUrl, userCheck.rows[0].name]
        );

        res.status(201).json({ post: newPost.rows[0], message: 'Published successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ================= REGISTER ROUTE =================
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 1. Structural validation check
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields.' });
        }

        // 2. Enforce official Thapathali Mechanical 2082 Email Regex Criteria
        // Validates roll numbers exactly from 001 to 048
        const thapathaliEmailRegex = /^[a-zA-Z]+(\.[a-zA-Z]+)*\.082bme(0[0-3][0-9]|04[0-8])@tcioe\.edu\.np$/i;
        if (!thapathaliEmailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Access Denied! Must follow format: name.082bme###@tcioe.edu.np (Roll: 001 to 048)' 
            });
        }

        // Standardize email to lower case to eliminate duplicate registration conflicts
        const normalizedEmail = email.toLowerCase();

        // 3. Check if user already exists
        const userExist = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered!' });
        }

        // 4. Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Save to database
        const newUser = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, normalizedEmail, hashedPassword]
        );

        // 6. Generate JWT login token
        const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: newUser.rows[0], message: 'Registered successfully!' });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server Error during registration.');
    }
});

// ================= LOGIN ROUTE =================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter both email and password.' });
        }

        // Standardize incoming credentials to match your database normalization
        const normalizedEmail = email.toLowerCase();

        // 1. Check if user exists
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // 2. Check password matches hashed version
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Generate JWT login token
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


app.get('/api/announcements', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM announcements ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error fetching announcements');
    }
});


app.post('/api/announcements', async (req, res) => {
    const { title, content, token } = req.body;

    try {
        if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

        // 1. Verify token to find out who this user is
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 2. Query DB to check if this user is a verified admin
        const userCheck = await db.query('SELECT is_admin, name FROM users WHERE id = $1', [decoded.id]);
        
        if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
            return res.status(403).json({ message: 'Forbidden: You do not have admin rights.' });
        }

        const adminName = userCheck.rows[0].name;

        // 3. Save announcement to database
        const newAnnouncement = await db.query(
            'INSERT INTO announcements (title, content, posted_by) VALUES ($1, $2, $3) RETURNING *',
            [title, content, adminName]
        );

        res.status(201).json({ announcement: newAnnouncement.rows[0], message: 'Announcement posted!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error while saving announcement.');
    }
});

app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1]; // Bearer <token>

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

app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // 🌟 Changed from pool.query to db.query
        const result = await db.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Announcement not found." });
        }
        
        res.json({ message: "Announcement successfully deleted from the campus matrix." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database failure during deletion process." });
    }
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to the Thapathali Campus Engineering Portal API!",
        status: "Green",
        database: "Connected"
    });
});

// Start listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend engine active on port ${PORT}`);
});