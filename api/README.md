# Nuudle API Service

## Node.js Version Requirement

This API service requires Node.js v20.11.1 (LTS) for compatibility with MongoDB Atlas. The current Node.js v22.16.0 has known SSL/TLS compatibility issues with MongoDB Atlas.

## Setup Instructions

### 1. Install Node Version Manager (nvm)

If you don't have nvm installed, install it first:

```bash
# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.zshrc
```

### 2. Switch to the Required Node.js Version

```bash
# Navigate to the api directory
cd api

# Install and use the required Node.js version
nvm install 20.11.1
nvm use 20.11.1

# Verify the version
node --version
# Should output: v20.11.1
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm start
```

## Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```
MONGODB_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
PORT=3001
```

## Troubleshooting

If you encounter SSL/TLS errors with MongoDB Atlas:

1. Ensure you're using Node.js v20.11.1 (check with `node --version`)
2. If using a different version, switch using `nvm use 20.11.1`
3. Restart the development server after switching versions

## Development

The server will automatically restart when you make changes to the code thanks to nodemon.