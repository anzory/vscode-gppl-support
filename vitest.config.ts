import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    test: {
        include: ['src/test/unit/**/*.test.ts'],
        globals: true,
        alias: {
            'vscode': resolve(__dirname, 'src/__mocks__/vscode.ts'),
        },
    },
});
