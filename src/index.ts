import { Hono } from 'hono';
import { cors } from 'hono/cors';
import scoreRoutes from './routes/score';

const app = new Hono();

app.use('/bms/score/*', cors());
app.route('/bms/score', scoreRoutes);

app.get('/', (c) =>
    c.text('gronyan')
);

export default app;