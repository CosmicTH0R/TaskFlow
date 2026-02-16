import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// We test the auth routes directly
const prisma = new PrismaClient();

// Set up a minimal express app for testing
async function createTestApp() {
  const app = express();
  app.use(express.json());

  // Import routes dynamically
  const authRoutes = (await import('../routes/auth')).default;
  const boardRoutes = (await import('../routes/boards')).default;

  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);

  return app;
}

describe('Auth API', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test-' } },
    });
    await prisma.$disconnect();
  });

  const testEmail = `test-${Date.now()}@example.com`;

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, name: 'Test User', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject duplicate emails', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, name: 'Test User 2', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });

    it('should reject short passwords', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'another@test.com', name: 'Test', password: '123' });

      expect(res.status).toBe(400);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'another@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'password123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });
});

describe('Boards API', () => {
  let app: express.Express;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Login with demo user
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'password123' });

    token = res.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/boards', () => {
    it('should return paginated boards for authenticated user', async () => {
      const res = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.boards).toBeDefined();
      expect(Array.isArray(res.body.boards)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/boards');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/boards', () => {
    let createdBoardId: string;

    it('should create a new board', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Board', description: 'A test board', color: '#ec4899' });

      expect(res.status).toBe(201);
      expect(res.body.board.title).toBe('Test Board');
      expect(res.body.board.color).toBe('#ec4899');
      expect(res.body.board.members.length).toBe(1);
      createdBoardId = res.body.board.id;
    });

    it('should reject board without title', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
    });

    afterAll(async () => {
      if (createdBoardId) {
        await prisma.board.delete({ where: { id: createdBoardId } }).catch(() => {});
      }
    });
  });
});
