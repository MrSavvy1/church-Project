const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const payment = require("./routes/payment.routes");
dotenv.config();
const cors = require('cors');
const multer = require('multer');
const Grid = require('gridfs-stream');
const { GridFSBucket } = require('mongodb');
const crypto = require('crypto');
const path = require('path');

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

// Initialize GridFS
let gfs, gridFSBucket;
db.once('open', () => {
    gridFSBucket = new GridFSBucket(db.db, {
        bucketName: 'uploads'
    });
    gfs = Grid(db.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Example route for the root URL
app.get('/', (req, res) => {
    res.status(200).send('Hello, World!');
});

// Route for image upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileInfo = {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
    };

    const writeStream = gridFSBucket.openUploadStream(fileInfo.filename, {
        contentType: fileInfo.contentType,
    });

    writeStream.end(req.file.buffer);

    writeStream.on('finish', () => {
        res.status(200).json({ message: 'Image uploaded', file: fileInfo });
    });

    writeStream.on('error', (err) => {
        console.error('Error uploading file:', err);
        res.status(500).json({ err: err.message });
    });
});

// Route to retrieve image
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (err) {
            console.error('Error finding file:', err);
            return res.status(500).json({ err: err.message });
        }

        if (!file || file.length === 0) {
            return res.status(404).json({ err: 'No file exists' });
        }

        // Check if image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            const readstream = gridFSBucket.openDownloadStreamByName(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({ err: 'Not an image' });
        }
    });
});

// Import routes
const userRoutes = require('./routes/user.routes');
const churchRoutes = require('./routes/church.routes');
const notificationRoutes = require('./routes/notification.routes');
const paymentRoutes = require('./routes/payment.routes');
const roleRoutes = require('./routes/role.routes');

// Use routes
app.use('/api/accounts', userRoutes);
app.use('/api/church', churchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transaction', paymentRoutes);
app.use('/api/role', roleRoutes);
app.use("/api/pay", payment);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});