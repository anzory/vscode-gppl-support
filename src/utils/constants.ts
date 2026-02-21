import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Disposable, workspace } from 'vscode';

/**
 * Resolves the correct path to package.json.
 * In development: __dirname is out/src/utils, so package.json is ../../package.json
 * In production (webpack): __dirname is dist/, and package.json is in the same directory
 * @private
 */
function resolvePackageJsonPath(): string {
  // Try production path first (webpack dist folder)
  const prodPath = resolve(__dirname, 'package.json');
  if (existsSync(prodPath)) {
    return prodPath;
  }
  // Fallback to development path
  return resolve(__dirname, '..', '..', 'package.json');
}

/**
 * Parsed package.json content containing extension metadata and configuration.
 * @private
 */
const gpp = JSON.parse(
  readFileSync(resolvePackageJsonPath()).toString()
);

/**
 * Manages application constants and configuration settings for the GPP extension.
 *
 * This class provides centralized access to:
 * - Extension metadata (name, version)
 * - Command definitions
 * - URL references
 * - Formatting configuration
 * - Language settings
 */
class GpplConstants {
  /** Collection of all application constants */
  public constants = {
    extension: {
      name: gpp.name,
      version: gpp.version,
    },
    commands: {
      formatDocument: gpp.contributes.commands[0].command,
      showProcedureReferences: gpp.contributes.commands[1].command,
    },
    urls: {
      changeLog:
        'https://github.com/anzory/vscode-gppl-support/blob/master/CHANGELOG.md',
      readme:
        'https://github.com/anzory/vscode-gppl-support/blob/master/README.md',
    },
    files: {
      encoding: workspace
        .getConfiguration('gpp.files')
        .get<string>('encoding', 'windows1251'),
    },
    format: {
      enable: workspace
        .getConfiguration('gpp.format')
        .get<boolean>('enable', true),
      tabSize: workspace
        .getConfiguration('gpp.format')
        .get<number>('tabSize', 2),
      preferSpace: workspace
        .getConfiguration('gpp.format')
        .get<boolean>('preferSpaces', true),
      applyIndentsToRegions: workspace
        .getConfiguration('gpp.format')
        .get<boolean>('applyIndentsToRegions', true),
    },
    localesEnum:
      gpp.contributes.configuration.properties['gpp.localization.defaultLocale']
        .enum,
    languageId: gpp.contributes.languages[0].id,
    configId: gpp.contributes.languages[0].id,
    copyright: gpp.copyright,
    extensionOutputChannelName: 'SolidCAM GPPL',
  };
}

/**
 * Global constants instance for the GPP extension.
 *
 * This instance is automatically updated when configuration changes occur.
 */
export let constants = new GpplConstants().constants;

/**
 * Stores the configuration change subscription for proper cleanup.
 * @private
 */
let configChangeDisposable: Disposable | undefined;

/**
 * Initializes the configuration change listener for constants.
 * Must be called during extension activation to ensure proper cleanup.
 *
 * @param subscriptions - The extension subscriptions array to add the disposable to
 */
export function initializeConstants(subscriptions: Disposable[]): void {
  // Dispose previous subscription if exists
  if (configChangeDisposable) {
    configChangeDisposable.dispose();
  }

  // Create new subscription and add to subscriptions for proper cleanup
  configChangeDisposable = workspace.onDidChangeConfiguration(() => {
    constants = new GpplConstants().constants;
  });
  subscriptions.push(configChangeDisposable);
}

/**
 * Updates constants immediately (used for initial load or manual refresh).
 */
export function refreshConstants(): void {
  constants = new GpplConstants().constants;
}
