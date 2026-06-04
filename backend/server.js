const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// ================= SUPABASE CLOUD STORAGE INIT =================
// Ensure you have added these to your Render Environment Variables!
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= MIDDLEWARES =================
app.use(express.json()); // Parses incoming JSON body payloads

app.use(cors({
    origin: '*', // Allows all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ================= FILE UPLOADS (MULTER) =================
// We use memoryStorage so files stay in RAM just long enough to push to Supabase.
// This prevents the Render ephemeral disk crash.
const upload = multer({ storage: multer.memoryStorage() });

// ================= ANNOUNCEMENT ROUTES =================

// 🚀 POST ROUTE: Save text to Postgres, save files to Supabase Storage
app.post('/api/announcements', upload.array('files', 10), async (req, res) => {
    try {
        const { title, content, category } = req.body;

        // 1. Save the text announcement first
        const insertResult = await db.query(
            'INSERT INTO announcements (title, content, category) VALUES ($1, $2, $3) RETURNING id',
            [title, content, category || 'Class Notice']
        );
        const announcementId = insertResult.rows[0].id;

        // 2. If there are files, upload them to Supabase Storage
        if (req.files && req.files.length > 0) {
            const attachmentPromises = req.files.map(async (file) => {
                // Generate a safe, unique file name
                const uniqueFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
                
                // Upload to Supabase bucket named 'announcement-files'
                const { error: uploadError } = await supabase.storage
                    .from('announcement-files')
                    .upload(uniqueFileName, file.buffer, {
                        contentType: file.mimetype
                    });

                if (uploadError) throw uploadError;

                // Get the public URL for the newly uploaded file
                const { data: publicUrlData } = supabase.storage
                    .from('announcement-files')
                    .getPublicUrl(uniqueFileName);

                // Save this specific attachment's metadata to your database
                await db.query(
                    'INSERT INTO attachments (announcement_id, file_name, file_url, file_type) VALUES ($1, $2, $3, $4)',
                    [announcementId, file.originalname, publicUrlData.publicUrl, file.mimetype]
                );
            });

            // Wait for all cloud uploads and database inserts to finish
            await Promise.all(attachmentPromises);
        }

        res.status(200).json({ success: true, message: "Posted successfully!" });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 🚀 GET ROUTE: Fetch Announcements + their Attachments
app.get('/api/announcements', async (req, res) => {
    try {
        // Advanced SQL: Fetches announcements and bundles their attachments into a neat JSON array
        const query = `
            SELECT a.*, 
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', at.id,
                               'file_name', at.file_name,
                               'file_url', at.file_url,
                               'file_type', at.file_type
                           )
                       ) FILTER (WHERE at.id IS NOT NULL), '[]'
                   ) as attachments
            FROM announcements a
            LEFT JOIN attachments at ON a.id = at.announcement_id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `;
        const result = await db.query(query);
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
        // Assuming your 'attachments' table has 'ON DELETE CASCADE' set up,
        // deleting the announcement will automatically wipe the database records for its files too!
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

        // Save new profile entry to Database
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