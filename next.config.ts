import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repositoryName = 'Cooking_Starter';

const nextConfig: NextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  assetPrefix: isGitHubPages ? `/${repositoryName}` : '',
  trailingSlash: isGitHubPages,
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: isGitHubPages ? 'github-pages' : 'server',
  },
};

export default nextConfig;
