const { exec } = require('child_process');

function checkCli(cliPath) {
  return new Promise((resolve, reject) => {
    exec(`${cliPath} --version`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Bitwarden CLI not found. Please install it or set the correct path in the plugin configuration. ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

function fetchSecret(cliPath, secretId, accessToken) {
  return new Promise((resolve, reject) => {
    exec(`BWS_ACCESS_TOKEN=${accessToken} ${cliPath} secret get ${secretId}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Failed to fetch secret: ${stderr}`));
      } else {
        try {
          const secret = JSON.parse(stdout);
          resolve(secret.value);
        } catch (parseError) {
          reject(new Error(`Failed to parse secret: ${parseError.message}`));
        }
      }
    });
  });
}

const fetchSecretTemplateTag = {
  name: 'bitwarden',
  displayName: 'Bitwarden => Fetch Secret',
  liveDisplayName: args => `Bitwarden => ${args[0]?.value ?? '--'}`,
  description: 'Fetch a secret from your Bitwarden vault',
  args: [
    {
      displayName: 'Secret ID',
      description: 'Bitwarden secret ID',
      type: 'string',
      defaultValue: '',
      placeholder: "e.g. 'abc123'"
    }
  ],
  async run(context, secretId) {
    const cliPath = await context.store.getItem('BWS_PATH') || '/usr/local/bin/bws';
    const accessToken = await context.store.getItem('BWS_ACCESS_TOKEN');

    if (!accessToken) {
      throw new Error('BWS_ACCESS_TOKEN environment variable is not set.');
    }

    await checkCli(cliPath);
    const secret = await fetchSecret(cliPath, secretId, accessToken);
    return `"${secret}"`;
  }
};

module.exports.templateTags = [fetchSecretTemplateTag];
