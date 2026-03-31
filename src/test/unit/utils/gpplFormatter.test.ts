import { describe, it, expect } from 'vitest';
import { computeFormattedLines, FormatOptions } from '../../../utils/gpplFormatter';

const defaultOpts: FormatOptions = { indent: '  ', applyIndentsToRegions: true };

describe('computeFormattedLines', () => {
    it('should indent if/endif block', () => {
        const lines = ['if condition', 'doSomething', 'endif'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            'if condition',
            '  doSomething',
            'endif',
        ]);
    });

    it('should handle nested if blocks', () => {
        const lines = ['if a', 'if b', 'action', 'endif', 'endif'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            'if a',
            '  if b',
            '    action',
            '  endif',
            'endif',
        ]);
    });

    it('should indent proc/endp block', () => {
        const lines = ['@MyProc', 'code', 'endp'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            '@MyProc',
            '  code',
            'endp',
        ]);
    });

    it('should preserve empty lines', () => {
        const lines = ['@MyProc', '', 'code', 'endp'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            '@MyProc',
            '',
            '  code',
            'endp',
        ]);
    });

    it('should indent comments at current level', () => {
        const lines = ['if a', '; comment inside', 'action', 'endif'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            'if a',
            '  ; comment inside',
            '  action',
            'endif',
        ]);
    });

    it('should handle else/elseif', () => {
        const lines = ['if a', 'action1', 'else', 'action2', 'endif'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            'if a',
            '  action1',
            'else',
            '  action2',
            'endif',
        ]);
    });

    it('should handle while/endw', () => {
        const lines = ['while cond', 'body', 'endw'];
        const result = computeFormattedLines(lines, defaultOpts);
        expect(result).toEqual([
            'while cond',
            '  body',
            'endw',
        ]);
    });
});
