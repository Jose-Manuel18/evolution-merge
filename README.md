<img src="icons/icon-192.png" width="64" height="64" alt="">

# Evolución Cósmica

Juego web 2D de soltar y fusionar. Dos cuerpos iguales se juntan y evolucionan:
polvo cósmico → asteroide → luna → Mercurio → Marte → Venus → Tierra → Neptuno → Saturno → Júpiter → Sol → sistema solar.
Dos sistemas solares crean una galaxia (+1000).

Se instala como PWA y funciona sin internet.

## Jugar en local

```sh
python3 -m http.server 8123   # luego abre http://localhost:8123
```

Necesita un servidor (no `file://`) para que los planetas se vean como esferas y para la PWA.

## Prueba

```sh
node smoke.mjs   # con el servidor encendido; juega solo en Chrome headless y guarda capturas en /tmp
```

## Créditos

- Texturas de planetas: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0), basadas en datos de la NASA.
- Física: [Matter.js](https://brm.io/matter-js/) (MIT), en `vendor/`.
