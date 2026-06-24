const request = require('supertest');
const app = require('../src/app');

// Mock all required Mongoose models
jest.mock('../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../src/models/Wagon', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const User = require('../src/models/User');
const Wagon = require('../src/models/Wagon');

// We also need to mock the DB connection to avoid trying to actually connect
jest.mock('../src/config/db', () => jest.fn().mockResolvedValue(true));

jest.mock('../src/models/RefreshToken', () => ({
  create: jest.fn().mockResolvedValue(true),
}));

// Mock authService token verification to bypass JWT real check
const authService = require('../src/services/authService');
jest.mock('../src/services/authService', () => ({
  ...jest.requireActual('../src/services/authService'),
  verifyRefreshToken: jest.fn(),
}));

describe('Backend API Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health check', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Wagon Whisper API is running');
    });

    it('should return api/v1/health check', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBeDefined();
    });
  });

  describe('Auth Flow', () => {
    it('should login a user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role }; }
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      authService.verifyRefreshToken.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@test.com');
    });

    it('should reject invalid login', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('Wagon Flow', () => {
    const validToken = authService.generateAccessToken('user123');

    it('should create a wagon successfully', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', role: 'admin', isActive: true })
      });

      Wagon.findOne.mockResolvedValue(null);
      Wagon.create.mockResolvedValue({
        _id: 'wagon123',
        wagonNo: '12345678901',
        type: 'BTPGLN',
        owner: 'Western Railway',
        status: 'In Service'
      });

      const res = await request(app)
        .post('/api/v1/wagons')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          wagonNo: '12345678901',
          type: 'BTPGLN',
          owner: 'Western Railway',
          category: 'Tank Wagon'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wagonNo).toBe('12345678901');
    });

    it('should fetch paginated wagons', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', role: 'admin', isActive: true })
      });

      Wagon.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 'wagon1', wagonNo: '12345678901' },
          { _id: 'wagon2', wagonNo: '12345678902' }
        ])
      });
      Wagon.countDocuments.mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/wagons')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });
});
