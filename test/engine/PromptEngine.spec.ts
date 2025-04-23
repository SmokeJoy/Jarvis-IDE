import { engine } from '../../../src/mas/engine/PromptEngine';

test('runs default strategy in chat mode', async () => {
  const result = await engine.run('hello', 'chat');
  expect(result.output).toBe('[chat] → hello');
  expect(result.tokenUsage).toBe(5);
});

test('runs default strategy in coder mode', async () => {
  const result = await engine.run('console.log("Hello")', 'coder');
  expect(result.output).toBe('[coder] → console.log("Hello")');
  expect(result.tokenUsage).toBe(23);
}); 