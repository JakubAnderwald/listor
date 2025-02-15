# Listor - Modern Todo Application

A modern, responsive todo application built with React and Firebase, featuring real-time updates and Google authentication.

## Features

- 🔐 Firebase Authentication with Google Sign-in
- 📱 Responsive design that works on desktop and mobile
- 🔄 Real-time todo synchronization
- ✨ Modern UI with clean design
- ✅ Todo management (create, update, delete, mark as complete)
- 🎯 Filter todos by status (all, active, completed)

## Tech Stack

- React with TypeScript
- Firebase (Authentication & Realtime Database)
- Tailwind CSS
- shadcn/ui components
- Vite

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase project

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/listor.git
cd listor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Google Authentication
3. Create a Realtime Database
4. Add your app's domain to the authorized domains list
5. Copy your Firebase configuration to the environment variables

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
