import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './lib/db.client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FOLDER = path.join(__dirname, '../data'); // Adjusted to point to data folder

const INVALID_CATEGORY_PREFIX = 'Ógild'; // Any category starting with this should be skipped

async function loadJson(filename) {
  try {
    const filePath = path.join(DATA_FOLDER, filename);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

async function insertData() {
  const db = getDatabase();

  // Load index.json to get category mapping
  const indexData = await loadJson('index.json');
  if (!indexData) {
    console.error('Failed to load index.json');
    return;
  }

  for (const entry of indexData) {
    if (!entry.title || !entry.file) {
      console.warn('Skipping invalid category entry:', entry);
      continue;
    }

    // 🚨 Skip invalid categories
    if (entry.title.startsWith(INVALID_CATEGORY_PREFIX)) {
      console.warn(`Skipping invalid category: ${entry.title}`);
      continue;
    }

    console.log(`Processing category: ${entry.title}`);

    // Insert category
    const categoryResult = await db.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [entry.title]
    );
    
    const categoryId = categoryResult?.rows[0]?.id;
    if (!categoryId) {
      console.error(`Failed to insert category: ${entry.title}`);
      continue;
    }

    // Load corresponding JSON file
    const categoryData = await loadJson(entry.file);
    if (!categoryData || !categoryData.questions) {
      console.warn(`No questions found in ${entry.file}, skipping.`);
      continue;
    }

    for (const questionEntry of categoryData.questions) {
      if (!questionEntry.question || !Array.isArray(questionEntry.answers)) {
        console.warn('Skipping invalid question entry:', questionEntry);
        continue;
      }

      console.log(`  Adding question: ${questionEntry.question}`);

      // Insert question
      const questionResult = await db.query(
        'INSERT INTO questions (category_id, question) VALUES ($1, $2) RETURNING id',
        [categoryId, questionEntry.question]
      );

      const questionId = questionResult?.rows[0]?.id;
      if (!questionId) {
        console.error(`Failed to insert question: ${questionEntry.question}`);
        continue;
      }

      // Insert answers
      for (const answerEntry of questionEntry.answers) {
        if (!answerEntry.answer) {
          console.warn('Skipping invalid answer entry:', answerEntry);
          continue;
        }

        await db.query(
          'INSERT INTO answers (question_id, answer, is_correct) VALUES ($1, $2, $3)',
          [questionId, answerEntry.answer, answerEntry.correct || false]
        );
      }
    }
  }

  console.log('Data loading complete.');
  await db.close();
}

insertData().catch((err) => {
  console.error('Error inserting data:', err);
});
