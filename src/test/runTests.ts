import * as path from 'path';

import { runTests } from '@vscode/test-electron/out';

async function main() {
  try {
    // Папка, содержащая пакет Extension Manifest package.json
    // Передается в `--extensionDevelopmentPath`.
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // Путь к программе запуска тестов
    // Передается в --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite');

    // Загрузите VS Code, распакуйте его и запустите интеграционный тест
    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.log(err);
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
