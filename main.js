const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cache = require('./cache');

const BWS_PLUGIN_CONFIG_KEY = '__bws_plugin';

const fetchSecretTemplateTag = {
  name: 'bws',
  displayName: 'BWS CLI',
  liveDisplayName: args => {
    return `BWS → Get Secret: ${args[0]?.value ?? '--'}`;
  },
  description: 'Fetch a secret value using BWS CLI',
  args: [
    {
      displayName: 'UUID',
      description: 'Bitwarden secret UUID',
      type: 'string',
      defaultValue: '',
      placeholder: "e.g. 'abc123'"
    }
  ],
  async run(context, id) {
    const config = context.context[BWS_PLUGIN_CONFIG_KEY];
    const cliPath = config?.cliPath || '/usr/local/bin/bws';
    const accessToken = config?.accessToken;

    if (!accessToken) {
      throw new Error('Access token is not set. Please set it in the plugin configuration.\nExample:\n{\n  "__bws_plugin": {\n    "cliPath": "/opt/homebrew/bin/bws",\n    "accessToken": "your-access-token"\n  }\n}');
    }

    await checkCli(cliPath);
    const result = await getSecret(cliPath, id, accessToken);

    if (result.value === undefined) {
      throw new Error(`Field "value" not found in the result.`);
    }
    // Remove quotes from the result if it is a string
    return result.value.replace(/^"(.*)"$/, '$1');
  }
};

async function checkCli(cliPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(cliPath)) {
      return reject(new Error(`BWS CLI not found. Please install it or set the correct path in the plugin configuration. ${cliPath} does not exist.`));
    }

    let pathToAdd = cliPath;
    const stats = fs.statSync(cliPath);
    if (stats.isFile()) {
      pathToAdd = path.dirname(cliPath);
    }

    process.env.PATH = `${pathToAdd}:${process.env.PATH}`;

    exec(`${cliPath} --version`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`BWS CLI not found. Please install it or set the correct path in the plugin configuration. ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

async function getSecret(cliPath, secretId, accessToken) {
  const cacheKey = `secret-${secretId}`;
  const cached = cache.getEntry(cacheKey);
  if (cached) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    exec(`${cliPath} secret get ${secretId} --access-token ${accessToken}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Failed to get secret: ${stderr}`));
      } else {
        try {
          const secret = JSON.parse(stdout);
          cache.writeEntry(cacheKey, secret);
          resolve(secret);
        } catch (parseError) {
          reject(new Error(`Failed to parse secret: ${parseError.message}`));
        }
      }
    });
  });
}

module.exports.templateTags = [fetchSecretTemplateTag];
