import { useState } from 'react';

import { pickFromGallery, takePhoto } from '@/features/photos/pick';
import { useSettings } from '@/features/settings/SettingsProvider';
import { OptionSheet, useToast } from '@/shared/ui';

import { deleteCarPhotos, keepCarPhoto, validCarPhoto } from './carPhoto';
import { CarPhotoViewer } from './components/CarPhotoViewer';

type Action = 'camera' | 'gallery' | 'remove';

/** Recorte cuadrado: así se ve bien en los recuadros de la app. */
const PICK = { square: true, quality: 0.7 };

/**
 * Foto del carro: la que hay (undefined → se ve el ícono) y el menú para ponerla, cambiarla
 * o quitarla. Es OPCIONAL: nunca se pide. Quien lo usa dibuja `sheet`.
 */
export function useCarPhoto() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState(false);
  const photo = validCarPhoto(settings.carPhotoUri);

  const save = async (uri: string | null) => {
    if (!uri) return;
    try {
      update({ carPhotoUri: await keepCarPhoto(uri) });
      toast.show('Foto de tu carro guardada');
    } catch {
      toast.show('No se pudo guardar la foto. Intenta de nuevo.');
    }
  };

  const remove = () => {
    deleteCarPhotos();
    update({ carPhotoUri: '' });
    toast.show('Foto quitada');
  };

  const choose = (action: Action) => {
    setOpen(false);
    if (action === 'camera') void takePhoto('Para tomarle la foto a tu carro,', PICK).then(save);
    else if (action === 'gallery') void pickFromGallery(PICK).then(save);
    else remove();
  };

  // Del visor al menú: se espera a que el visor se cierre (dos ventanas a la vez fallan en Android).
  const changeFromViewer = () => {
    setViewing(false);
    setTimeout(() => setOpen(true), 300);
  };

  const sheet = (
    <>
      <OptionSheet
        visible={open}
        title={photo ? 'Foto de tu carro' : 'Foto de tu carro (opcional)'}
        options={[
          { value: 'camera', label: 'Tomar foto' },
          { value: 'gallery', label: 'Elegir de la galería' },
          ...(photo ? [{ value: 'remove', label: 'Quitar foto', description: 'Se vuelve a ver el ícono' }] : []),
        ]}
        value={null}
        onSelect={(v) => choose(v as Action)}
        onClose={() => setOpen(false)}
      />
      {photo && <CarPhotoViewer visible={viewing} uri={photo} onClose={() => setViewing(false)} onChange={changeFromViewer} />}
    </>
  );

  return {
    photo,
    openMenu: () => setOpen(true),
    /** Tocar la foto: con foto se ve en grande; sin foto, el menú para ponerla. */
    onPhotoPress: () => (photo ? setViewing(true) : setOpen(true)),
    sheet,
  };
}
