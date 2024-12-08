// jest.setup.js
import { jest } from '@jest/globals';
import fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
}));

// Set default mock implementations
fs.existsSync.mockImplementation(() => true);
fs.unlink.mockImplementation(() => Promise.resolve());
fs.writeFile.mockImplementation(() => Promise.resolve());
fs.readFile.mockImplementation(() => Promise.resolve(Buffer.from('')));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
