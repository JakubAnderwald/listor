git clone https://github.com/yourusername/listor.git
cd listor
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Google Authentication in the Authentication section
   - Enable Realtime Database
   - Set up the security rules by copying the contents of `database.rules.json`
   - Create a new web app in your Firebase project
   - Copy the Firebase configuration

4. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_APP_ID=your-app-id
```

5. Start the development server:
```bash
npm run dev
```

## Usage

### Authentication

1. Click the "Sign in with Google" button on the login page
2. Grant necessary permissions
3. You'll be redirected to the main application

### Creating Tasks

1. Enter your task in the input field
2. (Optional) Set a due date using the calendar picker
3. (Optional) Set a recurrence pattern (daily, weekly, monthly, yearly)
4. Click "Add Todo" or press Enter

### Managing Tasks

- **Complete a task**: Click the checkbox next to the task
- **Edit a task**: Click the pencil icon to modify text, due date, or recurrence
- **Delete a task**: Click the trash icon
- **Filter tasks**: Use the tabs to filter by:
  - All tasks
  - Active tasks
  - Completed tasks
  - Today's tasks
  - Next 7 days

### Recurring Tasks

When you create a recurring task:
1. Set a due date (required for recurring tasks)
2. Choose a recurrence pattern
3. When you complete the task, a new occurrence will automatically be created based on the pattern

## Development

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