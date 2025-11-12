import * as dotenv from 'dotenv'
dotenv.config();

export const port = process.env.PORT || 3000;
export const secretKey = process.env.MY_APP_SECRET_KEY || 'changeme';
export const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost/humap';


// Validate that port is a positive integer.
if (process.env.PORT) {
  const parsedPort = parseInt(process.env.PORT, 10);
  if (!Number.isInteger(parsedPort)) {
    throw new Error('Environment variable $PORT must be an integer');
  } else if (parsedPort < 1 || parsedPort > 65535) {
    throw new Error('Environment variable $PORT must be a valid port number');
  }
}