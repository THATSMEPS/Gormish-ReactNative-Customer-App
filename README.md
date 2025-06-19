# Vite + React + TypeScript Starter

This project is a React application bootstrapped with Vite and TypeScript. It includes Firebase integration for authentication and other services, along with various UI components and APIs for handling areas, cuisines, customers, orders, and restaurants.

## Prerequisites

- Node.js (v14 or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CustomerGormish
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

This project uses Firebase and requires the following environment variables to be set. Create a `.env` file in the root of the project with the following variables:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Replace the placeholder values with your actual Firebase project configuration values. You can find these in your Firebase project settings.

## Running the Project

To start the development server, run:

```bash
npm run dev
```

This will start the Vite development server and you can view the app at `http://localhost:5173` (or the port Vite specifies).

## Building the Project

To build the project for production, run:

```bash
npm run build
```

The build output will be in the `dist` folder.

To preview the production build locally, run:

```bash
npm run preview
```

## Project Structure Overview

- `src/` - Source code directory
  - `apis/` - API modules for areas, cuisines, customers, orders, restaurants
  - `components/` - React components for UI and features
  - `dummyData/` - Sample data for development/testing
  - `styles/` - CSS stylesheets
  - `types/` - TypeScript type definitions
  - `firebase.ts` - Firebase initialization and configuration
  - `main.tsx` - Application entry point
  - `App.tsx` - Main app component

- `public/` - Static assets like images

- Configuration files for Vite, TailwindCSS, ESLint, TypeScript, PostCSS, etc.

## Technologies Used

- React 18
- TypeScript
- Vite
- Firebase
- TailwindCSS
- Leaflet (for maps)
- Framer Motion (animations)
- ESLint

## License

This project is private and not licensed for public use.
