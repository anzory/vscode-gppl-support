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

type IgpplSettings = {
  colorization: boolean;
  machine: string;
  trAutoRef: boolean;
  statusEnabled: boolean;
};
export class Config {
  private config: WorkspaceConfiguration;

  constructor() {
    this.config = workspace.getConfiguration(constants.configId);
    workspace
      .getConfiguration('[gpp]')
      .update('editor.defaultFormatter', 'anzory.vscode-gppl-support');
    this.addColorizationSettings();
  }

  configure(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(this.onConfigurationChanged)
    );
  }

  private onConfigurationChanged(e: ConfigurationChangeEvent) {
    if (!e.affectsConfiguration(constants.configId)) {
      this.reloadConfig();
    }
  }

  private reloadConfig() {
    this.config = workspace.getConfiguration(constants.configId);
  }

  getParam(param: string): any {
    this.reloadConfig();
    return this.config.get(param);
  }

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

  private addColorizationSettings() {
    workspace
      .getConfiguration()
      .update(
        'editor.tokenColorCustomizations',
        undefined,
        ConfigurationTarget.Global,
        true
      );

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

    if (!customTokenColorCustomizations['[*Dark*]']) {
      Object.assign(customTokenColorCustomizations, colorsDefaultDark);
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
        }
      });
    }

    if (!customTokenColorCustomizations['[*Light*]']) {
      Object.assign(customTokenColorCustomizations, colorsDefaultLight);
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
        }
      });
    }

    workspace
      .getConfiguration('editor')
      .update('tokenColorCustomizations', customTokenColorCustomizations, true);
  }
}
