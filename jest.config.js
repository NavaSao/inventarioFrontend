module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^expo-font$': '<rootDir>/__mocks__/expoFontMock.js',
    '^@expo-google-fonts/.*$': '<rootDir>/__mocks__/googleFontsMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
        },
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
};
