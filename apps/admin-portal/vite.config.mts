/// <reference types='vitest' />
import { defineConfig } from 'vite';
import crypto from 'node:crypto';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

type HashEncoding = crypto.BinaryToTextEncoding | 'buffer' | undefined;
type CryptoWithHash = typeof crypto & {
  hash?: (algorithm: string, data: crypto.BinaryLike, outputEncoding?: HashEncoding) => string | Buffer;
};

const cryptoWithHash = crypto as CryptoWithHash;

if (typeof cryptoWithHash.hash !== 'function') {
  cryptoWithHash.hash = (algorithm, data, outputEncoding) => {
    const hash = crypto.createHash(algorithm).update(data);
    return outputEncoding === 'buffer' || outputEncoding === undefined
      ? hash.digest()
      : hash.digest(outputEncoding);
  };
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/admin-portal',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  optimizeDeps: {
    exclude: [
      'class-transformer/storage',
      '@nestjs/mapped-types',
      '@nestjs/swagger',
      '@nestjs/common',
      '@nestjs/core',
    ],
  },
  build: {
    rollupOptions: {
      external: [
        '@nestjs/mapped-types',
        'class-transformer/storage',
        '@nestjs/swagger',
        '@nestjs/common',
        '@nestjs/core',
      ],
    },
  },
  test: {
    name: 'admin-portal',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['src/environments/**'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/admin-portal',
      provider: 'v8' as const,
    },
  },
}));
