# Saarathi Recorder

A mobile-first, SEO-friendly web application for field agents to browse customers, view details, and record audio interactions that can be revisited later.

## Features

- **Audio Recording**: High-quality audio recording with browser MediaRecorder API
- **Offline Support**: IndexedDB buffering for offline recording and upload
- **Long Sessions**: Auto-segmentation every 15 minutes with server-side stitching
- **Wake Lock**: Screen stays awake during recording sessions
- **Authentication**: Supabase Auth with Google provider
- **Admin Dashboard**: Browse and manage recordings across users
- **Mobile-First**: Optimized for mobile field agents

## Tech Stack

### Frontend
- React 19 with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Radix UI for components
- React Router for navigation
- Supabase for authentication and storage

### Backend
- Node.js with Express
- TypeScript
- Supabase for database and storage
- FFmpeg for audio processing
- JWT authentication

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- FFmpeg installed on the server

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project
2. Enable Google OAuth provider in Authentication settings
3. Create a storage bucket named `recordings`
4. Run the database schema:

```sql
-- Run the contents of backend/src/db/schema.sql
-- Then run the contents of backend/src/db/rls.sql
```

### 2. Environment Variables

Create `.env` files in both frontend and backend directories:

**Frontend (.env.local)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

**Backend (.env)**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 4. Run the Application

**Start the backend:**
```bash
cd backend
npm run dev
```

**Start the frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
saarathi_recorder/
├── frontend/
│   ├── src/
│   │   ├── app/routes/          # Page components
│   │   ├── features/            # Feature-based modules
│   │   │   ├── customers/       # Customer management
│   │   │   ├── recordings/      # Recording functionality
│   │   │   └── offline/         # Offline support
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API and external services
│   │   └── store/               # Redux store
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── api/                 # API routes
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Express middleware
│   │   └── db/                  # Database schema
│   └── package.json
└── instructions/                # Product requirements
```

## Key Features Implementation

### Audio Recording
- Uses MediaRecorder API with browser-specific MIME types
- Supports WebM/Opus (Chrome/Firefox) and MP4/AAC (Safari)
- Automatic codec detection and consistent session MIME usage

### Offline Support
- IndexedDB queue for offline recording storage
- Automatic retry on network reconnection
- Background sync with exponential backoff

### Long Recording Sessions
- 15-minute auto-segmentation
- Server-side stitching with FFmpeg
- Canonical output format (MP4/AAC) for cross-browser compatibility

### Wake Lock
- Screen Wake Lock API integration
- Automatic re-acquisition on visibility change
- Graceful fallback when not supported

## API Endpoints

### Customers
- `GET /api/customers` - List customers with pagination
- `GET /api/customers/:id` - Get customer details

### Recordings
- `POST /api/recordings` - Create recording session
- `POST /api/recordings/:id/segments` - Upload segment
- `POST /api/recordings/:id/finalize` - Finalize and stitch
- `GET /api/recordings` - List recordings with filters
- `GET /api/recordings/:id` - Get recording details

### Admin
- `GET /api/admin/recordings` - List all recordings
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Dashboard statistics

## Security

- JWT authentication with Supabase
- Row Level Security (RLS) policies
- User-specific data access
- Admin role-based permissions
- Signed URLs for file access

## Browser Compatibility

- Chrome/Edge: WebM/Opus recording
- Firefox: WebM/Opus recording  
- Safari/iOS: MP4/AAC recording
- All browsers: MP4/AAC playback

## Development

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend build
cd backend
npm run build
```

## Deployment

1. Build both frontend and backend
2. Deploy backend to your server (ensure FFmpeg is installed)
3. Deploy frontend to a CDN or static hosting
4. Update environment variables for production
5. Configure Supabase for production domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.


