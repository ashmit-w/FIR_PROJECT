# FIR Management System Backend

A Node.js and Express backend application with MongoDB, Mongoose, and JWT-based authentication system for managing First Information Reports (FIRs) with role-based access control.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin, PS, SDPO)
- 🗄️ MongoDB with Mongoose ODM
- 🛡️ Password hashing with bcryptjs
- 📝 Comprehensive error handling
- 🚀 Express.js REST API

## Project Structure

```
fir-backend/
├── config/
│   └── db.js              # MongoDB connection configuration
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   └── authMiddleware.js  # JWT verification and role authorization
├── models/
│   └── User.model.js      # User Mongoose schema
├── routes/
│   └── authRoutes.js      # Authentication API routes
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
├── server.js              # Main application entry point
└── README.md              # This file
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy the `.env` file and update the values:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/fir_management
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the application:**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "username": "string",
    "password": "string",
    "role": "admin|ps|sdpo",
    "police_station": "string (required if role is 'ps')",
    "subdivision_stations": ["string"] (required if role is 'sdpo')
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

#### Get User Profile
- **GET** `/api/auth/profile` or `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

### Other Endpoints

#### Health Check
- **GET** `/api/health`

#### Root
- **GET** `/`

## User Roles

### Admin
- Full system access
- Can manage all users and FIRs

### PS (Police Station)
- Station-level access
- Requires `police_station` field
- Can manage FIRs for their station

### SDPO (Sub-Divisional Police Officer)
- Subdivision-level access
- Requires `subdivision_stations` array
- Can manage FIRs for multiple stations

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- Password hashing with bcryptjs (salt rounds: 12)
- JWT token expiration (configurable, default: 7 days)
- Role-based authorization middleware
- Input validation and sanitization
- Password exclusion from API responses

## Development

### Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (placeholder)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/fir_management` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |

## Testing the API

### Register a new user:
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123",
    "role": "admin"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

### Access protected route:
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer <your_jwt_token>"
```

## License

ISC
