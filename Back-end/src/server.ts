import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`Siyowin backend running on http://localhost:${env.port}`);
});

const gracefulShutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server shut down.');
    process.exit(0);
  });
  
  // Force shutdown after 5s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
