import fs from 'fs';
import * as path from 'path';

// Mock fs and path modules before importing the tested module
jest.mock('fs');
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    resolve: jest.fn((...args: string[]) => originalPath.posix.join(...args)),
    win32: {
      ...originalPath.win32,
      resolve: jest.fn((...args: string[]) => originalPath.win32.join(...args))
    }
  };
});

// Mock console.log for logErrorStep
const originalConsoleLog = console.log;
const mockConsoleLog = jest.fn();
console.log = mockConsoleLog;

// Import after mocking
import { safelyReadFile } from '../utils';



describe('safelyReadFile', () => {
  // Store original platform value
  const originalPlatform = process.platform;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mocked process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/test/cwd');
    mockConsoleLog.mockClear();
  });
  
  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  test('should return undefined if filePath is not provided', () => {
    const result = safelyReadFile('test description');
    expect(result).toBeUndefined();
  });

  test('should read file successfully on non-Windows platform', () => {
    // Mock platform as non-Windows
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });
    
    const mockContent = 'file content';
    (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
    
    const result = safelyReadFile('test description', 'test-file.txt');
    
    expect(result).toBe(mockContent);
    expect(fs.readFileSync).toHaveBeenCalledWith('/test/cwd/test-file.txt', 'utf-8');
    expect(path.resolve).toHaveBeenCalledWith('/test/cwd', 'test-file.txt');
    expect(path.win32.resolve).not.toHaveBeenCalled();
  });

  test('should read file successfully on Windows platform', () => {
    // Mock platform as Windows
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });
    
    const mockContent = 'file content on windows';
    (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
    
    const result = safelyReadFile('test description', 'test-file.txt');
    
    expect(result).toBe(mockContent);
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(path.win32.resolve).toHaveBeenCalledWith('/test/cwd', 'test-file.txt');
    expect(path.resolve).not.toHaveBeenCalled();
  });

  test('should handle error when file reading fails', () => {
    // Reset platform to non-Windows for this test
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });
    // Mock error
    const mockError = new Error('File not found');
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw mockError;
    });
    
    const result = safelyReadFile('test description', 'non-existent-file.txt');
    
    expect(result).toBeUndefined();
    // Verify that console.log was called with the error message
    expect(mockConsoleLog).toHaveBeenCalled();
    // The first argument should be the color code
    expect(mockConsoleLog.mock.calls[0][0]).toBe('\x1b[31m%s\x1b[0m');
    // The second argument should be the error symbol
    expect(mockConsoleLog.mock.calls[0][1]).toBe('  ×');
    // The third argument should contain the error message
    expect(mockConsoleLog.mock.calls[0][2]).toBe('Error reading test description: non-existent-file.txt');
    // The fourth argument should be the error object
    expect(mockConsoleLog.mock.calls[0][3]).toBe(mockError);
  });
  
  // Restore original platform after all tests
  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });
});
