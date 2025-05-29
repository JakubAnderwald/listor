# Deployment Guide for Listor

## Step-by-Step GitHub Deployment

Follow these exact steps to deploy the current Listor application to your GitHub repository:

### 1. Clone Your Existing Repository
```bash
git clone https://github.com/JakubAnderwald/listor.git
cd listor
```

### 2. Remove All Existing Code
```bash
# Remove everything except .git directory
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +
```

### 3. Copy New Application Files
Copy all files from the `deployment-export` folder to your repository root:
```bash
# Copy all files from deployment-export to your repository
cp -r /path/to/deployment-export/* .
cp -r /path/to/deployment-export/.* . 2>/dev/null || true
```

### 4. Verify Firebase Configuration
Ensure your `firebase.json` matches your project settings:
- Check hosting configuration points to correct build directory
- Verify functions source directory is correct
- Confirm database rules are properly configured

### 5. Set Environment Variables
In your GitHub repository settings, add these secrets:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN` 
- `FIREBASE_DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `BREVO_API_KEY`

### 6. Commit and Push
```bash
git add .
git commit -m "Deploy complete Listor application with PWA features"
git push origin main
```

### 7. Monitor Deployment
- Check GitHub Actions tab for deployment progress
- Verify Firebase hosting deployment completes successfully
- Test the live application at your domain

## Features Included in This Deployment

✅ Complete React application with TypeScript
✅ Firebase Realtime Database integration
✅ Authentication with Google sign-in
✅ Progressive Web App features
✅ Offline functionality with service worker
✅ Task list sharing with email invitations
✅ Recurring task automation
✅ Responsive design with dark mode
✅ Error boundaries and loading states
✅ Performance monitoring and analytics

## Post-Deployment Checklist

- [ ] Application loads at production URL
- [ ] User authentication works correctly
- [ ] Task creation and management functions
- [ ] Email invitations send successfully
- [ ] PWA install prompt appears
- [ ] Offline functionality works
- [ ] Recurring tasks generate properly

The GitHub Action should automatically deploy to Firebase Hosting once you push the changes.