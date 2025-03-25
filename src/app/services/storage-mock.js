// Mock para o serviu00e7o de armazenamento do Firebase

const StorageMock = {
  ref: (path) => ({
    putFile: (filePath) => Promise.resolve({
      downloadURL: 'https://exemplo.com/imagem-mock.jpg',
      metadata: {
        fullPath: path,
        name: path.split('/').pop()
      }
    }),
    getDownloadURL: () => Promise.resolve('https://exemplo.com/imagem-mock.jpg'),
    delete: () => Promise.resolve()
  })
};

export default StorageMock;
