import { describe, it, beforeEach, afterEach } from 'mocha';
import 'should';
import * as sinon from 'sinon';
import { TerminalProcess } from './TerminalProcess';
import * as vscode from 'vscode';
import { TerminalRegistry } from './TerminalRegistry';
import { EventEmitter } from 'events';
import { expect } from 'chai';

declare module 'vscode' {
  // https://github.com/microsoft/vscode/blob/f0417069c62e20f3667506f4b7e53ca0004b4e3e/src/vscode-dts/vscode.d.ts#L7442
  interface Terminal {
    shellIntegration?: {
      cwd?: vscode.Uri;
      executeCommand?: (command: string) => {
        read: () => AsyncIterable<string>;
      };
    };
  }
}

// Create a mock stream for simulating terminal output - this is only used for tests
// that need controlled output which can't be guaranteed with real terminals
function createMockStream(lines: string[] = ['test-command', 'line1', 'line2', 'line3']) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const line of lines) {
        yield line + '\n';
      }
    },
  };
}

describe('TerminalProcess (Integration Tests)', () => {
  let process: TerminalProcess;
  let sandbox: sinon.SinonSandbox;
  let createdTerminals: vscode.Terminal[] = [];
  let emitSpy: sinon.SinonSpy;
  let sendTextStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox({ useFakeTimers: true });
    process = new TerminalProcess();
    emitSpy = sinon.spy(process, 'emit');
    sendTextStub = sinon.stub();
  });

  afterEach(() => {
    // Restore sandbox, which restores timers and all Sinon fakes
    sandbox.restore();
    // Remove any event listeners left on the TerminalProcess
    process.removeAllListeners();
    // Dispose all terminals created during the test
    createdTerminals.forEach((t) => t.dispose());
    createdTerminals = [];
  });

  describe('Real terminal tests', () => {
    // This test works with or without shell integration
    it('should create and run a command in a real terminal', async () => {
      // Create a real VS Code terminal for testing
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Run a simple command
      await process.run(terminal, 'echo test');

      // Verify that the continue event was emitted
      expect(emitSpy.calledWith('continue')).to.be.true;
      expect(emitSpy.calledWith('completed')).to.be.true;
    });

    it('should execute and capture events from a simple command', async () => {
      // Create a real VS Code terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Run a command that produces predictable output
      await process.run(terminal, "echo 'Line 1' && echo 'Line 2'");

      // Check that the events were emitted
      expect(emitSpy.calledWith('completed')).to.be.true;
      expect(emitSpy.calledWith('continue')).to.be.true;
    });

    it('should execute a command that lists files', async () => {
      // Create a real VS Code terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Run a command that lists files
      await process.run(terminal, 'ls -la');

      // Verify that the continue event was emitted
      expect(emitSpy.calledWith('continue')).to.be.true;
      expect(emitSpy.calledWith('completed')).to.be.true;
    });

    it('should handle a longer running command', async () => {
      // Create a real terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Un-fake timers temporarily for this test since we need real timing
      sandbox.clock.restore();

      // Run a command that sleeps for a short period
      await process.run(terminal, "sleep 0.5 && echo 'Done sleeping'");

      // Verify that the continue and completed events were emitted
      expect(emitSpy.calledWith('continue')).to.be.true;
      expect(emitSpy.calledWith('completed')).to.be.true;

      // Restore fake timers for other tests
      sandbox.useFakeTimers();
    });

    it('should execute a command with arguments', async () => {
      // Create a real VS Code terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Run a command that produces predictable output
      await process.run(terminal, "echo 'Line 1' 'Line 2'");

      // Check that the events were emitted
      expect(emitSpy.calledWith('completed')).to.be.true;
      expect(emitSpy.calledWith('continue')).to.be.true;
    });

    it('should execute a command with quotes', async () => {
      // Create a real VS Code terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Run a command that produces predictable output
      await process.run(terminal, 'echo "Line 1" && echo \'Line 2\'');

      // Check that the events were emitted
      expect(emitSpy.calledWith('completed')).to.be.true;
      expect(emitSpy.calledWith('continue')).to.be.true;
    });
  });

  // Test that specifically checks for no shell integration
  it('should handle terminals without shell integration', async () => {
    // Create a real terminal without explicitly providing shell integration
    const terminal = vscode.window.createTerminal({ name: 'Test Terminal' });
    createdTerminals.push(terminal);

    // Stub the shellIntegration getter to return undefined for this test
    sandbox.stub(terminal, 'shellIntegration').get(() => undefined);

    // Stub the sendText method to verify it's called
    sandbox.stub(terminal, 'sendText').get(() => sendTextStub);

    // Run the command
    await process.run(terminal, 'test-command');

    // Check that the correct methods were called and events emitted
    expect(sendTextStub.calledWith('test-command', true)).to.be.true;
    expect(emitSpy.calledWith('completed')).to.be.true;
    expect(emitSpy.calledWith('continue')).to.be.true;

    // This event should be emitted for terminals without shell integration
    expect(emitSpy.calledWith('no_shell_integration')).to.be.true;
  });

  // The following tests require shell integration and controlled terminal output
  describe('Shell integration tests', () => {
    // We'll mock the terminal run process and TerminalProcess for these tests
    it('should emit completed and continue events when command finishes', async function () {
      // Create a terminal to ensure proper interface, but we'll use mocking under the hood
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Create a mock implementation of executeCommand
      const mockExecuteCommand = sandbox.stub().returns({
        read: () => createMockStream(['echo test', 'test output']),
      });

      // Create a fake shell integration object
      const mockShellIntegration = {
        executeCommand: mockExecuteCommand,
      };

      // Stub terminal.shellIntegration to return our mock
      sandbox.stub(terminal, 'shellIntegration').get(() => mockShellIntegration);

      // Run the command
      await process.run(terminal, 'echo test');

      // Verify the executeCommand was called with the right command
      expect(mockExecuteCommand.calledWith('echo test')).to.be.true;

      // Check that the events were emitted
      expect(emitSpy.calledWith('completed')).to.be.true;
      expect(emitSpy.calledWith('continue')).to.be.true;
    });
  });

  // Tests with controlled output
  describe('Controlled output tests', () => {
    it('should emit line events for each line of output', async function () {
      // Create a terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Mock the shell integration with controlled output
      const mockExecuteCommand = sandbox.stub().returns({
        read: () => createMockStream(['test-command', 'line1', 'line2', 'line3']),
      });

      // Create a mock shell integration object and stub the getter
      sandbox.stub(terminal, 'shellIntegration').get(() => ({
        executeCommand: mockExecuteCommand,
      }));

      await process.run(terminal, 'test-command');

      // Check that line events were emitted for each line
      expect(emitSpy.calledWith('line', 'line1')).to.be.true;
      expect(emitSpy.calledWith('line', 'line2')).to.be.true;
      expect(emitSpy.calledWith('line', 'line3')).to.be.true;
    });

    it('should properly handle process hot state (e.g. compiling)', async function () {
      // Create a terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Mock the shell integration
      const mockExecuteCommand = sandbox.stub().returns({
        read: () => createMockStream(['compiling...']),
      });

      // Create a mock shell integration object and stub the getter
      sandbox.stub(terminal, 'shellIntegration').get(() => ({
        executeCommand: mockExecuteCommand,
      }));

      // Spy on global setTimeout
      const setTimeoutSpy = sandbox.spy(global, 'setTimeout');

      await process.run(terminal, 'build command');

      // Move time forward enough to schedule
      sandbox.clock.tick(100);

      // Expect a 15-second (>= 10000ms) hot timeout, since it saw "compiling"
      const foundCompilingTimeout = setTimeoutSpy.args.filter(
        (args) => args[1] && args[1] >= 10000
      );
      expect(foundCompilingTimeout.length).to.be.greaterThan(0);
    });

    it('should handle standard commands with normal hot timeout', async function () {
      // Create a terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Mock the shell integration
      const mockExecuteCommand = sandbox.stub().returns({
        read: () => createMockStream(['some normal output']),
      });

      // Create a mock shell integration object and stub the getter
      sandbox.stub(terminal, 'shellIntegration').get(() => ({
        executeCommand: mockExecuteCommand,
      }));

      const setTimeoutSpy = sandbox.spy(global, 'setTimeout');

      await process.run(terminal, 'standard command');
      sandbox.clock.tick(100);

      // Expect a short hot timeout (<= 5000)
      const foundNormalTimeout = setTimeoutSpy.args.filter((args) => args[1] && args[1] <= 5000);
      expect(foundNormalTimeout.length).to.be.greaterThan(0);

      // Also check that "completed" eventually emits
      const emitSpy = sandbox.spy(process, 'emit');
      await process.run(terminal, 'another command');
      expect(emitSpy.calledWith('completed')).to.be.true;
    });

    it('should correctly filter command echoes based on current implementation', async function () {
      // Create a terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Mock the shell integration
      const mockExecuteCommand = sandbox.stub().returns({
        read: () =>
          createMockStream([
            'test-command', // This should be filtered (command contains this exactly)
            'test command', // This should NOT be filtered (doesn't match exactly)
            'other output',
          ]),
      });

      // Create a mock shell integration object and stub the getter
      sandbox.stub(terminal, 'shellIntegration').get(() => ({
        executeCommand: mockExecuteCommand,
      }));

      await process.run(terminal, 'test-command');

      // Check that "test-command" was filtered out but "test command" was not
      expect(emitSpy.calledWith('line', 'test command')).to.be.true;
      expect(emitSpy.calledWith('line', 'other output')).to.be.true;
      // This should never be called because it should be filtered
      expect(emitSpy.calledWith('line', 'test-command')).to.be.false;
    });

    it('should handle npm run commands', async function () {
      // Create a terminal
      const terminal = TerminalRegistry.createTerminal().terminal;
      createdTerminals.push(terminal);

      // Mock the shell integration
      const mockExecuteCommand = sandbox.stub().returns({
        read: () =>
          createMockStream([
            'npm run build',
            '> project@1.0.0 build',
            '> tsc',
            'files built successfully',
          ]),
      });

      // Create a mock shell integration object and stub the getter
      sandbox.stub(terminal, 'shellIntegration').get(() => ({
        executeCommand: mockExecuteCommand,
      }));

      await process.run(terminal, 'npm run build');

      // The "npm run build" line should be filtered, but the rest should be emitted
      expect(emitSpy.calledWith('line', '> project@1.0.0 build')).to.be.true;
      expect(emitSpy.calledWith('line', '> tsc')).to.be.true;
      expect(emitSpy.calledWith('line', 'files built successfully')).to.be.true;
    });
  });

  // The following tests are shared with the unit tests to ensure consistent behavior
  it('should emit line for remaining buffer when emitRemainingBufferIfListening is called', () => {
    // Access private properties via type assertion
    const processAny = process as any;
    processAny.buffer = 'test buffer content';
    processAny.isListening = true;

    processAny.emitRemainingBufferIfListening();
    expect(emitSpy.calledWith('line', 'test buffer content')).to.be.true;
    processAny.buffer.should.equal('');
  });

  it('should remove prompt characters from the last line of output', () => {
    const processAny = process as any;

    processAny.removeLastLineArtifacts('line 1\nline 2 %').should.equal('line 1\nline 2');
    processAny.removeLastLineArtifacts('line 1\nline 2 $').should.equal('line 1\nline 2');
    processAny.removeLastLineArtifacts('line 1\nline 2 #').should.equal('line 1\nline 2');
    processAny.removeLastLineArtifacts('line 1\nline 2 >').should.equal('line 1\nline 2');
  });

  it('should process buffer and emit lines when newline characters are found', () => {
    const processAny = process as any;

    processAny.emitIfEol('line 1\nline 2\nline 3');
    expect(emitSpy.calledWith('line', 'line 1')).to.be.true;
    expect(emitSpy.calledWith('line', 'line 2')).to.be.true;
    processAny.buffer.should.equal('line 3');

    processAny.emitIfEol(' continued\n');
    expect(emitSpy.calledWith('line', 'line 3 continued')).to.be.true;
    processAny.buffer.should.equal('');
  });
});
