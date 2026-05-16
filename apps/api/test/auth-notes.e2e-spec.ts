import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { NotesModule } from '../src/notes/notes.module';
import { PrismaService } from '../src/prisma/prisma.service';

const mockUser = { id: 'u1', name: 'Test User', email: 'test@example.com', avatarUrl: null, passwordHash: 'hashed' };
const mockNote = { id: 'n1', title: 'Hello', content: 'World', isArchived: false, isPublic: false, shareId: 's1', userId: mockUser.id, createdAt: new Date(), updatedAt: new Date() };

describe('Auth + Notes (e2e) - mocked Prisma', () => {
  let app: INestApplication;

  const mockPrisma = {
    user: {
      create: jest.fn().mockImplementation(({ data }) => ({ ...mockUser, ...data })),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where?.email === mockUser.email) return mockUser;
        if (where?.id === mockUser.id) return mockUser;
        return null;
      }),
    },
    note: {
      create: jest.fn().mockImplementation(({ data }) => ({ ...mockNote, ...data })),
      findMany: jest.fn().mockImplementation(({ where }) => [mockNote]),
      findUnique: jest.fn().mockImplementation(({ where }) => (where?.id === mockNote.id ? mockNote : null)),
      update: jest.fn().mockImplementation(({ where, data }) => ({ ...mockNote, ...data })),
      delete: jest.fn().mockImplementation(({ where }) => mockNote),
    },
  } as any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule, NotesModule] })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/signup -> /auth/login -> /notes (create protected)', async () => {
    const signupRes = await request(app.getHttpServer()).post('/auth/signup').send({ name: 'Test User', email: mockUser.email, password: 'password' }).expect(201);
    expect(signupRes.body).toHaveProperty('token');

    const token = signupRes.body.token;

    // create note (protected)
    const createRes = await request(app.getHttpServer())
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hello', content: 'World' })
      .expect(201);

    expect(createRes.body).toMatchObject({ title: 'Hello', content: 'World' });

    // list notes
    const listRes = await request(app.getHttpServer()).get(`/notes?email=${mockUser.email}`).expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
  });
});
