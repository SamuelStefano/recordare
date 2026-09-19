import { srcSetFor } from './image';

describe('srcSetFor', () => {
  it('oferece larguras menores que a original, sem passar dela', () => {
    const set = srcSetFor('https://host.test/foto.jpg?width=700');
    expect(set).toBe(
      'https://host.test/foto.jpg?width=320 320w, ' +
        'https://host.test/foto.jpg?width=640 640w, ' +
        'https://host.test/foto.jpg?width=700 700w'
    );
  });

  it('não duplica quando a original já é uma das larguras', () => {
    expect(srcSetFor('https://host.test/foto.jpg?width=640')).toBe(
      'https://host.test/foto.jpg?width=320 320w, https://host.test/foto.jpg?width=640 640w'
    );
  });

  // Foto real da peça não vai ter `?width=`: pedir outra largura devolveria 404 e a peça abriria
  // sem imagem nenhuma.
  it('cala quando a URL não aceita largura', () => {
    expect(srcSetFor('https://host.test/foto.jpg')).toBeUndefined();
    expect(srcSetFor('https://host.test/foto.jpg?width=zero')).toBeUndefined();
    expect(srcSetFor('/local.jpg')).toBeUndefined();
  });
});
