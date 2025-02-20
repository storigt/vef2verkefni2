import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { router } from './routes.js';

const app = express();

const publicPath = path.join(fileURLToPath(import.meta.url), '../../public'); // Adjust path
app.use(express.static(publicPath));

app.use(express.urlencoded({ extended: true }));

const viewsPath = fileURLToPath(new URL('./views', import.meta.url));
app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use('/', router);

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});

export { app, server };
