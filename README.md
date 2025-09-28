# FIR Management System

A comprehensive First Information Report (FIR) management system with disposal tracking, performance reporting, and analytics for police stations.

## 🚀 Features

### Core Functionality
- **FIR Management**: Complete CRUD operations for FIR records
- **Disposal Tracking**: Track FIR disposal status (Registered, Chargesheeted, Finalized)
- **Performance Reporting**: Real-time performance metrics and analytics
- **PDF Generator**: Comprehensive report generation with filtering options

### Authentication & Authorization
- **Role-based Access Control**: Admin, Police Station (PS), and Sub-Divisional Police Officer (SDPO) roles
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Role-specific access to different features

### Police Station Management
- **Hierarchical Structure**: Complete police station hierarchy with districts, subdivisions, and stations
- **Cascading Dropdowns**: Dynamic dropdown selection for police stations
- **Special Units**: Support for specialized units (ANC, Cyber Crime, Women Safety, Coastal Security)

### Performance Analytics
- **Urgency Categories**: 
  - 🟢 Green: >15 days remaining
  - 🟡 Yellow: ≤15 days remaining
  - 🟠 Orange: ≤10 days remaining
  - 🔴 Red: ≤5 days remaining
  - 🔴 Red+: Overdue cases
- **Performance Metrics**: Calculate performance percentages for each police station
- **Real-time Updates**: Live performance tracking and reporting

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Date-fns** for date manipulation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **CORS** for cross-origin requests
- **MongoDB Atlas** for cloud database

### Database Models
- **User**: Authentication and role management
- **FIR**: First Information Report records
- **PoliceStation**: Police station hierarchy and metadata

## 📁 Project Structure

```
FIR_PROJECT/
├── backend/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # API controllers
│   ├── middleware/         # Authentication middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── storage/           # File storage utilities
│   └── server.js          # Main server file
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API services
│   │   ├── constants/    # Application constants
│   │   └── lib/          # Utility functions
│   └── public/           # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FIR_PROJECT.git
   cd FIR_PROJECT
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   - Create a `.env` file in the backend directory
   - Add your MongoDB Atlas connection string:
     ```
     MONGO_URI=your_mongodb_atlas_connection_string
     JWT_SECRET=your_jwt_secret_key
     ```

5. **Start the development servers**
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm start
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000 (or 3001)
   - Backend API: http://localhost:5001

## 🔐 Default Credentials

### Admin User
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Full access to all features

### Police Station User
- **Username**: `ps_panaji`
- **Password**: `ps123`
- **Role**: Limited to assigned police station

### SDPO User
- **Username**: `sdpo_north`
- **Password**: `sdpo123`
- **Role**: Access to performance reports

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### FIR Management
- `GET /api/firs` - Get all FIRs (role-based filtering)
- `POST /api/firs` - Create new FIR
- `PUT /api/firs/:id` - Update FIR
- `DELETE /api/firs/:id` - Delete FIR
- `PATCH /api/firs/:id/disposal` - Update disposal status

### Performance Reporting
- `GET /api/performance-report` - Get performance metrics
- `GET /api/reports/pdf-data` - Get PDF report data
- `POST /api/reports/generate-pdf` - Generate PDF report

## 🎯 Key Features Explained

### FIR Disposal Tracking
- **90-day Rule**: Automatic calculation of disposal due dates
- **Status Updates**: Track progress from Registered → Chargesheeted → Finalized
- **Urgency Alerts**: Color-coded urgency levels based on remaining days

### Police Station Hierarchy
- **Districts**: North District, South District
- **Subdivisions**: Panaji, Mapusa, Margao, etc.
- **Stations**: Individual police stations within subdivisions
- **Special Units**: ANC, Cyber Crime, Women Safety, Coastal Security

### Performance Metrics
- **Performance Percentage**: `(Chargesheeted FIRs within Due Date / Total Registered Cases) × 100`
- **Urgency Distribution**: Count of cases in each urgency category
- **Station-wise Analytics**: Individual performance tracking

## 🔧 Configuration

### Database Configuration
The system uses MongoDB Atlas for cloud database storage. Update the connection string in your environment variables.

### Police Station Data
Police station hierarchy is defined in `frontend/src/constants/policeStations.ts`. You can modify this file to add or update police stations.

### Authentication
JWT tokens are used for authentication. Configure the secret key in your environment variables.

## 📱 Responsive Design
The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🚀 Deployment

### Backend Deployment
1. Deploy to platforms like Heroku, Railway, or DigitalOcean
2. Set environment variables for production
3. Ensure MongoDB Atlas connection is configured

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages
3. Update API endpoints for production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- [ ] Email notifications for overdue cases
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with external systems
- [ ] Automated report scheduling
- [ ] Multi-language support

---

**Built with ❤️ for efficient police station management**
