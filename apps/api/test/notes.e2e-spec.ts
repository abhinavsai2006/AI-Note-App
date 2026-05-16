import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Notes API (e2e)', () => {
  let app: INestApplication<App>;
  let noteId: string;
  const mockToken = 'test-token';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  describe('GET /api/notes', () => {
    it('should return empty array or existing notes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/notes')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/notes', () => {
    it('should create a note when authenticated', async () => {
      const createNoteDto = {
        title: 'Test Note',
        content: '<p>Test content</p>',
        userEmail: 'test@example.com',
        userName: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .send(createNoteDto)
        .expect(200 || 201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Note');
      noteId = response.body.id;
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a note by ID', async () => {
      if (!noteId) {
        console.warn('Skipping test: Note not created in previous test');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/notes/${noteId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(noteId);
    });

    it('should return 404 for non-existent note', async () => {
      await request(app.getHttpServer())
        .get('/api/notes/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/notes/:id', () => {
    it('should update a note', async () => {
      if (!noteId) {
        console.warn('Skipping test: Note not created in previous test');
        return;
      }

      const updateNoteDto = {
        title: 'Updated Test Note',
        content: '<p>Updated test content</p>',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/notes/${noteId}`)
        .send(updateNoteDto)
        .expect(200);

      expect(response.body.title).toBe('Updated Test Note');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      if (!noteId) {
        console.warn('Skipping test: Note not created in previous test');
        return;
      }

      await request(app.getHttpServer())
        .delete(`/api/notes/${noteId}`)
        .expect(200);

      // Verify note is deleted
      await request(app.getHttpServer())
        .get(`/api/notes/${noteId}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for undefined routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/undefined-route')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body.statusCode).toBe(404);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
