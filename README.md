# 🐾 PetOpia Backend

> The best pet health management platform you will ever find!

A comprehensive backend API for managing pet health records, community posts, appointments, medications, and automated appointment reminders.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Running the Server](#-running-the-server)
- [Testing Cron Jobs](#-testing-cron-jobs)

## ✨ Features

- **User Authentication** - Session-based authentication with Redis
- **Pet Management** - Create, update, delete, and view pet profiles
- **Health Records** - Track medications, appointments, and prescriptions
- **Community Posts** - Share posts, like, and comment on pet-related content
- **Image Uploads** - Cloudinary integration for pet photos and prescriptions
- **Appointment Reminders** - Automated email notifications via cron jobs
- **Search & Filtering** - Search community posts and user content
- **Caching** - Redis caching for improved performance

## 🛠 Tech Stack

- **Runtime**: Node.js (v19.9.0+)
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis (Upstash)
- **Authentication**: Session-based with bcrypt
- **Image Storage**: Cloudinary
- **Email**: Nodemailer
- **Cron Jobs**: Vercel Cron (production), node-cron (development)

## 📦 Prerequisites

Before running this project locally, ensure you have:

- **Node.js** v19.9.0 or higher
- **MongoDB** running locally
- **Redis** running locally
- **Cloudinary** account for image uploads
- **Email service** credentials (Gmail recommended)

## 🚀 Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/gundeep77/PetOpia-Backend.git
   cd petopia-server
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Start MongoDB** (if not already running)

   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # or run manually
   mongod
   ```
4. **Start Redis** (if not already running)

   ```bash
   # macOS (with Homebrew)
   brew services start redis

   # or run manually
   redis-server
   ```
5. **Create `.env` file**

   Copy the template below and create a `.env` file in the root directory with your local configuration.

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB (Local)
MONGODB_URI=mongodb://localhost:27017/petopia

# Redis (Local)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cron Job Authentication (for local testing)
CRON_SECRET=test123
```

### 📧 Gmail App Password Setup

1. Enable 2-factor authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this 16-character password as `EMAIL_PASSWORD` in your `.env`

## 💻 Running Locally

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:8000`

## 🛤 API Routes

### Authentication

- `POST /user/signup` - Register new user
- `POST /user/signin` - User login
- `POST /user/signout` - User logout

### Pets

- `GET /account/pets/:userId` - Get all pets for a user
- `GET /account/pets/mypet/:userId/:petId` - Get specific pet
- `POST /account/pets/:userId` - Create new pet
- `PUT /account/pets/:userId` - Update pet
- `DELETE /account/pets/:userId` - Delete pet

### Health Records

- `POST /account/pets/medication` - Add medication
- `DELETE /account/pets/medication` - Delete medication
- `POST /account/pets/appointment` - Add appointment
- `DELETE /account/pets/appointment` - Delete appointment
- `POST /account/pets/prescription` - Add prescription
- `DELETE /account/pets/prescription` - Delete prescription

### Community

- `GET /account/community-posts` - Get all community posts
- `GET /account/my-posts` - Get user's posts
- `POST /account/community-posts` - Create post
- `PUT /account/community-posts` - Update post
- `DELETE /account/community-posts/:postId` - Delete post

### Comments & Likes

- `POST /view-post/comments` - Add comment
- `PUT /view-post/comments` - Edit comment
- `DELETE /view-post/comments/:commentId` - Delete comment
- `POST /likes/like` - Like/unlike post

### Upload

- `POST /upload` - Upload image to Cloudinary

### Cron (Protected)

- `GET /cron/appointment-reminder` - Trigger appointment reminders

## ⏰ Testing Cron Jobs Locally

To manually test the appointment reminder cron job:

```bash
curl -H "Authorization: Bearer test123" http://localhost:8000/cron/appointment-reminder
```

This will:

- Check all appointments in the database
- Send email reminders for appointments scheduled for tomorrow
- Return a success/error message

## 👨‍💻 Author

**Gundeep Singh Saluja**

---

Made with ❤️ for pets everywhere 🐾
