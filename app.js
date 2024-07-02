const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cache = require('./cache');

const BWS_PLUGIN_CONFIG_KEY = '__bws_plugin';

const fetchSecretTemplateTag = {
  name: 'bws',
  displayName: 'BWS CLI',
  liveDisplayName: args => {
    switch (args[0]?.value) {
      case 'getSecret':
        return `BWS → Get Secret: ${args[1]?.value ?? '--'}`;
      case 'getProject':
        return `BWS → Get Project: ${args[1]?.value ?? '--'}`;
      default:
        return 'BWS → Operation';
    }
  },
  description: 'Perform operations using BWS CLI',
  args: [
    {
      displayName: 'Operation',
      description: 'BWS CLI operation',
      type: 'enum',
      options: [
        { displayName: 'Get Secret', value: 'getSecret' },
        { displayName: 'Get Project', value: 'getProject' },
      ],
      defaultValue: 'getSecret',
    },
    {
      displayName: 'UUID',
      description: 'Bitwarden secret or project UUID',
      type: 'string',
      defaultValue: '',
      placeholder: "e.g. 'abc123' for get operations"
    },
    {
      displayName: 'Field Filter (optional)',
      description: 'Field to filter the value (e.g. "value")',
      type: 'string',
      defaultValue: '',
      placeholder: "e.g. Filter for 'value' only"
    }
  ],
  async run(context, operation, id, field) {
    const config = context.context[BWS_PLUGIN_CONFIG_KEY];
    const cliPath = config?.cliPath || '/usr/local/bin/bws';
    const accessToken = config?.accessToken;

    if (!accessToken) {
      throw new Error('Access token is not set. Please set it in the plugin configuration.\nExample:\n{\n  "__bws_plugin": {\n    "cliPath": "/opt/homebrew/bin/bws",\n    "accessToken": "your-access-token"\n  }\n}');
    }

    await checkCli(cliPath);
    let result;
    switch (operation) {
      case 'getSecret':
        result = await getSecret(cliPath, id, accessToken);
        break;
      case 'getProject':
        result = await getProject(cliPath, id, accessToken);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    if (field) {
      result = result[field];
      if (result === undefined) {
        throw new Error(`Field "${field}" not found in the result.`);
      }
    }

    return JSON.stringify(result, null, 2);
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

async function getProject(cliPath, projectId, accessToken) {
  const cacheKey = `project-${projectId}`;
  const cached = cache.getEntry(cacheKey);
  if (cached) {
    return cached;
  }

  return new Promise((resolve, reject) => {
    exec(`${cliPath} project get ${projectId} --access-token ${accessToken}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Failed to get project: ${stderr}`));
      } else {
        try {
          const project = JSON.parse(stdout);
          cache.writeEntry(cacheKey, project);
          resolve(project);
        } catch (parseError) {
          reject(new Error(`Failed to parse project: ${parseError.message}`));
        }
      }
    });
  });
}

module.exports.templateTags = [fetchSecretTemplateTag];