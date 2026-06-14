import express, { type Request, type Response } from 'express';
import Redis from 'ioredis';
import { config } from 'dotenv';


config();


const app = express();
const redis = new Redis(process.env.REDIS_URI || 'redis://localhost:6379');

const BANNER_KEY = 'app:banner';

app.route('/banner',)
    .post(async (req: Request, res: Response) => {
        await redis.set(BANNER_KEY, req.body.message ?? 'Default Banner Message');
        res.json({ message: 'Banner set successfully' });
    })
    .get(async (req: Request, res: Response) => {
        const banner = await redis.get(BANNER_KEY);
        res.json({ message: banner ?? 'No message found' });
    })
    .delete(async (req: Request, res: Response) => {
        await redis.del(BANNER_KEY);
        res.json({ message: 'Banner deleted successfully' });
    });


app.get("/banner/exists", async (req: Request, res: Response) => {
    const exists = await redis.exists(BANNER_KEY);
    res.json({ exists: !!exists });
});  
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});


export default app;