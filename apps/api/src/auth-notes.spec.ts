import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { PrismaService } from './prisma/prisma.service';

const mockUser = { id: 'u1', name: 'Test User', email: 'test@example.com', avatarUrl: null, passwordHash: 'hashed' };
const mockNote = { id: 'n1', title: 'Hello', content: 'World', isArchived: false, isPublic: false, shareId: 's1', userId: mockUser.id, createdAt: new Date(), updatedAt: new Date() };

describe('Auth + Notes (e2e) - mocked Prisma', () => {
  let app: INestApplication;

  const mockPrisma = (() => {
    const users: Record<string, any> = {};
    return {
      user: {
        create: jest.fn().mockImplementation(({ data }) => {
          const u = { ...mockUser, ...data };
          users[u.email] = u;
          return u;
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where?.email) return users[where.email] ?? null;
          if (where?.id) return Object.values(users).find((u: any) => u.id === where.id) ?? null;
          return null;
        }),
        upsert: jest.fn().mockImplementation(async ({ where, update, create }) => {
          const existing = users[where.email];
          if (existing) {
            const updated = { ...existing, ...update };
            users[where.email] = updated;
            return updated;
          }
          const u = { ...mockUser, ...create };
          users[u.email] = u;
          return u;
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
  })();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule, NotesModule] })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
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
