import request from 'supertest';
import { app, server } from '../src/server.js';
import { getDatabase } from '../src/lib/db.client.js';

let db;

beforeAll(async () => {
  db = getDatabase();
  await db.query('DELETE FROM answers');
  await db.query('DELETE FROM questions');
  await db.query('DELETE FROM categories');
});

afterAll(async () => {
  if (server) {
    server.close(() => console.log('Server closed'));
  }

  if (db) {
    console.log('Closing database connection...');
    await db.close();
  }
});

describe('🚀 Express Routes', () => {
  test('GET / should return status 200', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  test('GET /form should return status 200', async () => {
    const response = await request(app).get('/form');
    expect(response.status).toBe(200);
  });

  test('GET /nonexistent should return status 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
  });
});
