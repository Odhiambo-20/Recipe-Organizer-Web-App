# Recipe Organizer

An interactive web application that allows users to store, organize, and filter recipes. Built as part of a web development assignment.

## Features

- Add, edit, and delete recipes
- Filter recipes by category or ingredient
- Mark favorite recipes
- Persistent storage with Firebase
- Biometric authentication
- AI-powered recipe assistant chatbot
- Responsive design for all devices
- Accessibility compliant

## Live Demo

Visit the live application: [Recipe Organizer](https://yourusername.github.io/recipe-organizer/)

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- Firebase (Firestore)
- Web Authentication API for biometrics
- GitHub Actions for CI/CD

## Setup Instructions

### Prerequisites

- Node.js (for local development and linting)
- GitHub account (for deployment)
- Firebase account (for data storage)

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/recipe-organizer.git
   cd recipe-organizer
   ```

2. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Add a web app to your project
   - Copy the Firebase configuration

3. Update the Firebase configuration:
   - Open `script.js`
   - Replace the `firebaseConfig` object with your own configuration

4. Open the application:
   - Open `index.html` in your browser

### Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch, thanks to the GitHub Actions workflow.

## Usage Guide

1. **Authentication**: Click the "Biometric Login" button to authenticate using your device's biometric capabilities (fingerprint or face recognition).

2. **Adding Recipes**: Fill out the form with recipe details (name, category, ingredients, instructions, preparation time) and click "Add Recipe".

3. **Managing Recipes**: 
   - Use the "Edit" button on a recipe card to modify its details
   - Use the "Delete" button to remove a recipe

4. **Filtering Recipes**:
   - Select a category from the dropdown menu to filter by meal type
   - Enter an ingredient in the search box to find recipes containing that ingredient
   - Click "Clear Filters" to reset

5. **Recipe Assistant**: Click the "Chat Assistant" button to get help with recipes or using the application.

## Accessibility

This application follows Web Content Accessibility Guidelines (WCAG) to ensure it's usable by everyone:

- Semantic HTML structure
- Keyboard navigable interface
- Sufficient color contrast
- Descriptive labels and ARIA attributes where needed
- Responsive design for all screen sizes

## License

This project is created for educational purposes and is subject to the terms specified in the assignment.