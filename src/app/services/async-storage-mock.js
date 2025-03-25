// Mock para o AsyncStorage

const storage = {};

const AsyncStorageMock = {
  setItem: async (key, value) => {
    storage[key] = value;
    return Promise.resolve();
  },
  getItem: async (key) => {
    return Promise.resolve(storage[key] || null);
  },
  removeItem: async (key) => {
    delete storage[key];
    return Promise.resolve();
  },
  clear: async () => {
    Object.keys(storage).forEach(key => {
      delete storage[key];
    });
    return Promise.resolve();
  },
  getAllKeys: async () => {
    return Promise.resolve(Object.keys(storage));
  },
  multiGet: async (keys) => {
    const results = keys.map(key => [key, storage[key] || null]);
    return Promise.resolve(results);
  },
  multiSet: async (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      storage[key] = value;
    });
    return Promise.resolve();
  },
  multiRemove: async (keys) => {
    keys.forEach(key => {
      delete storage[key];
    });
    return Promise.resolve();
  }
};

export default AsyncStorageMock;
