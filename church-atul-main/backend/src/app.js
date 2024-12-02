const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

const app = express();

// Middlewares
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Routes
app.use('/accounts', require('./routes/user.routes'));
app.use('/church', require('./routes/church.routes'));
app.use('/notifications', require('./routes/notification.routes'));
app.use('/transaction', require('./routes/payment.routes'));
app.use('/role', require('./routes/role.routes'));

app.use('/uploads', express.static('uploads'));
app.post('/upload', upload.single('image'), (req, res) => {
    console.log('Image received:', req.file.originalname);
    let filename = req.file.originalname;
    // Handle image processing or storage logic here
    res.status(200).json({ message: 'Image uploaded', path: `https://monegliseci.com/uploads/${filename}` });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});