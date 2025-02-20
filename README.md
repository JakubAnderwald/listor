2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Google Authentication:
     1. Go to Authentication > Sign-in method
     2. Enable Google sign-in
     3. Configure OAuth consent screen
     4. Add authorized domains
   - Enable Realtime Database:
     1. Create a new Realtime Database
     2. Start in test mode
     3. Copy the database URL
   - Set up security rules:
     1. Go to Realtime Database > Rules
     2. Copy the contents of `database.rules.json`
     3. Save the rules
   - Create a web app:
     1. Go to Project Settings
     2. Add a web app
     3. Copy the Firebase configuration

4. Create a `.env` file:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_APP_ID=your-app-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
```

5. Start the development server:
```bash
npm run dev
```

## 📖 Usage

### Authentication

1. Click "Sign in with Google" on the login page
2. Grant necessary permissions
3. You'll be redirected to the main application

### Managing Tasks

#### Creating Tasks
1. Enter task description in the input field
2. (Optional) Set a due date using the calendar picker
3. (Optional) Choose a recurrence pattern:
   - Daily
   - Weekly
   - Monthly
   - Yearly
4. (Optional) Set priority level:
   - High
   - Medium
   - Low
5. Click "Add Todo" or press Enter

New tasks are automatically added to:
- Currently selected list
- Inbox when using filters (Today, Next 7 Days, etc.)

#### Task Actions
- **Complete**: Click the checkbox
- **Edit**: Click the pencil icon
- **Delete**: Click the trash icon
- **Set Due Date**: Use the calendar icon
- **Set Recurrence**: Use the repeat icon
- **Set Priority**: Use the flag icon

#### Lists and Filters
The sidebar provides a unified view of:
- Smart filters (Today, Next 7 Days, etc.)
- Custom lists
Tasks can be filtered by:
- All tasks
- Active tasks
- Completed tasks
- Today's tasks
- Next 7 days

### Recurring Tasks

When creating a recurring task:
1. Set a due date (required for recurring tasks)
2. Choose a recurrence pattern
3. When completed, a new occurrence is automatically created

The system maintains the original pattern while creating new occurrences, ensuring consistent task management.

## 👩‍💻 Development

### Project Structure
```
listor/
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
├── shared/           # Shared types and schemas
└── database.rules.json  # Firebase security rules
```

## 📦 Deployment

### Firebase Hosting Setup

1. Install Firebase CLI globally (if not already installed):
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Configure environment variables for production:
```bash
# Create a .env.production file with your production values
firebase functions:config:set emailjs.public_key="your_emailjs_public_key"
firebase functions:config:set emailjs.service_id="your_emailjs_service_id"
```

4. Deploy the application:
```bash
npm run build
firebase deploy
```

### Environment Variables

The following environment variables are required:

Development (`.env`):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_APP_ID=your-app-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
```

Production (Firebase):
Make sure to set these using Firebase CLI:
```bash
firebase functions:config:set emailjs.public_key="your_value"
firebase functions:config:set emailjs.service_id="your_value"