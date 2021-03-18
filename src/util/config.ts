'use strict';
import { ConfigurationChangeEvent, ExtensionContext, workspace, WorkspaceConfiguration } from "vscode";
import { constants } from './constants';

type IgpplSettings = {
  colorization: boolean;
  machine: string;
  trAutoRef: boolean;
  statusEnabled: boolean;
};


export class Config {
  private config: WorkspaceConfiguration;
  //private settings: IgpplSettings;

  static configure(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(configuration.onConfigurationChanged, configuration)
    );
  }

  constructor () {
    // Static reference to configuration
    this.config = workspace.getConfiguration(constants.configId);

    // Initialize

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
    }
    catch (err) {
      console.log('Error updating configuration');
      return false;
    }

    this.reloadConfig();

    if (this.config !== undefined) {
      return true;
    } else { return false; }
  }

}

export const configuration = new Config();