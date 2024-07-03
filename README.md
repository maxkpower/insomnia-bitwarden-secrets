
# Insomnia bws Plugin

This Insomnia plugin allows you to interact with the [Bitwarden Secrets Manager](https://bitwarden.com/products/secrets-manager/) (bws) CLI to perform operations such as retrieving secrets and projects.

## Requirements

[bws CLI](https://bitwarden.com/help/secrets-manager-cli/) installed on your system. You can install the CLI using the following commands:

### Installation

#### Linux and macOS
```sh
curl https://bws.bitwarden.com/install | sh` 
```

#### Windows

```powershell
iwr https://bws.bitwarden.com/install | iex
```

## Plugin Installation
In order for Insomnia to recognize the plugin as an Insomnia plugin, please copy the plugin files to the following locations:

MacOS: `~/Library/Application Support/Insomnia/plugins/` (escaped version: ~/Library/Application\ Support/Insomnia/plugins/)
Windows: `%APPDATA%\Insomnia\plugins\`
Linux: `$XDG_CONFIG_HOME/Insomnia/plugins/` or `~/.config/Insomnia/plugins/`

## Plugin Configuration

The plugin requires you to set the bws CLI path and [access token](https://bitwarden.com/help/access-tokens/) in the environment variables. Below is an example configuration:

```json
{
  "__bws_plugin": {
    "cliPath": "/usr/local/bin/bws",
    "accessToken": "your-access-token"
  },
  "secret": "{% bws 'getSecret' 'your-secret-uuid' 'value' %}"
}
``` 

-   `cliPath`: Path to the bws CLI executable.
-   `accessToken`: Your Bitwarden access token.

## Usage

### Available Operations

-   `Get Secret`: Retrieve a secret by its UUID.
-   `Get Project`: Retrieve a project by its UUID.

### Example Usage

#### Get Secret

To retrieve a secret by its UUID, use the following template tag in your Insomnia request:

```json
"{% bws 'getSecret' 'your-secret-uuid' 'value' %}"
```

#### Get Project

To retrieve a project by its UUID, use the following template tag in your Insomnia request:

```json
"{% bws 'getProject' 'your-project-uuid' 'name' %}"
```

### Optional Field
You can specify an optional field to filter the value. 
<img src="./images/tag.png" alt="Tag Image" width="500"/>

For instance, if you only want to get the `value` field in the example below:

```json
{
  "id": "your-secret-id",
  "organizationId": "your-organization-id",
  "projectId": "your-project-id",
  "key": "your-key",
  "value": "your-value",
  "note": "",
  "creationDate": "2024-01-24T10:46:40.970622500Z",
  "revisionDate": "2024-04-09T08:51:11.377613300Z"
}
```

Use the following template tag:

```json
"{% bws 'getSecret' 'your-secret-id' 'value' %}"
```

### Using the Autocomplete Menu
Instead of manually typing the template tags, you can use the autocomplete menu to insert them. Press `Ctrl + Space` wherever environment variables can be used to launch the autocomplete menu and select the desired bws operation.

<img src="./images/autocomplete.png" alt="Autocomplete Image" width="500"/>

For more information on referencing environment variables, visit the [Insomnia documentation](https://docs.insomnia.rest/insomnia/environment-variables#referencing-environment-variables).

## Contributing

If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
