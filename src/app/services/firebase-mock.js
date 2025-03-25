// Mock para o Firebase

const authMock = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    callback(null);
    return () => {};
  },
  signInWithEmailAndPassword: (email, password) => {
    return Promise.resolve({
      user: {
        uid: 'mock-user-id',
        email: email,
        displayName: 'Usuu00e1rio Teste',
        photoURL: 'https://exemplo.com/foto-perfil.jpg'
      }
    });
  },
  createUserWithEmailAndPassword: (email, password) => {
    return Promise.resolve({
      user: {
        uid: 'mock-user-id',
        email: email,
        displayName: '',
        photoURL: ''
      }
    });
  },
  signOut: () => Promise.resolve(),
  sendPasswordResetEmail: (email) => Promise.resolve()
};

const firestoreMock = {
  collection: (path) => ({
    doc: (id) => ({
      get: () => Promise.resolve({
        exists: false,
        data: () => null,
        id: id
      }),
      set: (data) => Promise.resolve(),
      update: (data) => Promise.resolve(),
      delete: () => Promise.resolve(),
      onSnapshot: (callback) => {
        callback({
          exists: false,
          data: () => null,
          id: id
        });
        return () => {};
      }
    }),
    add: (data) => Promise.resolve({
      id: 'mock-doc-id'
    }),
    where: () => ({
      get: () => Promise.resolve({
        docs: [],
        empty: true
      }),
      onSnapshot: (callback) => {
        callback({
          docs: [],
          empty: true
        });
        return () => {};
      }
    })
  })
};

const firebaseMock = {
  apps: [],
  initializeApp: () => ({
    name: '[DEFAULT]'
  }),
  app: () => ({
    name: '[DEFAULT]'
  })
};

export const getAuth = () => authMock;
export const getFirestore = () => firestoreMock;
export const getFirebase = () => firebaseMock;

export default firebaseMock;
