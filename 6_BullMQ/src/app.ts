import express, { type Request, type Response } from 'express';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { emailQueue } from './queue';
config();


const app = express();

app.use(express.json());

app.post('/welcome-email', async (req: Request, res: Response) => { 
    const job = await emailQueue.add(
        "send-welcome-email",
        {
            to: req.body.to,
            subject: req.body.subject || "No Subject",
            body: req.body.body || "No Content",
            createdAt: new Date().toISOString()
        },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        }
    );
    return res.json({ message: "Welcome email job added to queue!", jobId: job.id });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});


export default app;