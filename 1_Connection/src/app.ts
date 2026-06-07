import express, { type Request, type Response } from 'express';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { config } from 'dotenv';


config();


const app = express();
const redis = new Redis(process.env.REDIS_URI || 'redis://localhost:6379');


app.get('/redis', async (req: Request, res: Response) => {
    const ping = await redis.ping();
    res.json({ message: `Redis PING ${ping}` });
});


app.get('/mongoose', async (req: Request, res: Response) => {
    const url = process.env.MONGO_URI || 'mongodb://localhost:27017/mongo_for_redis';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(url);
    }
    res.json({ message: `Mongo connection status: ${mongoose.connection.readyState}` });
});

export default app;