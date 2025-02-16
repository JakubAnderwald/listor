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
   - Enable Realtime Database and set up the security rules (copy from `database.rules.json`)
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