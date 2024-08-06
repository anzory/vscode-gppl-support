rmdir /s /q node_modules

del package-lock.json

npm i -D @types/glob @types/node @types/vscode @types/webpack @typescript-eslint/eslint-plugin @typescript-eslint/parser @vscode/test-electron @vscode/vsce copy-webpack-plugin eslint fs glob  ts-loader ts-node typescript webpack webpack-cli rimraf i18n @types/i18n
