# News Aggregator API

A Node.js/Express API with user authentication using bcrypt and JWT.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running on your system
3. Create a `.env` file with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/news-aggregator
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### Register User
- **POST** `/register`
- **Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login User
- **POST** `/login`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get User Preferences (Protected)
- **GET** `/preferences`
- **Headers:** `Authorization: Bearer <token>`

### Update User Preferences (Protected)
- **PUT** `/preferences`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "categories": ["technology", "business"],
  "languages": ["en", "es"],
  "sources": ["bbc-news", "cnn"],
  "maxArticles": 20
}
```

### Health Check
- **GET** `/health`

## Testing Examples

### Using curl

#### Register a new user:
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get Preferences (replace TOKEN with your JWT token):
```bash
curl -X GET http://localhost:3000/preferences \
  -H "Authorization: Bearer TOKEN"
```

#### Update Preferences (replace TOKEN with your JWT token):
```bash
curl -X PUT http://localhost:3000/preferences \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["technology", "business"],
    "languages": ["en", "es"],
    "sources": ["bbc-news", "cnn"],
    "maxArticles": 20
  }'
```

### Using Postman

#### Register:
1. Method: POST
2. URL: `http://localhost:3000/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### Login:
1. Method: POST
2. URL: `http://localhost:3000/login`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Get Preferences:
1. Method: GET
2. URL: `http://localhost:3000/preferences`
3. Headers: 
   - `Content-Type: application/json`
   - `Authorization: Bearer <your-jwt-token>`

#### Update Preferences:
1. Method: PUT
2. URL: `http://localhost:3000/preferences`
3. Headers: 
   - `Content-Type: application/json`
   - `Authorization: Bearer <your-jwt-token>`
4. Body (raw JSON):
```json
{
  "categories": ["technology", "business"],
  "languages": ["en", "es"],
  "sources": ["bbc-news", "cnn"],
  "maxArticles": 20
}
```

## Features

- User registration with bcrypt password hashing
- User login with password verification
- JWT token generation on successful login
- JWT authentication middleware for protected routes
- User preferences management (categories, languages, sources, maxArticles)
- Input validation and error handling
- MongoDB integration with Mongoose
- Environment variable configuration

## Available Categories
- technology, sports, business, entertainment, health, science, politics, world

## Available Languages
- en, es, fr, de, it, pt, ru, ja, zh, ar
