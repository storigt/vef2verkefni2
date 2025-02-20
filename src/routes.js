import xss from 'xss';
import express from 'express';
import { getDatabase } from './lib/db.client.js';

export const router = express.Router();

// Home Page - Fetch & display all categories
router.get('/', async (req, res) => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM categories WHERE name NOT ILIKE \'Ógild%\' ORDER BY name'
  );

  const categories = result?.rows ?? [];
  res.render('index', { title: 'Forsíða', categories });
});

// Category Page - Fetch & display questions & answers for a specific category
router.get('/spurningar/:categoryId', async (req, res) => {
  const db = getDatabase();
  const categoryId = req.params.categoryId;

  // Fetch category name
  const categoryResult = await db.query('SELECT name FROM categories WHERE id = $1', [categoryId]);
  const category = categoryResult?.rows[0];

  if (!category) {
    return res.status(404).send('Flokkur fannst ekki');
  }

  // Fetch questions & answers
  const questionsResult = await db.query(
    `SELECT q.id AS question_id, q.question, a.id AS answer_id, a.answer, a.is_correct
     FROM questions q
     LEFT JOIN answers a ON q.id = a.question_id
     WHERE q.category_id = $1
     ORDER BY q.id, a.id`,
    [categoryId]
  );

  // Process results into a structured format
  const questions = {};
  for (const row of questionsResult.rows) {
    if (!questions[row.question_id]) {
      questions[row.question_id] = {
        id: row.question_id,
        text: row.question,
        answers: [],
      };
    }
    if (row.answer_id) {
      questions[row.question_id].answers.push({
        id: row.answer_id,
        text: row.answer,
        is_correct: row.is_correct,
      });
    }
  }

  res.render('category', { title: category.name, categoryId, questions: Object.values(questions) });
});

// Form Page - Fetch categories for dropdown when adding questions
router.get('/form', async (req, res) => {
  const db = getDatabase();
  const categoriesResult = await db.query('SELECT * FROM categories ORDER BY name');

  res.render('form', {
    title: 'Bæta við gögnum',
    categories: categoriesResult.rows, // Send categories for dropdown
    errorMessage: null
  });
});

// Form Submission - Handle creating a new category or question
router.post('/form', async (req, res) => {
  const db = getDatabase();
  const { type, category_name, category_id, question, answers, correct_answer } = req.body;
  const cleanCategoryName = category_name ? xss(category_name.trim()) : '';
  const cleanQuestion = question ? xss(question.trim()) : '';
  const cleanAnswers = answers ? answers.map(a => xss(a.trim())) : [];

  let errorMessage = '';

  try {
    if (type === 'category') {
      if (!category_name || category_name.trim().length < 3) {
        errorMessage = 'Flokksheiti verður að vera að minnsta kosti 3 stafir.';
      } else {
        const result = await db.query(
          'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
          [cleanCategoryName]
        );
        if (!result.rows.length) {
          errorMessage = 'Flokkurinn er þegar til!';
        }
      }
    } else if (type === 'question') {
      if (!category_id || !question || question.trim().length < 5 || !answers || answers.length < 2) {
        errorMessage = 'Spurning verður að vera a.m.k. 5 stafir og hafa minnst 2 svör.';
      } else if (correct_answer === undefined) {
        errorMessage = 'Þú verður að velja rétt svar.';
      } else {
        const questionResult = await db.query(
          'INSERT INTO questions (category_id, question) VALUES ($1, $2) RETURNING id',
          [category_id, cleanQuestion]
        );

        const questionId = questionResult?.rows[0]?.id;
        if (!questionId) {
          errorMessage = 'Villa kom upp við skráningu spurningar.';
        } else {
          const correctIndex = parseInt(correct_answer, 10);
          for (let i = 0; i < answers.length; i++) {
            if (!answers[i] || answers[i].trim().length < 1) continue;

            const isCorrect = i === correctIndex;
            await db.query(
              'INSERT INTO answers (question_id, answer, is_correct) VALUES ($1, $2, $3)',
              [questionId, cleanAnswers[i], isCorrect]
            );
          }
        }
      }
    }

    if (errorMessage) {
      const categoriesResult = await db.query('SELECT * FROM categories ORDER BY name');
      return res.render('form', { title: 'Bæta við gögnum', categories: categoriesResult.rows, errorMessage });
    }

    res.render('form-created', { title: type === 'category' ? 'Flokkur búinn til' : 'Spurning búin til' });

  } catch (error) {
    console.error('Error inserting data:', error);
    res.render('form', { title: 'Bæta við gögnum', categories: [], errorMessage: 'Villa kom upp, reyndu aftur!' });
  }
});

// Handle Answer Submission & Show Feedback
router.post('/spurningar/:categoryId/svar', async (req, res) => {
  const db = getDatabase();
  const categoryId = req.params.categoryId;

  // Fetch category name
  const categoryResult = await db.query('SELECT name FROM categories WHERE id = $1', [categoryId]);
  const category = categoryResult?.rows[0];

  if (!category) {
    return res.status(404).send('Flokkur fannst ekki');
  }

  // Extract submitted answers
  const submittedAnswers = Object.entries(req.body)
    .filter(([key]) => key.startsWith('question-'))
    .map(([key, value]) => ({
      questionId: key.replace('question-', ''),
      answerId: value,
    }));

  // Check answers in database
  const results = [];
  for (const { questionId, answerId } of submittedAnswers) {
    const answerResult = await db.query(
      'SELECT is_correct FROM answers WHERE id = $1 AND question_id = $2',
      [answerId, questionId]
    );
    
    if (answerResult.rows.length > 0) {
      results.push({
        questionId,
        isCorrect: answerResult.rows[0].is_correct,
      });
    }
  }

  // Render results
  res.render('answer-results', { title: category.name, categoryId, results });
});

// Handle 404 - Route Not Found
router.use((req, res) => {
  res.status(404).render('404', { title: 'Síða fannst ekki' });
});
