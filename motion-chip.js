/* A conceptual onboard compute sculpture. All geometry is generated locally. */
(() => {
  'use strict';
  if (!window.SFRMotion) return;

  window.SFRMotion.register({
    slideId: 'slide-6',
    host: '.onboard-animation',
    label: 'A compact chip assembles above a circuit board as light moves through its circuits.',
    build(THREE, width, height) {
      const scene = new THREE.Scene();
      const aspect = width / height;
      const camera = new THREE.OrthographicCamera(-4.4 * aspect, 4.4 * aspect, 4.4, -4.4, 0.1, 60);
      camera.position.set(7.6, 8.8, 10.5);
      camera.lookAt(0, 0.45, 0);

      scene.add(new THREE.HemisphereLight(0xf9fcff, 0x506181, 2.5));
      const key = new THREE.DirectionalLight(0xffffff, 5.2);
      key.position.set(-3, 8, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x879fff, 3.0);
      rim.position.set(5, 2, -5);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0xffffff, 2.0);
      fill.position.set(-5, 1, -2);
      scene.add(fill);

      const assembly = new THREE.Group();
      assembly.rotation.y = -0.17;
      scene.add(assembly);

      const materials = {
        board: new THREE.MeshStandardMaterial({ color: 0xb9c6d8, metalness: 0.48, roughness: 0.36 }),
        edge: new THREE.MeshStandardMaterial({ color: 0x536884, metalness: 0.62, roughness: 0.34 }),
        silver: new THREE.MeshStandardMaterial({ color: 0xdce5ef, metalness: 0.68, roughness: 0.25 }),
        dark: new THREE.MeshStandardMaterial({ color: 0x14213b, metalness: 0.42, roughness: 0.3 }),
        cap: new THREE.MeshPhysicalMaterial({ color: 0x233f7a, metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.2 }),
        blue: new THREE.MeshStandardMaterial({ color: 0x6e8cff, emissive: 0x344de3, emissiveIntensity: 1.4, metalness: 0.32, roughness: 0.3 }),
        dot: new THREE.MeshBasicMaterial({ color: 0x9cb7ff }),
      };
      const box = (w, h, d, material, parent, y) => {
        const item = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        item.position.y = y || 0;
        parent.add(item);
        return item;
      };
      const outline = (w, d, y, color, opacity, parent = assembly) => {
        const vectors = [[-w / 2, y, -d / 2], [w / 2, y, -d / 2], [w / 2, y, d / 2], [-w / 2, y, d / 2], [-w / 2, y, -d / 2]].map(p => new THREE.Vector3(...p));
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vectors), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
        parent.add(line);
        return line;
      };

      // A drawn soft shadow avoids a renderer-specific shadow-map dependency.
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const shadowContext = shadowCanvas.getContext('2d');
      const shadowGradient = shadowContext.createRadialGradient(64, 64, 6, 64, 64, 63);
      shadowGradient.addColorStop(0, 'rgba(46,61,99,0.29)');
      shadowGradient.addColorStop(0.55, 'rgba(46,61,99,0.16)');
      shadowGradient.addColorStop(1, 'rgba(46,61,99,0)');
      shadowContext.fillStyle = shadowGradient;
      shadowContext.fillRect(0, 0, 128, 128);
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -0.85;
      assembly.add(shadow);

      box(5.65, 0.11, 5.65, materials.edge, assembly, -0.22);
      box(5.72, 0.075, 5.72, materials.board, assembly, -0.13);
      outline(5.5, 5.5, -0.088, 0xe7efff, 0.7);
      outline(5.2, 5.2, -0.087, 0x788eac, 0.65);
      outline(3.65, 3.65, -0.083, 0x7893c5, 0.7);
      outline(3.91, 3.91, -0.082, 0xa1b3cf, 0.7);

      const pads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.023, 0.075), materials.silver, 128);
      const padTransform = new THREE.Object3D();
      let padIndex = 0;
      for (let edge = 0; edge < 4; edge += 1) {
        for (let n = 0; n < 32; n += 1) {
          const pos = -2.5 + n * 5 / 31;
          padTransform.position.set(edge < 2 ? pos : (edge === 2 ? -2.61 : 2.61), -0.075, edge < 2 ? (edge === 0 ? -2.61 : 2.61) : pos);
          padTransform.updateMatrix();
          pads.setMatrixAt(padIndex++, padTransform.matrix);
        }
      }
      assembly.add(pads);

      const traces = [];
      const sparkGeometry = new THREE.SphereGeometry(0.035, 6, 6);
      const trailGeometry = new THREE.SphereGeometry(0.018, 5, 5);
      const blueLine = new THREE.LineBasicMaterial({ color: 0x6b82ae, transparent: true, opacity: 0.7 });
      const rotate = (x, z, side) => {
        const angle = side * Math.PI / 2;
        return new THREE.Vector3(x * Math.cos(angle) - z * Math.sin(angle), -0.071, x * Math.sin(angle) + z * Math.cos(angle));
      };
      for (let side = 0; side < 4; side += 1) {
        for (let n = 0; n < 10; n += 1) {
          const x = (n - 4.5) * 0.19;
          const points = [rotate(x, 1.24, side), rotate(x, 1.65 + Math.abs(n - 4.5) * 0.06, side), rotate(x * 1.65, 2.17, side), rotate(x * 1.65, 2.58, side)];
          const path = new THREE.CurvePath();
          for (let i = 1; i < points.length; i += 1) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
          assembly.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), blueLine));
          const spark = new THREE.Mesh(sparkGeometry, materials.dot);
          assembly.add(spark);
          const tail = new THREE.Mesh(trailGeometry, materials.blue);
          assembly.add(tail);
          traces.push({ path, spark, tail, phase: side * 0.16 + n * 0.082 });
        }
      }

      const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.105, 0.13, 0.31), materials.silver, 64);
      const pinTransform = new THREE.Object3D();
      let pinIndex = 0;
      for (let side = 0; side < 4; side += 1) {
        for (let n = 0; n < 16; n += 1) {
          const angle = side * Math.PI / 2;
          const x = (n - 7.5) * 0.14;
          pinTransform.position.set(x * Math.cos(angle) - 1.29 * Math.sin(angle), 0.02, x * Math.sin(angle) + 1.29 * Math.cos(angle));
          pinTransform.rotation.y = angle;
          pinTransform.updateMatrix();
          pins.setMatrixAt(pinIndex++, pinTransform.matrix);
        }
      }
      assembly.add(pins);

      const substrate = new THREE.Group();
      assembly.add(substrate);
      box(2.66, 0.13, 2.66, materials.dark, substrate, 0);
      outline(2.6, 2.6, 0.072, 0x6a8cc8, 0.9, substrate);
      const die = new THREE.Group();
      assembly.add(die);
      box(2.31, 0.1, 2.31, materials.silver, die, 0);
      box(2.16, 0.043, 2.16, materials.blue, die, 0.063);
      const lid = new THREE.Group();
      assembly.add(lid);
      box(2.48, 0.24, 2.48, materials.cap, lid, 0);
      box(2.22, 0.035, 2.22, materials.dark, lid, 0.137);
      outline(2.45, 2.45, 0.124, 0xc6d8ff, 0.8, lid);
      outline(2.1, 2.1, 0.16, 0x708cbd, 0.9, lid);

      const cells = [];
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const material = new THREE.MeshStandardMaterial({ color: 0x6788dd, emissive: 0x2b50cc, emissiveIntensity: 0.3, metalness: 0.55, roughness: 0.22 });
          const cell = box(0.37, 0.025, 0.37, material, lid, 0.17);
          cell.position.x = (col - 1.5) * 0.46;
          cell.position.z = (row - 1.5) * 0.46;
          cells.push({ material, phase: row * 0.45 + col * 0.29 });
        }
      }

      const guides = new THREE.Group();
      assembly.add(guides);
      for (let n = 0; n < 4; n += 1) {
        const x = (n % 2 ? 1 : -1) * 1.2;
        const z = (n < 2 ? 1 : -1) * 1.2;
        const points = [new THREE.Vector3(x, 0.13, z), new THREE.Vector3(x, 2.12, z)];
        guides.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineDashedMaterial({ color: 0x6f8ed6, dashSize: 0.045, gapSize: 0.08, transparent: true, opacity: 0.3 })));
      }
      guides.children.forEach(line => line.computeLineDistances());

      const rings = [];
      for (let i = 0; i < 2; i += 1) {
        const points = [];
        for (let n = 0; n <= 110; n += 1) {
          const a = n / 110 * Math.PI * 1.72;
          points.push(new THREE.Vector3(Math.cos(a) * (3.12 + i * 0.22), -0.04, Math.sin(a) * (3.12 + i * 0.22)));
        }
        const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x7e91c0, transparent: true, opacity: i ? 0.14 : 0.35 }));
        assembly.add(ring);
        rings.push(ring);
      }

      const smooth = value => value * value * (3 - 2 * value);
      const clamp = value => Math.max(0, Math.min(1, value));
      function update(t) {
        const cycle = (t + 1.6) % 10;
        const separate = cycle < 3.1 ? 1 : cycle < 4.9 ? 1 - smooth((cycle - 3.1) / 1.8) : cycle < 7.2 ? 0 : smooth(clamp((cycle - 7.2) / 2.8));
        const breathe = Math.sin(t * 0.8) * 0.07;
        assembly.rotation.y = -0.18 + Math.sin(t * 0.29) * 0.1;
        assembly.position.y = breathe;
        substrate.position.y = 0.14 + separate * 0.12;
        die.position.y = 0.28 + separate * 0.69;
        lid.position.y = 0.48 + separate * 1.36;
        lid.rotation.y = Math.sin(t * 0.38) * separate * 0.045;
        guides.scale.y = 0.3 + separate * 0.7;
        guides.children.forEach(line => { line.material.opacity = 0.05 + separate * 0.29; });
        cells.forEach(({ material, phase }) => {
          material.emissiveIntensity = 0.22 + Math.pow((Math.sin(t * 2.3 - phase) + 1) / 2, 3) * 1.5;
        });
        traces.forEach(({ path, spark, tail, phase }) => {
          const p = (t * 0.3 + phase) % 1;
          spark.position.copy(path.getPoint(1 - p));
          tail.position.copy(path.getPoint(Math.min(1, 1 - p + 0.055)));
          spark.material.opacity = 0.9;
        });
        rings[0].rotation.y = t * 0.13;
        rings[1].rotation.y = -t * 0.08 + 1.4;
        materials.blue.emissiveIntensity = 1.1 + 0.4 * Math.sin(t * 2.3);
      }
      update(0);
      return { scene, camera, update };
    }
  });
})();
