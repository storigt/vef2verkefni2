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

const hostname = '127.0.0.1';
const port = 3000;

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

export { app, server };
