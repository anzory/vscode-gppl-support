import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    resolve: {
        alias: {
            'vscode': resolve(__dirname, 'src/test/__mocks__/vscode.ts'),
        },
    },
    test: {
        include: ['src/test/unit/**/*.test.ts'],
        globals: true,
        setupFiles: ['src/test/setup.ts'],
    },
});
