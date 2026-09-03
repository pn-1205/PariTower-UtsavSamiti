/**
 * Automated Deployment Script for Pari Tower Festival Committee (PTFC)
 * Can be run via: node scripts/auto_deploy.js
 */
const https = require('https');
const { execSync } = require('child_process');

async function deploy(config) {
  const { githubUser, githubToken, repoName = 'PariTower-UtsavSamiti', vercelToken, databaseUrl, sessionSecret } = config;

  console.log('\n--- 1. CREATING GITHUB REPOSITORY ---');
  // Create GitHub repo via API if needed
  try {
    const postData = JSON.stringify({
      name: repoName,
      description: 'Pari Tower Festival Committee Web Application',
      private: false,
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/user/repos',
      method: 'POST',
      headers: {
        'User-Agent': 'PTFC-Auto-Deployer',
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
      },
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode === 201) {
            console.log(`Successfully created GitHub repo: ${repoName}`);
            resolve(JSON.parse(body));
          } else if (res.statusCode === 422) {
            console.log(`GitHub repo ${repoName} already exists. Continuing...`);
            resolve(null);
          } else {
            console.warn(`GitHub API response: ${res.statusCode} ${body}`);
            resolve(null);
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.log('GitHub repo check notice:', err.message);
  }

  console.log('\n--- 2. PUSHING CODE TO GITHUB ---');
  try {
    execSync(`"C:\\Program Files\\Git\\cmd\\git.exe" remote remove origin`, { stdio: 'ignore' });
  } catch (e) {}

  const remoteUrl = `https://${githubUser}:${githubToken}@github.com/${githubUser}/${repoName}.git`;
  execSync(`"C:\\Program Files\\Git\\cmd\\git.exe" remote add origin ${remoteUrl}`, { stdio: 'inherit' });
  execSync(`"C:\\Program Files\\Git\\cmd\\git.exe" push -u origin main --force`, { stdio: 'inherit' });
  console.log('Code pushed successfully to GitHub main branch!');

  console.log('\n--- 3. DEPLOYING TO VERCEL ---');
  // Deploy via Vercel CLI or API
  console.log('Ready to connect and deploy to Vercel.');
}

module.exports = { deploy };