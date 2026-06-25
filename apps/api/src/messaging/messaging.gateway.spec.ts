import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MessagingGateway', () => {
  let module: TestingModule;
  let gateway: MessagingGateway;
  let jwtService: JwtService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          }),
        }),
      ],
      providers: [
        MessagingGateway,
        MessagingService,
        PrismaService,
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should reject client with no token', () => {
    const client = {
      id: 'test-socket-1',
      handshake: {
        auth: {},
        query: {},
        headers: {},
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
    } as any;

    gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('error', { message: 'Authentication required' });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('should reject client with invalid token', () => {
    const client = {
      id: 'test-socket-2',
      handshake: {
        auth: { token: 'this-is-not-a-valid-jwt' },
        query: {},
        headers: {},
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
    } as any;

    gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('error', { message: 'Invalid or expired token' });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('should accept client with valid token from handshake auth', () => {
    const token = jwtService.sign(
      { sub: 'test-user-id', email: 'test@test.com', role: 'USER' },
    );

    const client = {
      id: 'test-socket-3',
      handshake: {
        auth: { token },
        query: {},
        headers: {},
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
    } as any;

    gateway.handleConnection(client);

    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('user:test-user-id');
    expect((client as any).user.sub).toBe('test-user-id');
  });

  it('should accept client with valid token from query param', () => {
    const token = jwtService.sign(
      { sub: 'test-user-2', email: 'test2@test.com', role: 'AGENCY' },
    );

    const client = {
      id: 'test-socket-4',
      handshake: {
        auth: {},
        query: { token },
        headers: {},
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
    } as any;

    gateway.handleConnection(client);

    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('user:test-user-2');
  });

  it('should accept client with Bearer token in Authorization header', () => {
    const token = jwtService.sign(
      { sub: 'test-user-3', email: 'test3@test.com', role: 'AGENCY' },
    );

    const client = {
      id: 'test-socket-5',
      handshake: {
        auth: {},
        query: {},
        headers: { authorization: `Bearer ${token}` },
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
    } as any;

    gateway.handleConnection(client);

    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('user:test-user-3');
  });
});