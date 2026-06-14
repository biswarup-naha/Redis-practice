import { config } from 'dotenv';
config();

import { Worker } from 'bullmq';
import { connection } from './queue.ts';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const worker = new Worker('emails',
    async job => {
        console.log(`[Job ${job.id}] Processing email for: ${job.data.to}`);

        const { to, subject, body } = job.data;
        const info = await transporter.sendMail({
            from: {
                name: process.env.FROM_NAME as string,
                address: process.env.FROM_EMAIL as string
            },
            to: to,
            subject: subject,
            text: body
        });

        console.log(`[Job ${job.id}] Email sent successfully! Message ID: ${info.messageId}`);
        return info;
    },
    { connection });

worker.on("completed", (job, result) => {
    console.log("email job completed! ", job?.id, job?.name, result.messageId);
});

worker.on("failed", (job, err: Error) => {
    console.log("email job failed! ", job?.id, job?.name, err?.message);
});