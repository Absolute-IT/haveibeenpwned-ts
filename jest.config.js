export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { 
			useESM: true,
			tsconfig: 'tsconfig.test.json'
		}],
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	extensionsToTreatAsEsm: ['.ts'],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: ['/node_modules/'],
	globals: {
		fetch: global.fetch,
	},
}; 