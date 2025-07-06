# Angkor Compliance Login System

A modern, responsive login system built with React, Vite, and Supabase authentication.

## Features

- 🔐 Secure authentication with Supabase
- 📱 Responsive design with Tailwind CSS
- 👤 User registration and login
- 🎨 Modern UI with smooth animations
- 🔄 Real-time auth state management
- 📊 Dashboard with compliance metrics

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Deployment**: Netlify

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd angkor-compliance-login
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   
   The application is already configured with the provided Supabase credentials:
   - **URL**: `https://skqxzsrajcdmkbxembrs.supabase.co`
   - **Anon Key**: Already configured in the application

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Deployment

### Netlify Deployment (Recommended)

1. **Connect your repository to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Deploy**
   - Netlify will automatically build and deploy your site
   - The `netlify.toml` file is already configured for proper routing

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to your hosting provider

## Authentication Setup

The application uses Supabase for authentication. Make sure your Supabase project has:

1. **Email authentication enabled**
2. **User table configured** (optional, for additional user data)
3. **Proper email templates** for verification and password reset

## Environment Variables

For production deployment, you may want to use environment variables:

```bash
VITE_SUPABASE_URL=https://skqxzsrajcdmkbxembrs.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Sign In**: Login with existing credentials
3. **Dashboard**: View compliance metrics and recent activity
4. **Logout**: Securely sign out of the application

## Security Features

- 🔒 Secure password handling
- 🛡️ JWT token-based authentication
- 🔐 Session management
- 🚫 Protected routes
- 💾 Persistent sessions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. 