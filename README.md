# Email Verification App

A Modular Node.js application with email verification using Express, Passport, and MySQL.

## Project Structure

```
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MySQL database connection
│   │   ├── email.js         # Nodemailer configuration
│   │   └── passport.js      # Passport authentication setup
│   ├── controllers/         # Business logic
│   │   └── authController.js
│   ├── models/              # Database operations
│   │   └── userModel.js     # User CRUD operations
│   ├── middleware/          # Custom middleware
│   │   └── authMiddleware.js
│   ├── routes/              # Route definitions
│   │   ├── authRoutes.js    # Authentication routes
│   │   └── indexRoutes.js   # Home and dashboard routes
│   ├── utils/               # Helper functions
│   │   ├── crypto.js        # Password hashing & token generation
│   │   └── validators.js    # Input validation
│   ├── app.js              # Express app configuration
│   └── server.js           # Application entry point
├── .env                     # Environment variables
├── package.json
└── README.md

```

## Features

- ✅ User registration with email verification
- ✅ Secure password hashing (PBKDF2)
- ✅ Session-based authentication (Passport.js)
- ✅ Email verification via nodemailer
- ✅ Protected routes/middleware
- ✅ Modular, maintainable code structure

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- Gmail account for sending emails

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your `.env` file:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=email_verification
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SESSION_SECRET=your-secret-key
   PORT=5000
   ```

4. Set up the database:

   ```sql
   CREATE DATABASE email_verification;

   USE email_verification;

   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password_hash VARCHAR(128) NOT NULL,
     password_salt VARCHAR(32) NOT NULL,
     verified TINYINT(1) NOT NULL DEFAULT 0,
     verify_token VARCHAR(64) NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

## Running the Application

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Architecture

### Config Layer

- **database.js**: Manages MySQL connection pooling with promisified queries
- **email.js**: Configures nodemailer transporter for Gmail
- **passport.js**: Sets up Passport Local Strategy for authentication

### Models Layer

- **userModel.js**: Database operations (CRUD) for users
  - `findByEmail()`, `findById()`, `create()`, etc.

### Controllers Layer

- **authController.js**: Business logic for authentication
  - Registration, login, logout, email verification

### Routes Layer

- **authRoutes.js**: Authentication endpoints
- **indexRoutes.js**: Public and protected pages

### Middleware Layer

- **authMiddleware.js**: Route protection (requireLogin)

### Utils Layer

- **crypto.js**: Security utilities (hashing, salt, tokens)
- **validators.js**: Input validation functions

## API Endpoints

| Method | Endpoint   | Description        | Protected |
| ------ | ---------- | ------------------ | --------- |
| GET    | /          | Home page          | No        |
| GET    | /register  | Registration form  | No        |
| POST   | /register  | Create new user    | No        |
| GET    | /verify    | Verify email token | No        |
| GET    | /login     | Login form         | No        |
| POST   | /login     | Authenticate user  | No        |
| GET    | /dashboard | User dashboard     | Yes       |
| GET    | /logout    | Logout user        | Yes       |

## Security Features

- Passwords hashed with PBKDF2 (100,000 iterations)
- Random salt generation per user
- Secure session management
- Email verification required before login
- Protected routes middleware

## Best Practices Implemented

✅ **Separation of Concerns**: Each module has a single responsibility  
✅ **DRY Principle**: Reusable utility functions  
✅ **Error Handling**: Proper try-catch blocks and error middleware  
✅ **Environment Variables**: Sensitive data in .env  
✅ **Code Documentation**: JSDoc comments for functions  
✅ **Async/Await**: Modern promise handling  
✅ **Promisified Database**: MySQL callbacks converted to promises

## License

ISC
