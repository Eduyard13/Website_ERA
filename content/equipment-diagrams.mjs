import {schemeReading} from './equipment-reading.mjs';
const labels=new Map(schemeReading['predvaritelnyy-izmelchitel'].parts);
const data={
  "slug": "predvaritelnyy-izmelchitel",
  "defaultPart": 3,
  "views": [
    {
      "id": "open",
      "label": "Рабочая зона",
      "file": "diagrams/predvaritelnyy-izmelchitel/open.webp",
      "width": 763,
      "height": 770
    },
    {
      "id": "closed",
      "label": "В сборе",
      "file": "diagrams/predvaritelnyy-izmelchitel/closed.webp",
      "width": 732,
      "height": 835
    }
  ],
  "parts": [
    {
      "number": 1,
      "view": "closed",
      "pin": [
        750,
        80
      ],
      "targets": [
        [
          504.4,
          272.9
        ]
      ],
      "description": "Через бункер материал поступает на ротор."
    },
    {
      "number": 2,
      "view": "closed",
      "pin": [
        150,
        130
      ],
      "targets": [
        [
          501.8,
          495.4
        ]
      ],
      "description": "Корпус объединяет рабочие элементы измельчителя."
    },
    {
      "number": 3,
      "view": "open",
      "pin": [
        440,
        70
      ],
      "targets": [
        [
          548.5,
          316.8
        ]
      ],
      "description": "Ротор с режущим инструментом увлекает материал к щеке."
    },
    {
      "number": 4,
      "view": "open",
      "pin": [
        650,
        90
      ],
      "targets": [
        [
          583.1,
          478.3
        ]
      ],
      "description": "Ножи щеки и ротора формируют рабочий зазор для измельчения."
    },
    {
      "number": 5,
      "view": "closed",
      "pin": [
        925,
        650
      ],
      "targets": [
        [
          736.6,
          564.5
        ]
      ],
      "description": "Электродвигатель в составе привода ротора."
    },
    {
      "number": 6,
      "view": "open",
      "pin": [
        80,
        760
      ],
      "targets": [
        [
          285.2,
          524.4
        ]
      ],
      "description": "Ременная передача в составе привода ротора."
    },
    {
      "number": 7,
      "view": "open",
      "pin": [
        55,
        470
      ],
      "targets": [
        [
          180.5,
          467.7
        ],
        [
          356.3,
          518.6
        ]
      ],
      "description": "Защитные кожухи ременной передачи."
    },
    {
      "number": 8,
      "view": "open",
      "pin": [
        80,
        220
      ],
      "targets": [
        [
          420.7,
          482.1
        ]
      ],
      "description": "Редуктор в составе привода ротора."
    },
    {
      "number": 9,
      "view": "open",
      "pin": [
        920,
        330
      ],
      "targets": [
        [
          683.1,
          409.1
        ]
      ],
      "description": "Основной подъёмник открывает щеку для доступа к ножам."
    },
    {
      "number": 10,
      "view": "open",
      "pin": [
        245,
        105
      ],
      "targets": [
        [
          424.6,
          320.7
        ]
      ],
      "description": "Гребень в рабочей зоне ротора."
    },
    {
      "number": 11,
      "view": "open",
      "pin": [
        300,
        935
      ],
      "targets": [
        [
          525.5,
          588.8
        ]
      ],
      "description": "Относительно упора поворачивается щека при регулировке зазора."
    },
    {
      "number": 12,
      "view": "open",
      "pin": [
        920,
        810
      ],
      "targets": [
        [
          612.0,
          573.4
        ],
        [
          787.8,
          499.4
        ]
      ],
      "description": "Вспомогательные подъёмники поворачивают щеку и меняют рабочий зазор."
    }
  ]
};
export const equipmentDiagrams={'predvaritelnyy-izmelchitel':{...data,parts:data.parts.map(p=>({...p,label:labels.get(p.number)}))}};
