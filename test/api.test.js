const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// ─── Test DB setup ────────────────────────────────────────────────────────────
beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/newsapi_test');
});

afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ }); // clean test users
    await mongoose.connection.close();
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe('POST /auth/register', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                email: 'user@test.com',
                password: 'password123',
                preferences: { categories: ['technology', 'sports'] }
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('user@test.com');
    });

    it('should fail with duplicate email', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ name: 'Test User', email: 'user@test.com', password: 'password123' });

        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ name: 'Test', email: 'not-an-email', password: 'password123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    it('should fail with short password', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ name: 'Test', email: 'new@test.com', password: '123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should fail with missing name', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'noname@test.com', password: 'password123' });

        expect(res.statusCode).toBe(400);
    });
});

describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    it('should fail with wrong password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'wrongpassword' });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'nobody@test.com', password: 'password123' });

        expect(res.statusCode).toBe(401);
    });

    it('should fail with missing password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com' });

        expect(res.statusCode).toBe(400);
    });
});

// ─── Protected route tests ────────────────────────────────────────────────────
describe('GET /auth/me', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        token = res.body.token;
    });

    it('should return user profile with valid token', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.email).toBe('user@test.com');
    });

    it('should fail without token', async () => {
        const res = await request(app).get('/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', 'Bearer invalidtoken123');
        expect(res.statusCode).toBe(401);
    });
});

// ─── Preferences tests ────────────────────────────────────────────────────────
describe('PUT /auth/preferences', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        token = res.body.token;
    });

    it('should update preferences successfully', async () => {
        const res = await request(app)
            .put('/auth/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ categories: ['sports', 'business'], language: 'en' });

        expect(res.statusCode).toBe(200);
        expect(res.body.preferences.categories).toContain('sports');
    });

    it('should reject invalid category', async () => {
        const res = await request(app)
            .put('/auth/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ categories: ['invalidcategory'] });

        expect(res.statusCode).toBe(400);
    });

    it('should reject empty categories', async () => {
        const res = await request(app)
            .put('/auth/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ categories: [] });

        expect(res.statusCode).toBe(400);
    });
});

// ─── News tests ───────────────────────────────────────────────────────────────
describe('GET /news', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        token = res.body.token;
    });

    it('should require authentication', async () => {
        const res = await request(app).get('/news');
        expect(res.statusCode).toBe(401);
    });

    it('should return news articles with valid token', async () => {
        const res = await request(app)
            .get('/news')
            .set('Authorization', `Bearer ${token}`);

        // 200 with articles, or 404 if API returns none, both are valid
        expect([200, 404, 429, 502, 503]).toContain(res.statusCode);
    });
});

describe('GET /news/search/:keyword', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        token = res.body.token;
    });

    it('should reject single character keyword', async () => {
        const res = await request(app)
            .get('/news/search/a')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
    });

    it('should accept valid keyword', async () => {
        const res = await request(app)
            .get('/news/search/bitcoin')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 404, 429, 502, 503]).toContain(res.statusCode);
    });
});

describe('POST /news/:id/read and /news/:id/favorite', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        token = res.body.token;
    });

    it('should mark article as read', async () => {
        const res = await request(app)
            .post('/news/article-001/read')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Article', url: 'https://example.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should mark article as favorite', async () => {
        const res = await request(app)
            .post('/news/article-001/favorite')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Test Article', url: 'https://example.com', description: 'A test' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should get read articles', async () => {
        const res = await request(app)
            .get('/news/read')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.articles)).toBe(true);
    });

    it('should get favorite articles', async () => {
        const res = await request(app)
            .get('/news/favorites')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.articles)).toBe(true);
    });
});