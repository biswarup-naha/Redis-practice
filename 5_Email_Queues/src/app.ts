import express, { type Request, type Response } from 'express';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';


config();


const app = express();
const redis = new Redis(process.env.REDIS_URI || 'redis://localhost:6379');
const emailQueueKey = 'queue:email';

app.use(express.json());

app.post('/emails', async (req: Request, res: Response) => { 
    const job = {
        to: req.body.to,
        subject: req.body.subject || "No Subject",
        body: req.body.body || "No Content",
        createdAt: new Date().toISOString()
    }
    await redis.lpush(emailQueueKey, JSON.stringify(job));
    res.json({ queued: true, job });
});

app.get('/emails/process-one', async (req: Request, res: Response) => {
    const jobData = await redis.rpop(emailQueueKey);
    if (!jobData) {
        return res.status(404).json({ error: 'No email to process' });
    }
    const job = JSON.parse(jobData);
    // simulate email sending here (e.g., using nodemailer)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    
    transporter.sendMail({
        from: {
            name: process.env.FROM_NAME as string,
            address: process.env.FROM_EMAIL as string
        },
        to: job.to,
        subject: job.subject,
        text: job.body
    }, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
        } else {
            // console.log('Email sent:', nodemailer.getTestMessageUrl(info));
            console.log('Email sent:', info.accepted);
            return res.json({ dequeued: true, job });
        } 
    });
});

// Problems in redis email queue: 
// 1. No retry mechanism for failed email sends.
// 2. No fallback for job loss.
// 3. No support for parallel workers.

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});


export default app;