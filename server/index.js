import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import buyerRoutes from './routes/buyer.js';
import sellerRoutes from './routes/seller.js';
import chatbotRoutes from './routes/chatbot.js';
import adminRoutes from './routes/adminRoutes.js';
import { connectDB, isDbConnected } from './db.js';
import { seedInitialData } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB and seed initial data
connectDB().then(() => {
  seedInitialData();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes); // Mount at /api so /api/matches, /api/deliveries, etc. resolve directly
app.use('/api', dashboardRoutes);
app.use('/api', buyerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ReLoop 2.0 API',
    database: isDbConnected() ? 'MongoDB Connected' : 'In-Memory Resilient Store',
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(PORT, () => {
  console.log(`[ReLoop Server] Running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('[ReLoop Server Error]', err);
});
