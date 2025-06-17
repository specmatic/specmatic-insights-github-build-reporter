import fs from 'fs';
import os from 'os';
import path from 'path';
import { safelyReadFile } from '../utils';

// Tests using the real file system (no mocks)
describe('safelyReadFile with real file system', () => {
  test('should read an actual file from filesystem', () => {
    const tempDir = os.tmpdir();
    const dummyFilePath = path.join(tempDir, 'dummy-test-file.txt');
    const dummyContent = 'This is a dummy file for safelyReadFile test.';
    
    // Create the dummy file
    fs.writeFileSync(dummyFilePath, dummyContent, 'utf-8');
    
    try {
      // Use the real safelyReadFile function
      const result = safelyReadFile('dummy test file', dummyFilePath);
      expect(result).toBe(dummyContent);
    } finally {
      // Clean up dummy file
      if (fs.existsSync(dummyFilePath)) {
        fs.unlinkSync(dummyFilePath);
      }
    }
  });
});
