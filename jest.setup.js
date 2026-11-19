/* global jest */
// AsyncStorage es un módulo nativo: en las pruebas se usa su mock oficial (en memoria).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
