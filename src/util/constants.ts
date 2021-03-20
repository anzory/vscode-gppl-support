import { readFileSync } from 'fs';
import { resolve } from 'path';

let gppl = JSON.parse(readFileSync(resolve(__dirname, 'package.json')).toString());

export const constants = {
  commands: {
    refreshTree: gppl.contributes.commands[0].command,
    refreshStatus: gppl.contributes.commands[1].command
  },
  languageId: gppl.contributes.languages[0].id,
  proceduresViewId: gppl.contributes.views.gppl[0].id,
  statusViewId: gppl.contributes.views.gppl[1].id,
  configId: gppl.contributes.languages[0].id,
  server: gppl.main,
  copyright: gppl.copyright,
  extension: {
    name: gppl.name,
    version: gppl.version,
    shortname: gppl.shortName,
  },
  extensionOutputChannelName: gppl.shortName,
  // iconsPath: join(__dirname, "..", "..", "resources", "icons"),
  urls: {
    changeLog: 'https://github.com/anzory/vscode-gppl-support/blob/master/CHANGELOG.md',
    readme: 'https://github.com/anzory/vscode-gppl-support/blob/master/README.md',
  },
};