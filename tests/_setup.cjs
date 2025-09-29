// Set build configuration for unit tests.
// Options: development, production
global.__BUILD_CONFIGURATION__ = "production";

// Mock OpenRCT2 context for persistence tests
global.context = {
  getParkStorage: () => ({
    data: {},
    get: function(key, defaultValue) {
      return this.data[key] !== undefined ? this.data[key] : defaultValue;
    },
    set: function(key, value) {
      this.data[key] = value;
    }
  })
};

// Mock OpenRCT2 globals for unit tests
// These will be properly mocked in individual test files using openrct2-mocks
