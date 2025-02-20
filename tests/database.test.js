import { getDatabase } from '../src/lib/db.client.js';

let db;

beforeAll(async () => {
  db = getDatabase();
  await db.query('DELETE FROM answers');
  await db.query('DELETE FROM questions');
  await db.query('DELETE FROM categories');
});

afterAll(async () => {
  if (db) {
    console.log('Closing database connection...');
    await db.close();
  }
});

describe('Database Tests', () => {
  test('Should insert a category and verify it exists', async () => {
    const categoryName = 'Test Category';

    const categoryResult = await db.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [categoryName]
    );

    if (!categoryResult.rows.length) {
      const existingCategory = await db.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
      categoryResult.rows[0] = existingCategory.rows[0];
    }

    expect(categoryResult.rows.length).toBe(1);
    expect(categoryResult.rows[0].id).toBeDefined();
  });

  test('Should insert a question and verify it exists', async () => {
    const categoryName = 'Test Category for Question';
    const questionText = 'What is 2 + 2?';

    const categoryResult = await db.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [categoryName]
    );

    if (!categoryResult.rows.length) {
      const existingCategory = await db.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
      categoryResult.rows[0] = existingCategory.rows[0];
    }

    const categoryId = categoryResult.rows[0].id;

    const questionResult = await db.query(
      'INSERT INTO questions (category_id, question) VALUES ($1, $2) RETURNING id',
      [categoryId, questionText]
    );

    expect(questionResult.rows.length).toBe(1);
    expect(questionResult.rows[0].id).toBeDefined();
  });


  test('Should fail to insert a category with a short name', async () => {
    const shortCategory = 'ab';

    // Run query and check if row got inserted
    await db.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [shortCategory]);

    // Now check if it exists in the database
    const checkResult = await db.query('SELECT * FROM categories WHERE name = $1', [shortCategory]);

    expect(checkResult.rows.length).toBe(0);
  });

  test('Should fail to insert a question with fewer than 5 characters', async () => {
    const categoryName = 'Test Category for Invalid Question';
    const invalidQuestion = 'Hi?';

    // Ensure category exists
    const categoryResult = await db.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [categoryName]
    );

    if (!categoryResult.rows.length) {
      const existingCategory = await db.query('SELECT id FROM categories WHERE name = $1', [categoryName]);
      categoryResult.rows[0] = existingCategory.rows[0];
    }

    const categoryId = categoryResult.rows[0].id;

    // Attempt to insert invalid question
    await db.query('INSERT INTO questions (category_id, question) VALUES ($1, $2) ON CONFLICT (question) DO NOTHING', [categoryId, invalidQuestion]);

    // Now check if it exists in the database
    const checkResult = await db.query('SELECT * FROM questions WHERE question = $1', [invalidQuestion]);

    expect(checkResult.rows.length).toBe(0);
  });
});
