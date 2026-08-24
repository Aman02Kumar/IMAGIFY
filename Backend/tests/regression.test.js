import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.RAZORPAY_KEY_ID = 'test_razorpay_key';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';

function createSpy(fnImpl) {
  const spy = (...args) => {
    spy.calls.push(args);
    if (spy.customImpl) {
      return spy.customImpl(...args);
    }
    if (fnImpl) {
      return fnImpl(...args);
    }
  };
  spy.calls = [];
  spy.mockResolvedValue = (val) => {
    spy.customImpl = () => Promise.resolve(val);
    return spy;
  };
  spy.mockRejectedValue = (err) => {
    spy.customImpl = () => Promise.reject(err);
    return spy;
  };
  spy.mockImplementation = (impl) => {
    spy.customImpl = impl;
    return spy;
  };
  spy.mockReturnValue = (val) => {
    spy.customImpl = () => val;
    return spy;
  };
  return spy;
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    }
  };
  return res;
}

import razorpay from 'razorpay';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import UserModel from '../Models/User.js';
import TransactionModel from '../Models/TransactionModel.js';

const mockRazorpayOrdersCreate = createSpy();
const mockRazorpayOrdersFetch = createSpy();

try {
  if (razorpay && razorpay.prototype) {
    Object.defineProperty(razorpay.prototype, 'orders', {
      get() {
        return this._mockOrders || {
          create: mockRazorpayOrdersCreate,
          fetch: mockRazorpayOrdersFetch
        };
      },
      set(val) {
        this._mockOrders = val || {};
        this._mockOrders.create = mockRazorpayOrdersCreate;
        this._mockOrders.fetch = mockRazorpayOrdersFetch;
      },
      configurable: true
    });
  }
} catch (e) {}

import { signup, login, userCredits, paymentRazorpay, verifyRazorpay } from '../Controllers/AuthController.js';
import { generateImage } from '../Controllers/ImageController.js';
import userAuth from '../Middlewares/auth.js';

describe('Regression Tests', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test_jwt_secret';
    mockRazorpayOrdersCreate.calls = [];
    mockRazorpayOrdersFetch.calls = [];

    UserModel.findOne = createSpy();
    UserModel.findById = createSpy();
    UserModel.findByIdAndUpdate = createSpy();
    UserModel.prototype.save = createSpy().mockResolvedValue({
      _id: 'mock_user_id',
      name: 'User'
    });

    TransactionModel.create = createSpy();
    TransactionModel.findById = createSpy();
    TransactionModel.findByIdAndUpdate = createSpy();

    bcrypt.genSalt = createSpy().mockResolvedValue('salt');
    bcrypt.hash = createSpy().mockResolvedValue('hashed_password');
    bcrypt.compare = createSpy();

    jwt.sign = createSpy().mockReturnValue('mock_token');
    jwt.verify = createSpy();

    axios.post = createSpy();
  });

  describe('AuthController - signup', () => {
    it('should return error if required fields are missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = createMockRes();

      await signup(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Missing Details' });
    });

    it('should return error if email is already registered', async () => {
      const req = { body: { name: 'User', email: 'exist@example.com', password: 'password123' } };
      const res = createMockRes();
      UserModel.findOne.mockResolvedValue({ email: 'exist@example.com' });

      await signup(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Email already registered' });
    });

    it('should return error if JWT_SECRET is not defined', async () => {
      delete process.env.JWT_SECRET;
      const req = { body: { name: 'User', email: 'new@example.com', password: 'password123' } };
      const res = createMockRes();
      UserModel.findOne.mockResolvedValue(null);

      await signup(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'JWT_SECRET is not defined' });
    });

    it('should register new user successfully', async () => {
      const req = { body: { name: 'User', email: 'new@example.com', password: 'password123' } };
      const res = createMockRes();
      UserModel.findOne.mockResolvedValue(null);

      await signup(req, res);

      assert.strictEqual(bcrypt.hash.calls.length, 1);
      assert.strictEqual(res.statusCode, 201);
      assert.deepStrictEqual(res.body, {
        success: true,
        message: 'User registered successfully',
        token: 'mock_token',
        user: { name: 'User' }
      });
    });
  });

  describe('AuthController - login', () => {
    it('should return error if email or password missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = createMockRes();

      await login(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Missing Details' });
    });

    it('should return error if user does not exist', async () => {
      const req = { body: { email: 'notfound@example.com', password: 'pass' } };
      const res = createMockRes();
      UserModel.findOne.mockResolvedValue(null);

      await login(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'User does not exist' });
    });

    it('should return error if password does not match', async () => {
      const req = { body: { email: 'user@example.com', password: 'wrongpassword' } };
      const res = createMockRes();
      UserModel.findOne.mockResolvedValue({ email: 'user@example.com', password: 'hashed_pass' });
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Invalid Credentials' });
    });

    it('should login successfully with valid credentials', async () => {
      const req = { body: { email: 'user@example.com', password: 'correctpassword' } };
      const res = createMockRes();
      UserModel.findOne.mockResolvedValue({ _id: 'user_123', name: 'John', password: 'hashed_pass' });
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);
      assert.deepStrictEqual(res.body, {
        success: true,
        message: 'Login successful',
        token: 'mock_token',
        user: { name: 'John' }
      });
    });
  });

  describe('AuthController - userCredits', () => {
    it('should return credit balance and user name', async () => {
      const req = { body: { userId: 'user_123' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue({ creditBalance: 20, name: 'John' });

      await userCredits(req, res);
      assert.deepStrictEqual(res.body, {
        success: true,
        credits: 20,
        user: { name: 'John' }
      });
    });

    it('should return error if model call throws', async () => {
      const req = { body: { userId: 'user_123' } };
      const res = createMockRes();
      UserModel.findById.mockRejectedValue(new Error('Database connection failed'));

      await userCredits(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Database connection failed' });
    });
  });

  describe('AuthController - paymentRazorpay', () => {
    it('should return error if userId or planId missing', async () => {
      const req = { body: { userId: 'user_123' } };
      const res = createMockRes();

      await paymentRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Missing Details' });
    });

    it('should return error if user not found', async () => {
      const req = { body: { userId: 'user_123', planId: 'Basic' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue(null);

      await paymentRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'User not found' });
    });

    it('should return error for invalid planId', async () => {
      const req = { body: { userId: 'user_123', planId: 'SuperPlan' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue({ _id: 'user_123' });

      await paymentRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Plan not Found' });
    });

    it('should create order successfully for Basic plan', async () => {
      const req = { body: { userId: 'user_123', planId: 'Basic' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue({ _id: 'user_123' });
      TransactionModel.create.mockResolvedValue({ _id: 'trans_123' });
      mockRazorpayOrdersCreate.mockResolvedValue({ id: 'order_123', amount: 5000 });

      await paymentRazorpay(req, res);

      assert.strictEqual(TransactionModel.create.calls.length, 1);
      assert.strictEqual(TransactionModel.create.calls[0][0].userId, 'user_123');
      assert.strictEqual(TransactionModel.create.calls[0][0].plan, 'Basic');
      assert.strictEqual(TransactionModel.create.calls[0][0].amount, 50);
      assert.strictEqual(TransactionModel.create.calls[0][0].credits, 100);

      assert.deepStrictEqual(res.body, {
        success: true,
        order: { id: 'order_123', amount: 5000 }
      });
    });
  });

  describe('AuthController - verifyRazorpay', () => {
    it('should return error if razorpay_order_id is missing', async () => {
      const req = { body: {} };
      const res = createMockRes();

      await verifyRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Missing Razorpay order ID' });
    });

    it('should return error if payment status is not paid', async () => {
      const req = { body: { razorpay_order_id: 'order_123' } };
      const res = createMockRes();
      mockRazorpayOrdersFetch.mockResolvedValue({ status: 'created' });

      await verifyRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Payment Failed' });
    });

    it('should return error if transaction is not found', async () => {
      const req = { body: { razorpay_order_id: 'order_123' } };
      const res = createMockRes();
      mockRazorpayOrdersFetch.mockResolvedValue({ status: 'paid', receipt: 'trans_123' });
      TransactionModel.findById.mockResolvedValue(null);

      await verifyRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Transaction not found' });
    });

    it('should return error if transaction already processed', async () => {
      const req = { body: { razorpay_order_id: 'order_123' } };
      const res = createMockRes();
      mockRazorpayOrdersFetch.mockResolvedValue({ status: 'paid', receipt: 'trans_123' });
      TransactionModel.findById.mockResolvedValue({ _id: 'trans_123', payment: true });

      await verifyRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Payment already processed' });
    });

    it('should return error if user not found', async () => {
      const req = { body: { razorpay_order_id: 'order_123' } };
      const res = createMockRes();
      mockRazorpayOrdersFetch.mockResolvedValue({ status: 'paid', receipt: 'trans_123' });
      TransactionModel.findById.mockResolvedValue({ _id: 'trans_123', payment: false, userId: 'user_123', credits: 100 });
      UserModel.findById.mockResolvedValue(null);

      await verifyRazorpay(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'User not found' });
    });

    it('should add credits and update transaction when payment is valid', async () => {
      const req = { body: { razorpay_order_id: 'order_123' } };
      const res = createMockRes();
      mockRazorpayOrdersFetch.mockResolvedValue({ status: 'paid', receipt: 'trans_123' });
      TransactionModel.findById.mockResolvedValue({ _id: 'trans_123', payment: false, userId: 'user_123', credits: 100 });
      UserModel.findById.mockResolvedValue({ _id: 'user_123', creditBalance: 50 });

      await verifyRazorpay(req, res);

      assert.strictEqual(UserModel.findByIdAndUpdate.calls.length, 1);
      assert.deepStrictEqual(UserModel.findByIdAndUpdate.calls[0], ['user_123', { creditBalance: 150 }]);
      assert.strictEqual(TransactionModel.findByIdAndUpdate.calls.length, 1);
      assert.deepStrictEqual(TransactionModel.findByIdAndUpdate.calls[0], ['trans_123', { payment: true }]);
      assert.deepStrictEqual(res.body, { success: true, message: 'Credits Added' });
    });
  });

  describe('ImageController - generateImage', () => {
    it('should return error if user or prompt is missing', async () => {
      const req = { body: { userId: 'user_123' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue(null);

      await generateImage(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'Missing details' });
    });

    it('should return error if credit balance is zero or less', async () => {
      const req = { body: { userId: 'user_123', prompt: 'A cute cat' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue({ _id: 'user_123', creditBalance: 0 });

      await generateImage(req, res);
      assert.deepStrictEqual(res.body, { success: false, message: 'No credit Balance', creditBalance: 0 });
    });

    it('should generate image and deduct 1 credit successfully', async () => {
      const req = { body: { userId: 'user_123', prompt: 'A cute cat' } };
      const res = createMockRes();
      UserModel.findById.mockResolvedValue({ _id: 'user_123', creditBalance: 5 });
      axios.post.mockResolvedValue({ data: Buffer.from('fake_image') });

      await generateImage(req, res);

      assert.strictEqual(UserModel.findByIdAndUpdate.calls.length, 1);
      assert.deepStrictEqual(UserModel.findByIdAndUpdate.calls[0], ['user_123', { creditBalance: 4 }]);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Image generated');
      assert.strictEqual(res.body.creditBalance, 4);
      assert.match(res.body.resultImg, /^data:image\/png;base64,/);
    });
  });

  describe('Middleware - userAuth', () => {
    it('should return error if token header is missing', async () => {
      const req = { headers: {} };
      const res = createMockRes();
      const next = createSpy();

      await userAuth(req, res, next);
      assert.deepStrictEqual(res.body, { success: false, message: 'Not Authorized, Login again' });
      assert.strictEqual(next.calls.length, 0);
    });

    it('should return error if token fails verification', async () => {
      const req = { headers: { token: 'invalid_token' } };
      const res = createMockRes();
      const next = createSpy();
      jwt.verify.mockImplementation(() => { throw new Error('jwt expired'); });

      await userAuth(req, res, next);
      assert.deepStrictEqual(res.body, { success: false, message: 'jwt expired' });
      assert.strictEqual(next.calls.length, 0);
    });

    it('should return error if token decode lacks id', async () => {
      const req = { headers: { token: 'valid_token' } };
      const res = createMockRes();
      const next = createSpy();
      jwt.verify.mockReturnValue({});

      await userAuth(req, res, next);
      assert.deepStrictEqual(res.body, { success: false, message: 'Not Authorized, Login again' });
      assert.strictEqual(next.calls.length, 0);
    });

    it('should populate req.body.userId and call next for valid token', async () => {
      const req = { headers: { token: 'valid_token' }, body: {} };
      const res = createMockRes();
      const next = createSpy();
      jwt.verify.mockReturnValue({ id: 'user_123' });

      await userAuth(req, res, next);
      assert.strictEqual(req.body.userId, 'user_123');
      assert.strictEqual(next.calls.length, 1);
    });
  });
});