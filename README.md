# Listor - Smart Task Management

An intelligent, adaptive todo application that transforms task management into an engaging personal productivity experience.

## Features

- **Real-time Collaboration**: Share task lists with granular permissions (view/edit)
- **Smart Task Management**: Create, organize, and track tasks with subtasks
- **Recurring Tasks**: Automatic generation of daily, weekly, and monthly recurring tasks
- **Progressive Web App**: Offline support, installable, responsive design
- **Email Invitations**: Robust invitation system using Brevo email service
- **Firebase Integration**: Real-time database with secure authentication
- **Dark Mode Support**: Complete theming system with user preferences

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase Realtime Database + Cloud Functions
- **Styling**: Tailwind CSS + Radix UI components
- **Email**: Brevo API for invitation system
- **Authentication**: Firebase Auth with Google integration
- **PWA**: Service Worker + Web App Manifest

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Environment Variables

The application requires these environment variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key
```

## Project Structure

```
/
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── services/    # API and Firebase services
│   │   ├── hooks/       # Custom React hooks
│   │   └── types/       # TypeScript type definitions
│   └── public/      # Static assets and PWA files
├── functions/       # Firebase Cloud Functions
├── shared/          # Shared TypeScript types and schemas
├── firebase.json    # Firebase project configuration
└── package.json     # Root package configuration
```

## Deployment

This project is configured for Firebase Hosting with automatic deployment via GitHub Actions. The application is configured for the `listor.eu` domain.

## Key Components

- **Task Lists**: Create and manage multiple task lists
- **Tasks & Subtasks**: Hierarchical task organization
- **Real-time Sync**: Changes sync instantly across devices
- **Sharing**: Invite others via email with view/edit permissions
- **Recurring Tasks**: Automated task generation based on patterns
- **Offline Support**: Works without internet connection
- **PWA Features**: Installable as a native app

## Architecture

The application follows a modern full-stack architecture:

- **Client**: Single-page React application with PWA capabilities
- **Functions**: Serverless Firebase Cloud Functions for email invitations and recurring task generation
- **Database**: Firebase Realtime Database for real-time collaboration
- **Storage**: Firebase Storage for user avatars
- **Email**: Brevo service for reliable email delivery