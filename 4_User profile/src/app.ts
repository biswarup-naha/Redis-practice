import express, { type Request, type Response } from 'express';
import Redis from 'ioredis';
import { config } from 'dotenv';


config();


const app = express();
const redis = new Redis(process.env.REDIS_URI || 'redis://localhost:6379');

app.use(express.json());

app.post("/user/:id/json", async (req: Request, res: Response) => { 
    const { id } = req.params;
    const userData = req.body;
    
    await redis.set(`user:${id}:json`, JSON.stringify(userData));
    res.status(200).json({ message: 'User data cached as json' });
});

app.get("/user/:id/json", async (req: Request, res: Response) => {
    const { id } = req.params; 
    const cachedData = await redis.get(`user:${id}:json`);
    if (!cachedData) {
        return res.status(404).json({ message: 'User data not found' });
    }
    res.json(JSON.parse(cachedData));
});

app.post("/user/:id/hash", async (req: Request, res: Response) => {
    const { id } = req.params;
    const userData = req.body;

    await redis.hset(`user:${id}:hash`, userData);
    res.status(200).json({ message: 'User data cached as hash' });
});

app.get("/user/:id/hash", async (req: Request, res: Response) => { 
    const { id } = req.params;
    // const cachedData = await redis.hget(`user:${id}:hash`, 'firstName', (err, result) => {
    //     if (err) {
    //         console.log(err.message);
    //         return;
    //     }
    // });
    const cachedData = await redis.hgetall(`user:${id}:hash`);
    res.json(cachedData);
});

app.get("/user/:id/hash/exists", async (req: Request, res: Response) => {
    const { id } = req.params;
    const exists = await redis.exists(`user:${id}:hash`);
    res.json({ exists: exists === 1 });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});


export default app;