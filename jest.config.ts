import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const customConfig: Config = {
  coverageProvider: 'v8',
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/api/**/*.test.ts'],
      transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', {
          useESM: true,
        }],
      },
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/hooks/**/*.test.ts'],
      transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest', {
          useESM: true,
        }],
      },
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
    },
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(customConfig)