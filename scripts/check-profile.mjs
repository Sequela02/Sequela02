// Validates profile.config.json. The build runs the same check before it
// fetches anything, so a bad config fails before any network call.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

export function validateConfig(config) {
  const errors = [];
  const text = (value, path) => {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${path} must be a non-empty string`);
    }
  };
  const repos = (value, path, count) => {
    if (!Array.isArray(value) || value.length !== count) {
      errors.push(`${path} must list exactly ${count} repositories`);
      return;
    }
    value.forEach((repo, i) => {
      if (typeof repo !== 'string' || !REPO.test(repo)) {
        errors.push(`${path}[${i}] must be "owner/name"`);
      }
    });
  };

  text(config.username, 'username');
  const profile = config.profile ?? {};
  for (const key of ['name', 'intro', 'closing']) {
    text(profile[key], `profile.${key}`);
  }
  repos(config.featured, 'featured', 4);
  repos(config.more, 'more', 4);
  if (
    !Array.isArray(config.links) ||
    config.links.length < 1 ||
    config.links.length > 4
  ) {
    errors.push('links must have 1 to 4 entries');
  } else {
    config.links.forEach((link, i) => {
      text(link?.label, `links[${i}].label`);
      if (typeof link?.url !== 'string' || !link.url.startsWith('https://')) {
        errors.push(`links[${i}].url must be an https URL`);
      }
    });
  }
  return errors;
}

export function readConfig(path) {
  const config = JSON.parse(readFileSync(path, 'utf8'));
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Invalid ${path}:\n- ${errors.join('\n- ')}`);
  }
  return config;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  readConfig('profile.config.json');
  console.log('profile.config.json is valid');
}
