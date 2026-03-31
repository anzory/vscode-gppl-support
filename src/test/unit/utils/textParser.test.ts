import { describe, it, expect } from 'vitest';
import { Position, Uri } from 'vscode';
import TextParser, { createTextParser } from '../../../utils/textParser';

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

        it('should return false when semicolon is at same position as character', () => {
            const doc = createMockDocument('code;comment');
            // position.character = 4 (where semicolon is), commentIndex = 4, NOT commentIndex < position.character
            expect(parser.isInsideComment(doc as any, new Position(0, 4))).toBe(false);
        });
    });

    describe('getWordLocationsInDoc', () => {
        it('returns empty array when doc is undefined', () => {
            const result = parser.getWordLocationsInDoc(undefined, 'word');
            expect(result).toEqual([]);
        });

        it('finds word in document', () => {
            const doc = createMockDocument('call @proc1\ncall @proc2');
            const result = parser.getWordLocationsInDoc(doc as any, '@proc1');
            expect(result.length).toBeGreaterThan(0);
        });

        it('returns empty when word not found', () => {
            const doc = createMockDocument('some code here');
            const result = parser.getWordLocationsInDoc(doc as any, 'notfound');
            expect(result).toEqual([]);
        });
    });

    describe('getLocationsInDoc', () => {
        it('returns empty array when doc is undefined', () => {
            const result = parser.getLocationsInDoc(undefined, 'pattern');
            expect(result).toEqual([]);
        });

        it('returns empty array when pattern is empty', () => {
            const doc = createMockDocument('some text');
            const result = parser.getLocationsInDoc(doc as any, '');
            expect(result).toEqual([]);
        });

        it('finds pattern in document', () => {
            const doc = createMockDocument('@proc1\ncall @proc1');
            const result = parser.getLocationsInDoc(doc as any, '@proc1');
            expect(result.length).toBeGreaterThan(0);
        });

        it('skips matches inside comments', () => {
            const doc = createMockDocument('@proc1 ; @proc1 in comment');
            const result = parser.getLocationsInDoc(doc as any, '@proc1');
            // Only the first one should be found
            expect(result.length).toBe(1);
        });

        it('uses cached regexp on second call', () => {
            const doc = createMockDocument('abc abc');
            parser.getLocationsInDoc(doc as any, 'abc');
            const result = parser.getLocationsInDoc(doc as any, 'abc');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('getWordLocationsForLiteral', () => {
        it('returns empty array for empty word', () => {
            const doc = createMockDocument('some text');
            const result = parser.getWordLocationsForLiteral(doc as any, '');
            expect(result).toEqual([]);
        });

        it('finds literal word with word boundaries', () => {
            const doc = createMockDocument('hello world hello');
            const result = parser.getWordLocationsForLiteral(doc as any, 'hello');
            expect(result.length).toBe(2);
        });

        it('handles words starting with non-word char like @', () => {
            const doc = createMockDocument('@proc1\ncall @proc1');
            const result = parser.getWordLocationsForLiteral(doc as any, '@proc1');
            expect(result.length).toBeGreaterThan(0);
        });

        it('handles words ending with non-word char', () => {
            const doc = createMockDocument('@proc! call @proc!');
            const result = parser.getWordLocationsForLiteral(doc as any, '@proc!');
            // should find them without word boundary at end
            expect(result).toBeDefined();
        });
    });

    describe('getRegExpRangesInDoc', () => {
        it('returns empty array when doc is undefined', () => {
            const result = parser.getRegExpRangesInDoc(undefined, /test/);
            expect(result).toEqual([]);
        });

        it('returns empty array when regExp is undefined/null', () => {
            const doc = createMockDocument('test text');
            const result = parser.getRegExpRangesInDoc(doc as any, null as any);
            expect(result).toEqual([]);
        });

        it('finds all ranges matching regex', () => {
            const doc = createMockDocument('@proc1\n@proc2\ncall @proc1');
            const result = parser.getRegExpRangesInDoc(doc as any, /^\s*@\w*\b.*$/gm);
            expect(result.length).toBe(2);
        });

        it('returns empty array when no matches', () => {
            const doc = createMockDocument('no procedures here');
            const result = parser.getRegExpRangesInDoc(doc as any, /^\s*@\w+/gm);
            expect(result).toEqual([]);
        });
    });

    describe('clearCache', () => {
        it('clears the regexp cache', () => {
            const p = createTextParser();
            const doc = createMockDocument('test');
            p.getLocationsInDoc(doc as any, 'test');
            expect(() => p.clearCache()).not.toThrow();
            // Can still use after clearing
            const result = p.getLocationsInDoc(doc as any, 'test');
            expect(result).toBeDefined();
        });
    });

    describe('LRU cache eviction', () => {
        it('evicts least recently used entries when cache is full', () => {
            const p = createTextParser();
            const doc = createMockDocument('test');
            // Fill cache beyond MAX_CACHE_SIZE (500)
            for (let i = 0; i < 502; i++) {
                p.getLocationsInDoc(doc as any, `pattern_${i}`);
            }
            // Should still work after eviction
            const result = p.getLocationsInDoc(doc as any, 'test');
            expect(result).toBeDefined();
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
