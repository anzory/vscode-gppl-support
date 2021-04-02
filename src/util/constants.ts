import { readFileSync } from 'fs';
import { resolve } from 'path';
import { workspace } from 'vscode';

let gpp = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json')).toString()
);

export const constants = {
  commands: {
    refreshTree: gpp.contributes.commands[0].command,
    procedureSelection: gpp.contributes.commands[1].command,
    sortByAZ: gpp.contributes.commands[2].command,
    sortByZA: gpp.contributes.commands[3].command,
    sortByDefault: gpp.contributes.commands[4].command,
    formatDocument: gpp.contributes.commands[5].command,
  },
  languageId: gpp.contributes.languages[0].id,
  proceduresViewId: gpp.contributes.views.gpp[0].id,
  configId: gpp.contributes.languages[0].id,
  formatEnable: workspace.getConfiguration().get<number>('gpp.format.enable'),
  tabSize: workspace.getConfiguration().get<number>('gpp.format.tabSize'),
  insertSpaces: workspace
    .getConfiguration()
    .get<boolean>('gpp.format.insertSpaces'),
  copyright: gpp.copyright,
  extension: {
    name: gpp.name,
    version: gpp.version,
    shortname: gpp.shortName,
  },
  extensionOutputChannelName: gpp.shortName,
  // iconsPath: join(__dirname, "..", "..", "resources", "icons"),
  urls: {
    changeLog:
      'https://github.com/anzory/vscode-gppl-support/blob/master/CHANGELOG.md',
    readme:
      'https://github.com/anzory/vscode-gppl-support/blob/master/README.md',
  },
};
