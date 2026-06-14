import express, { type Request, type Response } from 'express';
import Redis from 'ioredis';
import { config } from 'dotenv';


config();


const app = express();
const redis = new Redis(process.env.REDIS_URI || 'redis://localhost:6379');

app.use(express.json());

function otpKey(phone: string): string {
    return `otp:${phone}`;
}

app.post('/otp', async (req: Request, res: Response) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(otpKey(phone), otp, 'EX', 300); // Redis TTL:- OTP expires in 5 minutes
    res.json({ message: 'OTP sent successfully', otp }); // In a real application, you would send the OTP via SMS or email instead of returning it in the response
});

app.post('/otp/verify', async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const storedOtp = await redis.get(otpKey(phone));
    if (storedOtp === otp) {
        await redis.del(otpKey(phone)); // Delete the OTP after successful verification
        res.json({ message: 'OTP verified successfully' });
    }
    else if(!storedOtp) {
        res.status(400).json({ message: 'OTP expired' });
    }
    else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

app.get('/otp/:phone/ttl', async (req: Request, res: Response) => {
    const phone = req.params.phone;
    if (!phone || Array.isArray(phone)) {
        return res.status(400).json({ message: 'Invalid phone parameter' });
    }

    const ttl = await redis.ttl(otpKey(phone));
    res.json({ phone, ttl });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});


export default app;