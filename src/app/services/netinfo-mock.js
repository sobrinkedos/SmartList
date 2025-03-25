// Mock para o NetInfo

const NetInfoMock = {
  addEventListener: (event, callback) => {
    // Simular conexão sempre disponível
    if (event === 'connectionChange') {
      callback({ isConnected: true, type: 'wifi' });
    }
    return () => {}; // Função para remover o listener
  },
  fetch: () => Promise.resolve({ isConnected: true, type: 'wifi' }),
  isConnected: {
    addEventListener: (event, callback) => {
      callback(true);
      return () => {};
    },
    fetch: () => Promise.resolve(true)
  }
};

export default NetInfoMock;
