const { execSync } = require('child_process');

module.exports = async () => {
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
    stdio: 'inherit',
  });
};
