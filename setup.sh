#!/bin/bash

# Setup script for e-commerce project seed data

echo "Setting up dependencies for e-commerce project seed data..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm and try again."
    exit 1
fi

# Create a package.json file if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "Creating package.json file..."
    echo '{
  "name": "ecommerce-seed",
  "version": "1.0.0",
  "description": "Seed script for e-commerce project",
  "main": "seed.js",
  "type": "module",
  "scripts": {
    "seed": "node seed.js"
  },
  "dependencies": {
    "firebase-admin": "^11.0.0"
  }
}' > package.json
    echo "package.json created!"
fi

# Install Firebase Admin SDK
echo "Installing Firebase Admin SDK..."
npm install firebase-admin@^11.0.0

# Check for serviceAccountKey.json
if [ ! -f "serviceAccountKey.json" ]; then
    echo "WARNING: serviceAccountKey.json not found in the current directory."
    echo "Please download your Firebase service account key from the Firebase Console:"
    echo "1. Go to https://console.firebase.google.com/"
    echo "2. Select your project"
    echo "3. Go to Project Settings > Service accounts"
    echo "4. Click 'Generate new private key'"
    echo "5. Save the JSON file in this directory as 'serviceAccountKey.json'"
    exit 1
fi

echo "Setup complete! You can now run the seed script with:"
echo "npm run seed" 