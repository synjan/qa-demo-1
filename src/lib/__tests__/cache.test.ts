import { GitHubCacheManager } from '../cache';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');

describe('GitHubCacheManager', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cache manager state
    (GitHubCacheManager as any).cacheEnabled = undefined;
    (GitHubCacheManager as any).memoryCache.clear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isCacheEnabled', () => {
    it('should return true by default', () => {
      expect(GitHubCacheManager.isCacheEnabled()).toBe(true);
    });

    it('should return false when DISABLE_GITHUB_CACHE is set', () => {
      process.env.DISABLE_GITHUB_CACHE = 'true';
      expect(GitHubCacheManager.isCacheEnabled()).toBe(false);
    });

    it('should cache the enabled state', () => {
      const firstCall = GitHubCacheManager.isCacheEnabled();
      process.env.DISABLE_GITHUB_CACHE = 'true';
      const secondCall = GitHubCacheManager.isCacheEnabled();
      
      expect(firstCall).toBe(secondCall);
    });
  });

  describe('getCachedRepositories', () => {
    it('should return null when cache is disabled', async () => {
      process.env.DISABLE_GITHUB_CACHE = 'true';
      
      const result = await GitHubCacheManager.getCachedRepositories('token123');
      
      expect(result).toBeNull();
    });

    it('should return memory cached data if available', async () => {
      const mockData = [{ id: 1, name: 'repo1' }];
      const cacheKey = GitHubCacheManager.generateCacheKey('repositories', 'token123');
      (GitHubCacheManager as any).memoryCache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now(),
        etag: 'test-etag'
      });

      const result = await GitHubCacheManager.getCachedRepositories('token123');

      expect(result).toEqual(mockData);
      expect(mockFs.readFile).not.toHaveBeenCalled();
    });

    it('should check file cache when memory cache misses', async () => {
      const mockData = [{ id: 1, name: 'repo1' }];
      const cacheData = {
        data: mockData,
        timestamp: Date.now(),
        etag: 'test-etag'
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(cacheData));

      const result = await GitHubCacheManager.getCachedRepositories('token123');

      expect(result).toEqual(mockData);
      expect(mockFs.readFile).toHaveBeenCalled();
    });

    it('should return null for expired cache', async () => {
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const cacheData = {
        data: [{ id: 1, name: 'repo1' }],
        timestamp: oldTimestamp,
        etag: 'test-etag'
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(cacheData));

      const result = await GitHubCacheManager.getCachedRepositories('token123');

      expect(result).toBeNull();
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await GitHubCacheManager.getCachedRepositories('token123');

      expect(result).toBeNull();
    });
  });

  describe('setCachedRepositories', () => {
    it('should not cache when disabled', async () => {
      process.env.DISABLE_GITHUB_CACHE = 'true';
      
      await GitHubCacheManager.setCachedRepositories('token123', [], 'etag');
      
      expect(mockFs.mkdir).not.toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should cache data in memory and file', async () => {
      const mockData = [{ id: 1, name: 'repo1' }];
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await GitHubCacheManager.setCachedRepositories('token123', mockData, 'etag');

      const cacheKey = GitHubCacheManager.generateCacheKey('repositories', 'token123');
      const memoryData = (GitHubCacheManager as any).memoryCache.get(cacheKey);
      
      expect(memoryData).toBeDefined();
      expect(memoryData.data).toEqual(mockData);
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('repositories_'),
        expect.stringContaining(JSON.stringify(mockData)),
        'utf-8'
      );
    });

    it('should handle write errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      // Should not throw
      await expect(
        GitHubCacheManager.setCachedRepositories('token123', [], 'etag')
      ).resolves.not.toThrow();
    });
  });

  describe('getCachedIssues', () => {
    it('should generate correct cache key for issues', async () => {
      const cacheKey = GitHubCacheManager.generateCacheKey('issues', 'owner/repo/open', 'token123');
      (GitHubCacheManager as any).memoryCache.set(cacheKey, {
        data: [],
        timestamp: Date.now(),
        etag: 'test-etag'
      });

      await GitHubCacheManager.getCachedIssues('owner', 'repo', 'open', 'token123');

      expect((GitHubCacheManager as any).memoryCache.has(cacheKey)).toBe(true);
    });
  });

  describe('invalidateCache', () => {
    it('should clear all caches', async () => {
      // Add some data to memory cache
      (GitHubCacheManager as any).memoryCache.set('key1', 'value1');
      (GitHubCacheManager as any).memoryCache.set('key2', 'value2');
      
      mockFs.readdir.mockResolvedValue(['file1.json', 'file2.json'] as any);
      mockFs.unlink.mockResolvedValue(undefined);

      await GitHubCacheManager.invalidateCache();

      expect((GitHubCacheManager as any).memoryCache.size).toBe(0);
      expect(mockFs.readdir).toHaveBeenCalled();
      expect(mockFs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when clearing file cache', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      // Should not throw
      await expect(GitHubCacheManager.invalidateCache()).resolves.not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      // Add test data
      (GitHubCacheManager as any).memoryCache.set('key1', {
        data: [1, 2, 3],
        timestamp: Date.now(),
        etag: 'etag1'
      });
      
      mockFs.readdir.mockResolvedValue(['file1.json', 'file2.json'] as any);

      const stats = await GitHubCacheManager.getCacheStats();

      expect(stats).toEqual({
        enabled: true,
        memoryCacheSize: 1,
        fileCacheSize: 2,
        totalSize: 3
      });
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should remove expired entries from memory cache', () => {
      const now = Date.now();
      const oldTimestamp = now - (25 * 60 * 60 * 1000);
      const recentTimestamp = now - (1 * 60 * 60 * 1000);

      (GitHubCacheManager as any).memoryCache.set('old', {
        data: [],
        timestamp: oldTimestamp,
        etag: 'old'
      });
      
      (GitHubCacheManager as any).memoryCache.set('recent', {
        data: [],
        timestamp: recentTimestamp,
        etag: 'recent'
      });

      GitHubCacheManager.cleanupExpiredCache();

      expect((GitHubCacheManager as any).memoryCache.has('old')).toBe(false);
      expect((GitHubCacheManager as any).memoryCache.has('recent')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined etag', async () => {
      await GitHubCacheManager.setCachedRepositories('token123', [], undefined);
      
      const cacheKey = GitHubCacheManager.generateCacheKey('repositories', 'token123');
      const data = (GitHubCacheManager as any).memoryCache.get(cacheKey);
      
      expect(data.etag).toBeUndefined();
    });

    it('should handle very large cache keys', () => {
      const longToken = 'a'.repeat(1000);
      const key = GitHubCacheManager.generateCacheKey('repositories', longToken);
      
      expect(key).toContain('repositories');
      expect(key.length).toBeLessThan(1100); // Should be hashed/truncated
    });
  });
});