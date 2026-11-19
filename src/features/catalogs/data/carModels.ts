import type { CarModel } from '../types';

/**
 * Modelos (Marca → Modelos) del mercado colombiano. Catálogo local de prueba:
 * debe verificarse con fuentes oficiales antes de publicar. Las marcas sin
 * modelos aquí muestran "Información no disponible" y la opción "Otro modelo".
 *
 * `engineCc` se deja vacío: en los carros el nombre comercial casi nunca indica
 * el cilindraje y un mismo modelo se vende con varios motores (1.0, 1.3, 1.6…),
 * así que el usuario lo elige de la lista para no inventar.
 *
 * El combustible NO se guarda por modelo: varios modelos se venden en versiones
 * de gasolina, híbridas o eléctricas. Lo elige el usuario (ver capabilities.ts).
 */
export const CAR_MODELS: CarModel[] = [
  // Chevrolet
  { id: 'chevrolet-spark', brandId: 'chevrolet', name: 'Spark' },
  { id: 'chevrolet-spark-gt', brandId: 'chevrolet', name: 'Spark GT' },
  { id: 'chevrolet-sail', brandId: 'chevrolet', name: 'Sail' },
  { id: 'chevrolet-beat', brandId: 'chevrolet', name: 'Beat' },
  { id: 'chevrolet-onix', brandId: 'chevrolet', name: 'Onix' },
  { id: 'chevrolet-aveo', brandId: 'chevrolet', name: 'Aveo' },
  { id: 'chevrolet-cruze', brandId: 'chevrolet', name: 'Cruze' },
  { id: 'chevrolet-tracker', brandId: 'chevrolet', name: 'Tracker' },
  { id: 'chevrolet-captiva', brandId: 'chevrolet', name: 'Captiva' },
  { id: 'chevrolet-equinox', brandId: 'chevrolet', name: 'Equinox' },
  { id: 'chevrolet-n300', brandId: 'chevrolet', name: 'N300' },
  { id: 'chevrolet-dmax', brandId: 'chevrolet', name: 'D-Max' },
  { id: 'chevrolet-colorado', brandId: 'chevrolet', name: 'Colorado' },
  { id: 'chevrolet-corsa', brandId: 'chevrolet', name: 'Corsa' },
  { id: 'chevrolet-optra', brandId: 'chevrolet', name: 'Optra' },
  { id: 'chevrolet-joy', brandId: 'chevrolet', name: 'Joy' },
  { id: 'chevrolet-groove', brandId: 'chevrolet', name: 'Groove' },
  { id: 'chevrolet-montana', brandId: 'chevrolet', name: 'Montana' },
  { id: 'chevrolet-trailblazer', brandId: 'chevrolet', name: 'Trailblazer' },

  // Renault
  { id: 'renault-kwid', brandId: 'renault', name: 'Kwid' },
  { id: 'renault-kwid-e-tech', brandId: 'renault', name: 'Kwid E-Tech' },
  { id: 'renault-megane-e-tech', brandId: 'renault', name: 'Megane E-Tech' },
  { id: 'renault-twingo', brandId: 'renault', name: 'Twingo' },
  { id: 'renault-clio', brandId: 'renault', name: 'Clio' },
  { id: 'renault-logan', brandId: 'renault', name: 'Logan' },
  { id: 'renault-sandero', brandId: 'renault', name: 'Sandero' },
  { id: 'renault-stepway', brandId: 'renault', name: 'Stepway' },
  { id: 'renault-symbol', brandId: 'renault', name: 'Symbol' },
  { id: 'renault-duster', brandId: 'renault', name: 'Duster' },
  { id: 'renault-captur', brandId: 'renault', name: 'Captur' },
  { id: 'renault-koleos', brandId: 'renault', name: 'Koleos' },
  { id: 'renault-oroch', brandId: 'renault', name: 'Oroch' },
  { id: 'renault-kangoo', brandId: 'renault', name: 'Kangoo' },
  { id: 'renault-kardian', brandId: 'renault', name: 'Kardian' },
  { id: 'renault-arkana', brandId: 'renault', name: 'Arkana' },
  { id: 'renault-megane', brandId: 'renault', name: 'Megane' },
  { id: 'renault-fluence', brandId: 'renault', name: 'Fluence' },

  // Mazda
  { id: 'mazda-2', brandId: 'mazda', name: 'Mazda 2' },
  { id: 'mazda-3', brandId: 'mazda', name: 'Mazda 3' },
  { id: 'mazda-6', brandId: 'mazda', name: 'Mazda 6' },
  { id: 'mazda-cx-3', brandId: 'mazda', name: 'CX-3' },
  { id: 'mazda-cx-30', brandId: 'mazda', name: 'CX-30' },
  { id: 'mazda-cx-5', brandId: 'mazda', name: 'CX-5' },
  { id: 'mazda-cx-50', brandId: 'mazda', name: 'CX-50' },
  { id: 'mazda-cx-9', brandId: 'mazda', name: 'CX-9' },
  { id: 'mazda-bt-50', brandId: 'mazda', name: 'BT-50' },
  { id: 'mazda-allegro', brandId: 'mazda', name: 'Allegro' },

  // Kia
  { id: 'kia-picanto', brandId: 'kia', name: 'Picanto' },
  { id: 'kia-rio', brandId: 'kia', name: 'Rio' },
  { id: 'kia-soluto', brandId: 'kia', name: 'Soluto' },
  { id: 'kia-cerato', brandId: 'kia', name: 'Cerato' },
  { id: 'kia-k3', brandId: 'kia', name: 'K3' },
  { id: 'kia-sonet', brandId: 'kia', name: 'Sonet' },
  { id: 'kia-stonic', brandId: 'kia', name: 'Stonic' },
  { id: 'kia-seltos', brandId: 'kia', name: 'Seltos' },
  { id: 'kia-sportage', brandId: 'kia', name: 'Sportage' },
  { id: 'kia-sorento', brandId: 'kia', name: 'Sorento' },
  { id: 'kia-niro', brandId: 'kia', name: 'Niro' },
  { id: 'kia-carnival', brandId: 'kia', name: 'Carnival' },
  { id: 'kia-ev6', brandId: 'kia', name: 'EV6' },

  // Toyota
  { id: 'toyota-yaris', brandId: 'toyota', name: 'Yaris' },
  { id: 'toyota-corolla', brandId: 'toyota', name: 'Corolla' },
  { id: 'toyota-corolla-cross', brandId: 'toyota', name: 'Corolla Cross' },
  { id: 'toyota-rav4', brandId: 'toyota', name: 'RAV4' },
  { id: 'toyota-fortuner', brandId: 'toyota', name: 'Fortuner' },
  { id: 'toyota-prado', brandId: 'toyota', name: 'Land Cruiser Prado' },
  { id: 'toyota-hilux', brandId: 'toyota', name: 'Hilux' },
  { id: 'toyota-camry', brandId: 'toyota', name: 'Camry' },
  { id: 'toyota-prius', brandId: 'toyota', name: 'Prius' },
  { id: 'toyota-c-hr', brandId: 'toyota', name: 'C-HR' },
  { id: 'toyota-4runner', brandId: 'toyota', name: '4Runner' },

  // Nissan
  { id: 'nissan-march', brandId: 'nissan', name: 'March' },
  { id: 'nissan-versa', brandId: 'nissan', name: 'Versa' },
  { id: 'nissan-sentra', brandId: 'nissan', name: 'Sentra' },
  { id: 'nissan-kicks', brandId: 'nissan', name: 'Kicks' },
  { id: 'nissan-qashqai', brandId: 'nissan', name: 'Qashqai' },
  { id: 'nissan-x-trail', brandId: 'nissan', name: 'X-Trail' },
  { id: 'nissan-frontier', brandId: 'nissan', name: 'Frontier' },
  { id: 'nissan-tiida', brandId: 'nissan', name: 'Tiida' },
  { id: 'nissan-note', brandId: 'nissan', name: 'Note' },
  { id: 'nissan-murano', brandId: 'nissan', name: 'Murano' },
  { id: 'nissan-leaf', brandId: 'nissan', name: 'Leaf' },

  // Hyundai
  { id: 'hyundai-i10', brandId: 'hyundai', name: 'Grand i10' },
  { id: 'hyundai-accent', brandId: 'hyundai', name: 'Accent' },
  { id: 'hyundai-elantra', brandId: 'hyundai', name: 'Elantra' },
  { id: 'hyundai-venue', brandId: 'hyundai', name: 'Venue' },
  { id: 'hyundai-creta', brandId: 'hyundai', name: 'Creta' },
  { id: 'hyundai-tucson', brandId: 'hyundai', name: 'Tucson' },
  { id: 'hyundai-santa-fe', brandId: 'hyundai', name: 'Santa Fe' },
  { id: 'hyundai-atos', brandId: 'hyundai', name: 'Atos' },
  { id: 'hyundai-kona', brandId: 'hyundai', name: 'Kona' },
  { id: 'hyundai-ioniq-5', brandId: 'hyundai', name: 'Ioniq 5' },

  // Volkswagen
  { id: 'volkswagen-gol', brandId: 'volkswagen', name: 'Gol' },
  { id: 'volkswagen-voyage', brandId: 'volkswagen', name: 'Voyage' },
  { id: 'volkswagen-polo', brandId: 'volkswagen', name: 'Polo' },
  { id: 'volkswagen-virtus', brandId: 'volkswagen', name: 'Virtus' },
  { id: 'volkswagen-jetta', brandId: 'volkswagen', name: 'Jetta' },
  { id: 'volkswagen-t-cross', brandId: 'volkswagen', name: 'T-Cross' },
  { id: 'volkswagen-nivus', brandId: 'volkswagen', name: 'Nivus' },
  { id: 'volkswagen-taos', brandId: 'volkswagen', name: 'Taos' },
  { id: 'volkswagen-tiguan', brandId: 'volkswagen', name: 'Tiguan' },
  { id: 'volkswagen-amarok', brandId: 'volkswagen', name: 'Amarok' },
  { id: 'volkswagen-up', brandId: 'volkswagen', name: 'Up!' },
  { id: 'volkswagen-fox', brandId: 'volkswagen', name: 'Fox' },
  { id: 'volkswagen-crossfox', brandId: 'volkswagen', name: 'CrossFox' },
  { id: 'volkswagen-golf', brandId: 'volkswagen', name: 'Golf' },

  // Suzuki
  { id: 'suzuki-alto', brandId: 'suzuki', name: 'Alto' },
  { id: 'suzuki-celerio', brandId: 'suzuki', name: 'Celerio' },
  { id: 'suzuki-swift', brandId: 'suzuki', name: 'Swift' },
  { id: 'suzuki-dzire', brandId: 'suzuki', name: 'Dzire' },
  { id: 'suzuki-baleno', brandId: 'suzuki', name: 'Baleno' },
  { id: 'suzuki-ignis', brandId: 'suzuki', name: 'Ignis' },
  { id: 'suzuki-s-cross', brandId: 'suzuki', name: 'S-Cross' },
  { id: 'suzuki-vitara', brandId: 'suzuki', name: 'Vitara' },
  { id: 'suzuki-jimny', brandId: 'suzuki', name: 'Jimny' },
  { id: 'suzuki-sx4', brandId: 'suzuki', name: 'SX4' },
  { id: 'suzuki-grand-vitara', brandId: 'suzuki', name: 'Grand Vitara' },

  // Ford
  { id: 'ford-fiesta', brandId: 'ford', name: 'Fiesta' },
  { id: 'ford-ecosport', brandId: 'ford', name: 'EcoSport' },
  { id: 'ford-escape', brandId: 'ford', name: 'Escape' },
  { id: 'ford-territory', brandId: 'ford', name: 'Territory' },
  { id: 'ford-explorer', brandId: 'ford', name: 'Explorer' },
  { id: 'ford-ranger', brandId: 'ford', name: 'Ranger' },
  { id: 'ford-focus', brandId: 'ford', name: 'Focus' },
  { id: 'ford-fusion', brandId: 'ford', name: 'Fusion' },
  { id: 'ford-bronco-sport', brandId: 'ford', name: 'Bronco Sport' },

  // Mitsubishi
  { id: 'mitsubishi-mirage', brandId: 'mitsubishi', name: 'Mirage' },
  { id: 'mitsubishi-asx', brandId: 'mitsubishi', name: 'ASX' },
  { id: 'mitsubishi-outlander', brandId: 'mitsubishi', name: 'Outlander' },
  { id: 'mitsubishi-montero-sport', brandId: 'mitsubishi', name: 'Montero Sport' },
  { id: 'mitsubishi-l200', brandId: 'mitsubishi', name: 'L200' },
  { id: 'mitsubishi-lancer', brandId: 'mitsubishi', name: 'Lancer' },
  { id: 'mitsubishi-xpander', brandId: 'mitsubishi', name: 'Xpander' },
  { id: 'mitsubishi-eclipse-cross', brandId: 'mitsubishi', name: 'Eclipse Cross' },

  // Honda
  { id: 'honda-city', brandId: 'honda', name: 'City' },
  { id: 'honda-civic', brandId: 'honda', name: 'Civic' },
  { id: 'honda-hr-v', brandId: 'honda', name: 'HR-V' },
  { id: 'honda-cr-v', brandId: 'honda', name: 'CR-V' },
  { id: 'honda-fit', brandId: 'honda', name: 'Fit' },
  { id: 'honda-wr-v', brandId: 'honda', name: 'WR-V' },
  { id: 'honda-pilot', brandId: 'honda', name: 'Pilot' },

  // Jeep
  { id: 'jeep-renegade', brandId: 'jeep', name: 'Renegade' },
  { id: 'jeep-compass', brandId: 'jeep', name: 'Compass' },
  { id: 'jeep-wrangler', brandId: 'jeep', name: 'Wrangler' },
  { id: 'jeep-grand-cherokee', brandId: 'jeep', name: 'Grand Cherokee' },

  // Peugeot
  { id: 'peugeot-208', brandId: 'peugeot', name: '208' },
  { id: 'peugeot-2008', brandId: 'peugeot', name: '2008' },
  { id: 'peugeot-3008', brandId: 'peugeot', name: '3008' },
  { id: 'peugeot-5008', brandId: 'peugeot', name: '5008' },
  { id: 'peugeot-206', brandId: 'peugeot', name: '206' },
  { id: 'peugeot-207', brandId: 'peugeot', name: '207' },
  { id: 'peugeot-301', brandId: 'peugeot', name: '301' },
  { id: 'peugeot-308', brandId: 'peugeot', name: '308' },

  // Citroën
  { id: 'citroen-c3', brandId: 'citroen', name: 'C3' },
  { id: 'citroen-c4-cactus', brandId: 'citroen', name: 'C4 Cactus' },
  { id: 'citroen-c5-aircross', brandId: 'citroen', name: 'C5 Aircross' },

  // Fiat
  { id: 'fiat-mobi', brandId: 'fiat', name: 'Mobi' },
  { id: 'fiat-argo', brandId: 'fiat', name: 'Argo' },
  { id: 'fiat-cronos', brandId: 'fiat', name: 'Cronos' },
  { id: 'fiat-pulse', brandId: 'fiat', name: 'Pulse' },
  { id: 'fiat-strada', brandId: 'fiat', name: 'Strada' },
  { id: 'fiat-uno', brandId: 'fiat', name: 'Uno' },
  { id: 'fiat-palio', brandId: 'fiat', name: 'Palio' },
  { id: 'fiat-fastback', brandId: 'fiat', name: 'Fastback' },

  // Subaru
  { id: 'subaru-impreza', brandId: 'subaru', name: 'Impreza' },
  { id: 'subaru-xv', brandId: 'subaru', name: 'XV / Crosstrek' },
  { id: 'subaru-forester', brandId: 'subaru', name: 'Forester' },
  { id: 'subaru-outback', brandId: 'subaru', name: 'Outback' },

  // BYD
  { id: 'byd-dolphin', brandId: 'byd', name: 'Dolphin' },
  { id: 'byd-dolphin-mini', brandId: 'byd', name: 'Dolphin Mini' },
  { id: 'byd-yuan-plus', brandId: 'byd', name: 'Yuan Plus' },
  { id: 'byd-seal', brandId: 'byd', name: 'Seal' },
  { id: 'byd-song-plus-dmi', brandId: 'byd', name: 'Song Plus DM-i' },
  { id: 'byd-song-pro-dmi', brandId: 'byd', name: 'Song Pro DM-i' },
  { id: 'byd-king-dmi', brandId: 'byd', name: 'King DM-i' },
  { id: 'byd-han', brandId: 'byd', name: 'Han' },
  { id: 'byd-shark', brandId: 'byd', name: 'Shark' },

  // Chery
  { id: 'chery-tiggo-2', brandId: 'chery', name: 'Tiggo 2' },
  { id: 'chery-tiggo-4', brandId: 'chery', name: 'Tiggo 4' },
  { id: 'chery-tiggo-7', brandId: 'chery', name: 'Tiggo 7' },
  { id: 'chery-tiggo-8', brandId: 'chery', name: 'Tiggo 8' },
  { id: 'chery-qq', brandId: 'chery', name: 'QQ' },
  { id: 'chery-arrizo-5', brandId: 'chery', name: 'Arrizo 5' },
  { id: 'chery-tiggo-3', brandId: 'chery', name: 'Tiggo 3' },

  // JAC
  { id: 'jac-js2', brandId: 'jac', name: 'JS2' },
  { id: 'jac-js4', brandId: 'jac', name: 'JS4' },
  { id: 'jac-js8', brandId: 'jac', name: 'JS8' },
  { id: 'jac-t8', brandId: 'jac', name: 'T8' },
  { id: 'jac-js2-pro', brandId: 'jac', name: 'JS2 Pro' },
  { id: 'jac-js3', brandId: 'jac', name: 'JS3' },
  { id: 'jac-e10x', brandId: 'jac', name: 'E10X' },
  { id: 'jac-e30x', brandId: 'jac', name: 'E30X' },
  { id: 'jac-e-j7', brandId: 'jac', name: 'E-J7' },

  // MG
  { id: 'mg-zs', brandId: 'mg', name: 'ZS' },
  { id: 'mg-mg5', brandId: 'mg', name: 'MG5' },
  { id: 'mg-hs', brandId: 'mg', name: 'HS' },
  { id: 'mg-mg3', brandId: 'mg', name: 'MG3' },
  { id: 'mg-zs-ev', brandId: 'mg', name: 'ZS EV' },

  // GWM
  { id: 'gwm-jolion', brandId: 'gwm', name: 'Haval Jolion' },
  { id: 'gwm-h6', brandId: 'gwm', name: 'Haval H6' },
  { id: 'gwm-poer', brandId: 'gwm', name: 'Poer' },
  { id: 'gwm-ora-03', brandId: 'gwm', name: 'Ora 03' },
  { id: 'gwm-wingle', brandId: 'gwm', name: 'Wingle' },
  { id: 'gwm-tank-300', brandId: 'gwm', name: 'Tank 300' },

  // Changan
  { id: 'changan-cs15', brandId: 'changan', name: 'CS15' },
  { id: 'changan-cs35-plus', brandId: 'changan', name: 'CS35 Plus' },
  { id: 'changan-cs55-plus', brandId: 'changan', name: 'CS55 Plus' },
  { id: 'changan-hunter', brandId: 'changan', name: 'Hunter' },
  { id: 'changan-alsvin', brandId: 'changan', name: 'Alsvin' },

  // DFSK
  { id: 'dfsk-glory-500', brandId: 'dfsk', name: 'Glory 500' },
  { id: 'dfsk-glory-580', brandId: 'dfsk', name: 'Glory 580' },
  { id: 'dfsk-c31', brandId: 'dfsk', name: 'C31' },

  // Mercedes-Benz
  { id: 'mercedes-benz-clase-a', brandId: 'mercedes-benz', name: 'Clase A' },
  { id: 'mercedes-benz-clase-c', brandId: 'mercedes-benz', name: 'Clase C' },
  { id: 'mercedes-benz-gla', brandId: 'mercedes-benz', name: 'GLA' },
  { id: 'mercedes-benz-glc', brandId: 'mercedes-benz', name: 'GLC' },

  // BMW
  { id: 'bmw-serie-1', brandId: 'bmw', name: 'Serie 1' },
  { id: 'bmw-serie-3', brandId: 'bmw', name: 'Serie 3' },
  { id: 'bmw-x1', brandId: 'bmw', name: 'X1' },
  { id: 'bmw-x3', brandId: 'bmw', name: 'X3' },

  // Audi
  { id: 'audi-a3', brandId: 'audi', name: 'A3' },
  { id: 'audi-a4', brandId: 'audi', name: 'A4' },
  { id: 'audi-q3', brandId: 'audi', name: 'Q3' },
  { id: 'audi-q5', brandId: 'audi', name: 'Q5' },

  // Volvo
  { id: 'volvo-ex30', brandId: 'volvo', name: 'EX30' },
  { id: 'volvo-xc40', brandId: 'volvo', name: 'XC40' },
  { id: 'volvo-xc60', brandId: 'volvo', name: 'XC60' },
  { id: 'volvo-xc90', brandId: 'volvo', name: 'XC90' },

  // Foton
  { id: 'foton-tunland', brandId: 'foton', name: 'Tunland' },
  { id: 'foton-view', brandId: 'foton', name: 'View' },

  // Brilliance
  { id: 'brilliance-v3', brandId: 'brilliance', name: 'V3' },
  { id: 'brilliance-v5', brandId: 'brilliance', name: 'V5' },
  { id: 'brilliance-v6', brandId: 'brilliance', name: 'V6' },

  // Daewoo
  { id: 'daewoo-tico', brandId: 'daewoo', name: 'Tico' },
  { id: 'daewoo-matiz', brandId: 'daewoo', name: 'Matiz' },
  { id: 'daewoo-lanos', brandId: 'daewoo', name: 'Lanos' },
  { id: 'daewoo-cielo', brandId: 'daewoo', name: 'Cielo' },
  { id: 'daewoo-racer', brandId: 'daewoo', name: 'Racer' },
  { id: 'daewoo-nubira', brandId: 'daewoo', name: 'Nubira' },

  // Geely
  { id: 'geely-coolray', brandId: 'geely', name: 'Coolray' },
  { id: 'geely-emgrand', brandId: 'geely', name: 'Emgrand' },

  // SsangYong (KGM)
  { id: 'ssangyong-tivoli', brandId: 'ssangyong', name: 'Tivoli' },
  { id: 'ssangyong-korando', brandId: 'ssangyong', name: 'Korando' },
  { id: 'ssangyong-rexton', brandId: 'ssangyong', name: 'Rexton' },
  { id: 'ssangyong-musso', brandId: 'ssangyong', name: 'Musso' },
  { id: 'ssangyong-actyon', brandId: 'ssangyong', name: 'Actyon' },

  // Škoda
  { id: 'skoda-fabia', brandId: 'skoda', name: 'Fabia' },
  { id: 'skoda-octavia', brandId: 'skoda', name: 'Octavia' },

  // Dodge
  { id: 'dodge-attitude', brandId: 'dodge', name: 'Attitude' },
  { id: 'dodge-journey', brandId: 'dodge', name: 'Journey' },

  // RAM
  { id: 'ram-700', brandId: 'ram', name: '700' },
  { id: 'ram-1500', brandId: 'ram', name: '1500' },

  // JMC
  { id: 'jmc-vigus', brandId: 'jmc', name: 'Vigus' },

  // Lifan
  { id: 'lifan-520', brandId: 'lifan', name: '520' },
  { id: 'lifan-x60', brandId: 'lifan', name: 'X60' },

  // Land Rover
  { id: 'land-rover-defender', brandId: 'land-rover', name: 'Defender' },
  { id: 'land-rover-discovery-sport', brandId: 'land-rover', name: 'Discovery Sport' },
  { id: 'land-rover-range-rover-evoque', brandId: 'land-rover', name: 'Range Rover Evoque' },
  { id: 'land-rover-range-rover', brandId: 'land-rover', name: 'Range Rover' },

  // MINI
  { id: 'mini-cooper', brandId: 'mini', name: 'Cooper' },
  { id: 'mini-countryman', brandId: 'mini', name: 'Countryman' },

  // Lexus
  { id: 'lexus-ux', brandId: 'lexus', name: 'UX' },
  { id: 'lexus-nx', brandId: 'lexus', name: 'NX' },
  { id: 'lexus-rx', brandId: 'lexus', name: 'RX' },

  // Porsche
  { id: 'porsche-macan', brandId: 'porsche', name: 'Macan' },
  { id: 'porsche-cayenne', brandId: 'porsche', name: 'Cayenne' },
  { id: 'porsche-911', brandId: 'porsche', name: '911' },
];
