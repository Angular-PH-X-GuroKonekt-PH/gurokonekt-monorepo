const { execSync } = require('child_process');
const path = require('path');

console.log('Node.js version:', process.version);

try {
  // Set environment variables for CommonJS compatibility
  process.env.NODE_OPTIONS = '--no-warnings';
  
  // Change to the API directory
  const apiDir = path.join(__dirname, 'apps', 'api');
  
  // Try to run Prisma generate with specific options
  const result = execSync('npx prisma generate --schema=./prisma/schema.prisma', {
    cwd: apiDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  console.log('Prisma client generated successfully!');
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
  process.exit(1);
}