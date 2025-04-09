import { JarvisIdeIgnoreController } from './JarvisIdeIgnoreController.js.js';
import { Uri } from 'vscode';

describe('JarvisIdeIgnoreController', () => {
  let controller: JarvisIdeIgnoreController;
  const mockWorkspaceFolder = Uri.file('/test/workspace');

  beforeEach(() => {
    controller = new JarvisIdeIgnoreController(mockWorkspaceFolder);
  });

  describe('shouldIgnore', () => {
    it('should ignore node_modules directory', () => {
      const filePath = Uri.file('/test/workspace/node_modules/test.js');
      expect(controller.shouldIgnore(filePath)).toBe(true);
    });

    it('should ignore .git directory', () => {
      const filePath = Uri.file('/test/workspace/.git/config');
      expect(controller.shouldIgnore(filePath)).toBe(true);
    });

    it('should ignore files in .jarvis-ide-ignore', async () => {
      const ignoreFile = Uri.file('/test/workspace/.jarvis-ide-ignore');
      const testFile = Uri.file('/test/workspace/test.js');

      // Mock file system
      jest.spyOn(controller, 'readIgnoreFile').mockResolvedValue(['test.js']);

      expect(await controller.shouldIgnore(testFile)).toBe(true);
    });

    it('should not ignore files not in ignore list', async () => {
      const testFile = Uri.file('/test/workspace/valid.js');
      jest.spyOn(controller, 'readIgnoreFile').mockResolvedValue(['test.js']);

      expect(await controller.shouldIgnore(testFile)).toBe(false);
    });
  });

  describe('readIgnoreFile', () => {
    it('should return empty array if ignore file does not exist', async () => {
      const result = await controller.readIgnoreFile();
      expect(result).toEqual([]);
    });

    it('should read and parse ignore file', async () => {
      const mockContent = 'test.js\n*.log\nbuild/';
      jest.spyOn(controller, 'readFile').mockResolvedValue(mockContent);

      const result = await controller.readIgnoreFile();
      expect(result).toEqual(['test.js', '*.log', 'build/']);
    });
  });

  describe('updateIgnoreFile', () => {
    it('should add new patterns to ignore file', async () => {
      const mockContent = 'test.js\n*.log';
      jest.spyOn(controller, 'readFile').mockResolvedValue(mockContent);
      jest.spyOn(controller, 'writeFile').mockResolvedValue();

      await controller.updateIgnoreFile(['build/']);
      expect(controller.writeFile).toHaveBeenCalledWith('test.js\n*.log\nbuild/');
    });

    it('should create new ignore file if it does not exist', async () => {
      jest.spyOn(controller, 'readFile').mockResolvedValue('');
      jest.spyOn(controller, 'writeFile').mockResolvedValue();

      await controller.updateIgnoreFile(['test.js']);
      expect(controller.writeFile).toHaveBeenCalledWith('test.js');
    });
  });
}); 