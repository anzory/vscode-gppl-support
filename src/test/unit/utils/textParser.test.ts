import { describe, it, expect } from 'vitest';
import { Position } from 'vscode';
import TextParser from '../../../utils/textParser';

describe('TextParser', () => {
    const parser = new TextParser();

    describe('escapeRegExp', () => {
        it('should escape special regex characters', () => {
            expect(parser.escapeRegExp('hello.world')).toBe('hello\\.world');
            expect(parser.escapeRegExp('a+b*c?d')).toBe('a\\+b\\*c\\?d');
            expect(parser.escapeRegExp('(test)[0]')).toBe('\\(test\\)\\[0\\]');
            expect(parser.escapeRegExp('a^b$c')).toBe('a\\^b\\$c');
            expect(parser.escapeRegExp('a{1}|b')).toBe('a\\{1\\}\\|b');
            expect(parser.escapeRegExp('path\\to\\file')).toBe('path\\\\to\\\\file');
        });

        it('should return plain strings unchanged', () => {
            expect(parser.escapeRegExp('hello')).toBe('hello');
            expect(parser.escapeRegExp('')).toBe('');
        });
    });

    describe('isInsideComment', () => {
        it('should detect position after semicolon as inside comment', () => {
            const doc = createMockDocument('code ; comment');
            expect(parser.isInsideComment(doc as any, new Position(0, 7))).toBe(true);
        });

        it('should detect position before semicolon as outside comment', () => {
            const doc = createMockDocument('code ; comment');
            expect(parser.isInsideComment(doc as any, new Position(0, 2))).toBe(false);
        });

        it('should return false when no semicolon', () => {
            const doc = createMockDocument('just code');
            expect(parser.isInsideComment(doc as any, new Position(0, 3))).toBe(false);
        });
    });
});

function createMockDocument(text: string) {
    const lines = text.split('\n');
    return {
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        positionAt: (offset: number) => {
            let line = 0;
            let char = offset;
            for (let i = 0; i < lines.length; i++) {
                if (char <= lines[i].length) {
                    line = i;
                    break;
                }
                char -= lines[i].length + 1;
                line = i + 1;
            }
            return new Position(line, char);
        },
        uri: { fsPath: '/test.gpp', scheme: 'file', path: '/test.gpp' },
        lineCount: lines.length,
    };
}
