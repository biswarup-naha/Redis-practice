# Simple Redis Email Queue

A lightweight Express application that demonstrates how to decouple email sending from the main application thread using a Redis-backed queue and Nodemailer.

This project serves as a practical exercise in building background worker processes and understanding the fundamentals of asynchronous job processing.

## Getting Started

### Prerequisites

* Node.js
* A running instance of **Redis** (local or remote)
* SMTP credentials (e.g., Gmail App Passwords, Ethereal, or Resend)

### Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```ini
# Redis Configuration
REDIS_URI=redis://localhost:6379

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Email Sender Info
FROM_NAME="App Support"
FROM_EMAIL=your_email@gmail.com

```

## 📡 API Endpoints

### 1. `POST /emails`

Pushes a new email job onto the Redis queue.

* **Body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Hello World",
  "body": "This is a test email."
}

```

* **Response:** Returns the queued job details.

### 2. `GET /emails/process-one`

Acts as a manual worker. Pops a single job off the end of the Redis queue and attempts to send it using Nodemailer.

* **Response:** Returns the dequeued job upon a successful send, or a `404` if the queue is empty.

### 3. `GET /health`

Standard health check endpoint to verify the server is running.

---

## Learnings & System Limitations

While building this basic `lpush` / `rpop` queue, I learned that a production-ready message broker requires much more than just pushing and pulling data.

Currently, this architecture has a few structural limitations that highlight why tools like **BullMQ** or **RabbitMQ** are used in enterprise environments:

1. **No Retry Mechanism:** If the SMTP server rejects the email or times out, the job is completely lost. There is no automated way to retry failed sends.
2. **Data Loss on Crash (No Fallback):** Because `rpop` instantly removes the job from Redis, if the Node server crashes *during* the Nodemailer execution, the email is never sent and the job data is permanently deleted. (A reliable queue would use `RPOPLPUSH` or acknowledgements).
3. **No Support for Parallel Workers:** The current implementation processes one job at a time per request. Scaling this to multiple background workers continuously polling the queue would risk race conditions or blocking issues.
