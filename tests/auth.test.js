import request from 'supertest';
import app from '../server.js'; // Assuming your Express app is exported from server.js
import connectDB from '../config/db.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Mock the database connection for tests
jest.mock('../config/db.js', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the User model to prevent actual database interactions
jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Ensure the mock connectDB is called
    connectDB();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  afterAll(async () => {
    // Disconnect mongoose if it was actually connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('POST /api/auth/register/customer', () => {
    it('should register a new customer successfully', async () => {
      User.findOne.mockResolvedValue(null); // User does not exist
      User.create.mockResolvedValue({
        _id: '60d5ec49f8c7d00015f8e1a1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        matchPassword: jest.fn().mockResolvedValue(true),
      });

      const res = await request(app)
        .post('/api/auth/register/customer')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phone: '1234567890',
          address: { houseNo: '1', city: 'TestCity', state: 'TestState', pinCode: '123456' },
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toEqual('test@example.com');
    });

    it('should return 400 if user already exists', async () => {
      User.findOne.mockResolvedValue(true); // User already exists

      const res = await request(app)
        .post('/api/auth/register/customer')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123',
          phone: '1234567890',
          address: { houseNo: '1', city: 'TestCity', state: 'TestState', pinCode: '123456' },
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user successfully', async () => {
      const mockUser = {
        _id: '60d5ec49f8c7d00015f8e1a2',
        name: 'Login User',
        email: 'login@example.com',
        role: 'customer',
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toEqual('login@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const mockUser = {
        _id: '60d5ec49f8c7d00015f8e1a3',
        name: 'Wrong Pass User',
        email: 'wrongpass@example.com',
        role: 'customer',
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(false), // Incorrect password
      };
      User.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid email or password');
    });
  });
});