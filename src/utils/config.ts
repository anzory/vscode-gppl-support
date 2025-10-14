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
 * Configuration settings interface for GPP extension.
 */
type IgpplSettings = {
  /** Enable syntax colorization */
  colorization: boolean;
  /** Machine type setting */
  machine: string;
  /** Auto reference setting */
  trAutoRef: boolean;
  /** Status bar enable setting */
  statusEnabled: boolean;
};

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
    if (!e.affectsConfiguration(constants.configId)) {
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
  setParam(param: string, value: any, global = true): boolean {
    try {
      this.config.update(param, value, global);
    } catch (err) {
      return false;
    }

    this.reloadConfig();

    if (this.config !== undefined) {
      return true;
    } else {
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
    let workspaceTokenColorCustomizations = workspace.getConfiguration(
      'editor.tokenColorCustomizations'
    );
    let customTokenColorCustomizations: any = {};
    Object.assign(
      customTokenColorCustomizations,
      workspaceTokenColorCustomizations
    );

    let colorsDefaultDark = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          'languages',
          constants.languageId,
          'colorsDefaultDark.json'
        )
      ).toString()
    );
    let colorsDefaultLight = JSON.parse(
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
      let wpDarkRules: any[] =
        customTokenColorCustomizations['[*Dark*]'].textMateRules;
      let gppDarkRules: any[] = colorsDefaultDark['[*Dark*]'].textMateRules;

      gppDarkRules.forEach((set) => {
        let exist: boolean = false;
        exist = wpDarkRules.some((wpSet) => {
          return set.scope === wpSet.scope;
        });
        if (!exist) {
          customTokenColorCustomizations['[*Dark*]'].textMateRules.push(set);
          hasChanges = true;
        }
      });
    }

    if (!customTokenColorCustomizations['[*Light*]']) {
      Object.assign(customTokenColorCustomizations, colorsDefaultLight);
      hasChanges = true;
    } else {
      let wpLightRules: any[] =
        customTokenColorCustomizations['[*Light*]'].textMateRules;
      let gppLightRules: any[] = colorsDefaultLight['[*Light*]'].textMateRules;

      gppLightRules.forEach((set) => {
        let exist: boolean = false;
        exist = wpLightRules.some((wpSet) => {
          return set.scope === wpSet.scope;
        });
        if (!exist) {
          customTokenColorCustomizations['[*Light*]'].textMateRules.push(set);
          hasChanges = true;
        }
      });
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
