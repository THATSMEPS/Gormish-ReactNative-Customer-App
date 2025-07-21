
# GormishCustomerApp

GormishCustomerApp is a cross-platform mobile application built with [Expo](https://expo.dev) and React Native. It serves as the customer-facing app for the Gormish platform, providing seamless order management, notifications, and location-based features. The app is designed to run on Android, iOS, and the web.

## Features

- **Push Notifications**: Uses Expo Notifications to deliver real-time updates to customers. Push tokens are securely generated and sent to the backend.
- **Location Permissions**: Requests and manages location access for enhanced user experience.
- **WebView Integration**: Loads the Gormish customer portal via WebView for a unified experience.
- **Custom UI Components**: Includes reusable components for theming, collapsible views, haptic feedback, and more.
- **File-based Routing**: Utilizes Expo Router for scalable navigation.
- **Splash Screen & Branding**: Custom splash screen and icons for a professional look.

## Project Structure

```
GormishCustomerApp/
├── app/                # Main app entry and routing
│   ├── index.js        # App logic, push notification, location, WebView
│   └── _layout.js      # Router layout
├── assets/
│   ├── fonts/          # Custom fonts
│   └── images/         # App icons, splash, logos
├── components/
│   ├── ui/             # Platform-specific UI components
│   └── ...             # Reusable components
├── constants/          # App-wide constants (e.g., Colors)
├── hooks/              # Custom React hooks
├── scripts/            # Utility scripts (e.g., reset-project.js)
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript config
├── eas.json            # EAS build config
├── google-services.json# Android Firebase config
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/preordrapp/GormishCustomerApp.git
   cd GormishCustomerApp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the development server:
```bash
npx expo start
```
You can then run the app on:
- Android emulator
- iOS simulator
- Physical device (via Expo Go)
- Web browser

### Resetting the Project
To reset to a blank app structure:
```bash
npm run reset-project
```
This moves starter code to `app-example` and creates a blank `app` directory.

## Configuration & Environment

- **Expo Config**: See `app.json` for app name, icons, splash, notification, and platform settings.
- **Push Notifications**: Uses Expo's notification API. Tokens are sent to the backend at `https://gormishbackend-4jlj.onrender.com/api/notifications/customers/storeToken`.
- **Location**: Requests foreground location permission on startup.
- **Android**: Uses `google-services.json` for Firebase integration.

## Main App Logic

- `app/index.js` handles:
  - Push notification setup and token management
  - Location permission requests
  - WebView loading of the customer portal
  - Notification listeners and forwarding to WebView

## Custom Components

- `components/Collapsible.tsx`: Expand/collapse UI sections
- `components/HelloWave.tsx`: Animated greeting
- `components/HapticTab.tsx`: Haptic feedback for tabs
- `components/ParallaxScrollView.tsx`: Parallax scrolling views
- `components/ThemedText.tsx`, `ThemedView.tsx`: Themed UI elements
- `components/ExternalLink.tsx`: External link handling
- `components/ui/`: Platform-specific icons and tab backgrounds

## Hooks & Constants

- `hooks/useColorScheme.ts`, `useThemeColor.ts`: Theme and color management
- `constants/Colors.ts`: Centralized color palette

## Fonts & Images

- Custom font: `assets/fonts/SpaceMono-Regular.ttf`
- Branding images: `assets/images/GormishLogo.png`, icons, splash, etc.

## Scripts

- `scripts/reset-project.js`: Utility to reset app structure

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes
4. Push and open a pull request

## Support & Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Gormish Backend](https://gormishbackend-4jlj.onrender.com/)

## License

This project is licensed under the MIT License.
