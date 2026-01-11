# Share-Wear

Share-Wear is a full-stack web application that connects donors with recipients through a donation and item-sharing platform. The platform facilitates the sharing of clothing and household items while enabling users to communicate, rate transactions, and manage their donations seamlessly.

## Overview

Share-Wear provides a comprehensive solution for sustainable consumption by allowing users to donate items they no longer need to community members who can benefit from them. The platform includes user authentication, donation management, real-time messaging, notification systems, and rating/review functionality.

## Features

- User Authentication and Authorization: Secure login and registration with role-based access (Donor/Recipient)
- Donation Listings: Create, edit, and manage donation items with descriptions and images
- Item Discovery: Browse available items and save favorites for later
- User Profiles: Manage personal information, view donation history, and track ratings
- Real-time Messaging: Direct communication between donors and recipients
- Notification System: Real-time alerts for donations, messages, and activities
- Pickup Scheduling: Schedule convenient pickup times and slots for donated items
- Rating and Reviews: Rate transactions and leave feedback for other users
- File Upload: Support for uploading item images and media
- Dashboard Views: Separate dashboards for donors and recipients with personalized information

## Technology Stack

### Frontend

- React.js: UI library for building interactive user interfaces
- Tailwind CSS: Utility-first CSS framework for styling
- PostCSS: Tool for transforming CSS with JavaScript plugins
- JavaScript (ES6+): Modern JavaScript for client-side logic

### Backend

- Node.js: JavaScript runtime for server-side development
- Express.js: Minimal web framework for building RESTful APIs
- MongoDB: NoSQL database for data storage
- JWT: JSON Web Tokens for authentication
- Nodemailer: Email service for notifications and password recovery
- Multer: Middleware for handling file uploads
- Bcrypt: Password hashing and encryption

## Project Structure

```
share-wear/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── context/                # React context for state management
│   │   ├── App.js                  # Main application component
│   │   ├── api.js                  # API client configuration
│   │   └── index.js                # Application entry point
│   ├── public/                     # Static assets
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS configuration
│   └── package.json                # Frontend dependencies
│
└── server/                          # Node.js/Express backend
    ├── models/                     # Database models
    │   ├── User.js
    │   ├── Donation.js
    │   ├── Conversation.js
    │   ├── Notification.js
    │   ├── PickupSlot.js
    │   └── Rating.js
    ├── routes/                     # API route handlers
    │   ├── userRoutes.js
    │   ├── donationRoutes.js
    │   ├── conversationRoutes.js
    │   ├── notificationRoutes.js
    │   ├── ratingRoutes.js
    │   ├── slotRoutes.js
    │   └── uploadRoutes.js
    ├── middleware/                 # Express middleware
    │   └── authMiddleware.js
    ├── utils/                      # Utility functions
    │   └── mailer.js
    ├── uploads/                    # Directory for uploaded files
    ├── server.js                   # Main server entry point
    ├── logger.js                   # Logging utility
    └── package.json                # Backend dependencies
```

## Installation and Setup

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn package manager
- MongoDB instance (local or cloud-based)

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env.local file with necessary environment variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file with the following environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

4. Start the server:
   ```
   node server.js
   ```

   The backend will run on `http://localhost:5000`

## API Endpoints

The application provides the following main API endpoints:

- **Users**: `/api/users` - User registration, login, profile management
- **Donations**: `/api/donations` - Create, read, update, delete donations
- **Conversations**: `/api/conversations` - Direct messaging between users
- **Notifications**: `/api/notifications` - User notifications and alerts
- **Ratings**: `/api/ratings` - Rate and review transactions
- **Pickup Slots**: `/api/slots` - Schedule item pickup times
- **Uploads**: `/api/uploads` - Handle file and image uploads

## Authentication

The application uses JWT (JSON Web Token) based authentication. Users must register and login to access protected routes. Authentication tokens are stored securely and sent with each request to validate user identity and permissions.

## Database Schema

The MongoDB database includes the following primary collections:

- Users: User profiles with authentication credentials and preferences
- Donations: Item listings with descriptions, images, and status
- Conversations: Message threads between donors and recipients
- Notifications: Activity alerts and updates for users
- PickupSlots: Available times for collecting donated items
- Ratings: User reviews and transaction feedback

## Development Workflow

1. Clone the repository:
   ```
   git clone https://github.com/cerdiqh/share-ware.git
   cd share-ware
   ```

2. Set up frontend and backend following the installation steps above

3. Make changes and test locally

4. Commit changes:
   ```
   git add .
   git commit -m "Descriptive commit message"
   ```

5. Push to main branch:
   ```
   git push origin main
   ```

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Create a feature branch for your changes
2. Make clear, descriptive commits
3. Test your changes thoroughly
4. Submit a pull request with a detailed description

## Future Enhancements

- Advanced search and filtering options
- Donation category tagging and organization
- User verification and trust badges
- Donation analytics and impact tracking
- Mobile application for iOS and Android
- Integration with social media sharing
- Donation tax deduction documentation
- Reward and loyalty program

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository or contact the development team.

## License

This project is open source and available under the MIT License.

## Author

Developed by the Share-Wear development team.

---

Last Updated: January 2026
