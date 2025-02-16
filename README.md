# 📝 Listor

A modern, responsive todo application with advanced task management capabilities, featuring comprehensive date-based views, real-time synchronization, and intelligent recurring task management.

## ✨ Features

- 🔄 **Real-time Synchronization**: Changes appear instantly across devices
- 📅 **Advanced Date Management**: 
  - Due date tracking
  - Today's tasks view
  - Next 7 days planning
  - Overdue task highlighting
- 🔁 **Smart Recurring Tasks**:
  - Daily, weekly, monthly, or yearly repetition
  - Automatic next occurrence creation
  - Original pattern preservation
- 🎯 **Task Organization**:
  - Filter by status (active/completed)
  - Date-based filtering
  - Multiple view options
- 🔒 **Secure Authentication**:
  - Google OAuth integration
  - Protected user data
  - Personal task lists
- 📱 **Responsive Design**:
  - Works on mobile, tablet, and desktop
  - Modern, clean interface
  - Intuitive interactions

## 🛠️ Tech Stack

- **Frontend**:
  - React with TypeScript
  - TanStack Query for data management
  - Tailwind CSS for styling
  - Shadcn UI components
  - Date-fns for date handling

- **Backend & Database**:
  - Firebase Realtime Database
  - Firebase Authentication

- **Development**:
  - Vite for fast development
  - TypeScript for type safety
  - Zod for schema validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/listor.git
cd listor
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

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
     2. Copy the contents of \`database.rules.json\`
     3. Save the rules
   - Create a web app:
     1. Go to Project Settings
     2. Add a web app
     3. Copy the Firebase configuration

4. Create a \`.env\` file:
\`\`\`env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_APP_ID=your-app-id
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

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
4. Click "Add Todo" or press Enter

#### Task Actions
- **Complete**: Click the checkbox
- **Edit**: Click the pencil icon
- **Delete**: Click the trash icon
- **Set Due Date**: Use the calendar icon
- **Set Recurrence**: Use the repeat icon

#### Filtering Tasks
Use the tabs to view:
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
\`\`\`
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
\`\`\`

### Key Files
- \`client/src/components/todo-item.tsx\`: Individual todo item component
- \`client/src/components/todo-list.tsx\`: List and filtering logic
- \`client/src/lib/firebase.ts\`: Firebase configuration and API
- \`shared/schema.ts\`: TypeScript types and Zod schemas

### Development Guidelines
1. Follow TypeScript best practices
2. Use existing UI components from shadcn
3. Maintain real-time sync functionality
4. Keep Firebase security rules updated
5. Test recurring task behavior thoroughly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.