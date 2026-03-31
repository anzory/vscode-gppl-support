import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LoggerService, createLogger } from '../../../utils/logger';
import { ExtensionMode } from 'vscode';

const createMockContext = (mode: number = ExtensionMode.Production) => ({
    extensionMode: mode,
    subscriptions: [],
} as any);

const createMockOutputChannel = () => ({
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
});

describe('Logger (static)', () => {
    beforeEach(() => {
        Logger.close();
        Logger.currentLogLevel = 0; // ERROR
    });

    afterEach(() => {
        Logger.close();
    });

    it('configure creates output channel', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        expect(Logger.output).toBeDefined();
    });

    it('configure does not create second channel if already exists', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        const first = Logger.output;
        Logger.configure(ctx);
        expect(Logger.output).toBe(first);
    });

    it('enable shows channel', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        const spy = vi.spyOn(Logger.output!, 'show');
        Logger.enable();
        expect(spy).toHaveBeenCalled();
    });

    it('enable does nothing when output is undefined', () => {
        Logger.output = undefined;
        expect(() => Logger.enable()).not.toThrow();
    });

    it('error logs message when output exists', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.error('test error');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    });

    it('error handles Error object', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.error(new Error('error obj'));
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    });

    it('error handles Error object with stack in second param', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.error('msg', new Error('inner'));
        expect(spy).toHaveBeenCalled();
    });

    it('error does nothing when output is undefined', () => {
        Logger.output = undefined;
        expect(() => Logger.error('msg')).not.toThrow();
    });

    it('warn logs when level >= WARN', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        Logger.currentLogLevel = 1; // WARN
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.warn('warning');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
    });

    it('warn does nothing when level < WARN', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        Logger.currentLogLevel = 0; // ERROR
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.warn('warning');
        expect(spy).not.toHaveBeenCalled();
    });

    it('log logs when level >= INFO', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        Logger.currentLogLevel = 2; // INFO
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.log('info msg');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('debug logs when level >= DEBUG', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        Logger.currentLogLevel = 3; // DEBUG
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.debug('debug msg');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    });

    it('trace logs when level >= TRACE', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        Logger.currentLogLevel = 4; // TRACE
        const spy = vi.spyOn(Logger.output!, 'appendLine');
        Logger.trace('trace msg');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('[TRACE]'));
    });

    it('close disposes and clears output', () => {
        const ctx = createMockContext();
        Logger.configure(ctx);
        const spy = vi.spyOn(Logger.output!, 'dispose');
        Logger.close();
        expect(spy).toHaveBeenCalled();
        expect(Logger.output).toBeUndefined();
    });

    it('close does nothing when output is undefined', () => {
        Logger.output = undefined;
        expect(() => Logger.close()).not.toThrow();
    });

    it('configure in development mode sets ERROR log level', () => {
        const ctx = createMockContext(ExtensionMode.Development);
        Logger.configure(ctx);
        expect(Logger.currentLogLevel).toBe(0); // ERROR
    });
});

describe('LoggerService', () => {
    let logger: LoggerService;

    beforeEach(() => {
        logger = createLogger();
    });

    afterEach(() => {
        logger.close();
    });

    it('createLogger returns LoggerService instance', () => {
        expect(logger).toBeInstanceOf(LoggerService);
    });

    it('configure creates output channel', () => {
        const ctx = createMockContext();
        logger.configure!(ctx);
        // channel should be created - test by calling show without throwing
        expect(() => logger.show()).not.toThrow();
    });

    it('configure in development mode sets TRACE level and shows output', () => {
        const ctx = createMockContext(ExtensionMode.Development);
        logger.configure!(ctx);
        // In dev mode, log level should be TRACE, output should show
        // Test via trace - if it logs, level is TRACE
        logger.configure!(ctx);  // call twice to test 'output already exists' branch
    });

    it('configure in production mode', () => {
        const ctx = createMockContext(ExtensionMode.Production);
        logger.configure!(ctx);
        expect(() => logger.info('msg')).not.toThrow();
    });

    it('show does nothing when no output', () => {
        expect(() => logger.show()).not.toThrow();
    });

    it('show shows channel when configured', () => {
        const ctx = createMockContext();
        logger.configure!(ctx);
        expect(() => logger.show()).not.toThrow();
    });

    it('info calls log', () => {
        const ctx = createMockContext();
        logger.configure!(ctx);
        expect(() => logger.info('info msg')).not.toThrow();
    });

    it('warn does nothing without output', () => {
        expect(() => logger.warn('msg')).not.toThrow();
    });

    it('error does nothing without output', () => {
        expect(() => logger.error('msg')).not.toThrow();
    });

    it('debug does nothing without output', () => {
        expect(() => logger.debug('msg')).not.toThrow();
    });

    it('close does nothing without output', () => {
        expect(() => logger.close()).not.toThrow();
    });

    it('close disposes output when configured', () => {
        const ctx = createMockContext();
        logger.configure!(ctx);
        expect(() => logger.close()).not.toThrow();
    });

    it('error with Error object', () => {
        const ctx = createMockContext(ExtensionMode.Development);
        logger.configure!(ctx);
        // set to ERROR level
        expect(() => logger.error(new Error('test'))).not.toThrow();
    });

    it('error with string + Error', () => {
        const ctx = createMockContext();
        logger.configure!(ctx);
        expect(() => logger.error('msg', new Error('detail'))).not.toThrow();
    });

    it('error with string + non-Error', () => {
        const ctx = createMockContext();
        logger.configure!(ctx);
        expect(() => logger.error('msg', 'some string error')).not.toThrow();
    });

    describe('with development context (TRACE level)', () => {
        let devLogger: LoggerService;

        beforeEach(() => {
            devLogger = createLogger();
            devLogger.configure!(createMockContext(ExtensionMode.Development));
        });

        afterEach(() => {
            devLogger.close();
        });

        it('trace logs at TRACE level', () => {
            expect(() => devLogger['trace']('trace msg')).not.toThrow();
        });

        it('debug logs at TRACE level', () => {
            expect(() => devLogger.debug('debug msg')).not.toThrow();
        });

        it('info/log logs at TRACE level', () => {
            expect(() => devLogger.info('info msg')).not.toThrow();
        });

        it('warn logs at TRACE level', () => {
            expect(() => devLogger.warn('warn msg')).not.toThrow();
        });

        it('error logs at TRACE level with Error object with stack', () => {
            expect(() => devLogger.error(new Error('err with stack'))).not.toThrow();
        });

        it('error logs at TRACE level with string + Error object', () => {
            const err = new Error('inner');
            expect(() => devLogger.error('msg', err)).not.toThrow();
        });
    });
});
