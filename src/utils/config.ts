'use strict';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ConfigurationChangeEvent,
  ConfigurationTarget,
  ExtensionContext,
  workspace,
  WorkspaceConfiguration,
} from 'vscode';
import { constants } from './constants';

/**
 * Represents a TextMate rule for syntax highlighting.
 */
interface TextMateRule {
  scope: string | string[];
  settings: {
    foreground?: string;
    fontStyle?: string;
    background?: string;
  };
}

/**
 * Represents theme-specific token color customizations.
 */
interface ThemeTokenColors {
  textMateRules: TextMateRule[];
}

/**
 * Represents the complete token color customizations structure.
 */
interface TokenColorCustomizations {
  '[*Dark*]'?: ThemeTokenColors;
  '[*Light*]'?: ThemeTokenColors;
  [key: string]: unknown;
}

/**
 * Manages configuration settings for the GPP extension.
 *
 * This class handles:
 * - Reading and writing configuration settings
 * - Automatic colorization setup
 * - Configuration change notifications
 * - Parameter validation and fallbacks
 */
export class Config {
  private config: WorkspaceConfiguration;

  /**
   * Creates an instance of Config.
   *
   * Initializes the configuration and sets up:
   * - Default formatter for GPP files
   * - Colorization settings
   */
  constructor() {
    this.config = workspace.getConfiguration(constants.configId);
    workspace
      .getConfiguration('[gpp]')
      .update('editor.defaultFormatter', 'anzory.vscode-gppl-support');
    this.addColorizationSettings();
  }

  /**
   * Configures the extension context with configuration change handlers.
   *
   * @param context - The extension context to configure
   */
  configure(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(this.onConfigurationChanged)
    );
  }

  /**
   * Handles configuration change events.
   *
   * @private
   * @param e - The configuration change event
   */
  private onConfigurationChanged(e: ConfigurationChangeEvent) {
    if (e.affectsConfiguration(constants.configId)) {
      this.reloadConfig();
    }
  }

  /**
   * Reloads the configuration from workspace settings.
   *
   * @private
   */
  private reloadConfig() {
    this.config = workspace.getConfiguration(constants.configId);
  }

  /**
   * Gets a configuration parameter value.
   *
   * @param param - The parameter name to retrieve
   * @returns The parameter value
   */
  getParam(param: string): any {
    this.reloadConfig();
    return this.config.get(param);
  }

  /**
   * Sets a configuration parameter value.
   *
   * @param param - The parameter name to set
   * @param value - The value to set
   * @param global - Whether to set globally or workspace-specific
   * @returns True if the parameter was set successfully
   */
  setParam(param: string, value: unknown, global = true): boolean {
    try {
      this.config.update(param, value, global);
      this.reloadConfig();
      // Verify the value was set correctly
      return this.config.get(param) === value;
    } catch {
      return false;
    }
  }

  /**
   * Adds colorization settings for GPP syntax highlighting.
   *
   * This method merges GPP-specific token color customizations with
   * existing workspace token color settings for both light and dark themes.
   *
   * @private
   */
  private addColorizationSettings() {
    const workspaceTokenColorCustomizations = workspace.getConfiguration(
      'editor.tokenColorCustomizations'
    );
    const customTokenColorCustomizations: TokenColorCustomizations = {};
    Object.assign(
      customTokenColorCustomizations,
      workspaceTokenColorCustomizations
    );

    const colorsDefaultDark: TokenColorCustomizations = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          'languages',
          constants.languageId,
          'colorsDefaultDark.json'
        )
      ).toString()
    );
    const colorsDefaultLight: TokenColorCustomizations = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          'languages',
          constants.languageId,
          'colorsDefaultLight.json'
        )
      ).toString()
    );

    let hasChanges = false;

    if (!customTokenColorCustomizations['[*Dark*]']) {
      Object.assign(customTokenColorCustomizations, colorsDefaultDark);
      hasChanges = true;
    } else {
      const wpDarkRules: TextMateRule[] =
        customTokenColorCustomizations['[*Dark*]']?.textMateRules || [];
      const gppDarkRules: TextMateRule[] =
        colorsDefaultDark['[*Dark*]']?.textMateRules || [];

      for (const set of gppDarkRules) {
        const exist = wpDarkRules.some(
          (wpSet) =>
            JSON.stringify(set.scope) === JSON.stringify(wpSet.scope)
        );
        if (!exist) {
          customTokenColorCustomizations['[*Dark*]']!.textMateRules.push(set);
          hasChanges = true;
        }
      }
    }

    if (!customTokenColorCustomizations['[*Light*]']) {
      Object.assign(customTokenColorCustomizations, colorsDefaultLight);
      hasChanges = true;
    } else {
      const wpLightRules: TextMateRule[] =
        customTokenColorCustomizations['[*Light*]']?.textMateRules || [];
      const gppLightRules: TextMateRule[] =
        colorsDefaultLight['[*Light*]']?.textMateRules || [];

      for (const set of gppLightRules) {
        const exist = wpLightRules.some(
          (wpSet) =>
            JSON.stringify(set.scope) === JSON.stringify(wpSet.scope)
        );
        if (!exist) {
          customTokenColorCustomizations['[*Light*]']!.textMateRules.push(set);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      workspace
        .getConfiguration('editor')
        .update(
          'tokenColorCustomizations',
          customTokenColorCustomizations,
          true
        );
    }
  }
}
