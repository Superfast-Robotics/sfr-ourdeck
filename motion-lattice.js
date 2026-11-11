/* Live compression sculpture. A visual metaphor, not benchmark data.
   No remote assets: geometry, lighting and studio reflections are procedural. */
(() => {
  'use strict';
  if (!window.SFRMotion) return;

  window.SFRMotion.register({
    slideId: 'slide-8',
    host: '.benchmark-animation',
    build(T, width, height) {
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, width / height, 0.1, 60);
      camera.position.set(5.4, 3.5, 7.5);
      camera.lookAt(0, 0.05, 0);
      const textures = [];
      const resources = [];
      const own = (resource) => { resources.push(resource); return resource; };
      const smooth = (a, b, x) => {
        const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return u * u * (3 - 2 * u);
      };

      // Soft boxes reflected across the metal give the tiny blocks real depth.
      const faces = Array.from({ length: 6 }, (_, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, index === 2 ? '#b4c7ff' : '#11172e');
        gradient.addColorStop(0.46, '#35447a');
        gradient.addColorStop(1, '#080b18');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        context.fillStyle = index % 2 === 0 ? '#e6eeff' : '#7f9fff';
        context.fillRect(12, 10, 19, 100);
        context.fillStyle = '#bccbfa';
        context.fillRect(81, 4, 10, 57);
        return canvas;
      });
      const environment = new T.CubeTexture(faces);
      environment.colorSpace = T.SRGBColorSpace;
      environment.needsUpdate = true;
      scene.environment = environment;
      textures.push(environment);

      scene.add(new T.HemisphereLight(0xcbd9ff, 0x101426, 1.5));
      const key = new T.DirectionalLight(0xf0f5ff, 4.3);
      key.position.set(3.5, 5, 5);
      scene.add(key);
      const rim = new T.DirectionalLight(0x577fff, 5);
      rim.position.set(-4, 2, -3);
      scene.add(rim);
      const underside = new T.DirectionalLight(0x4261ff, 2.2);
      underside.position.set(-2, -3, 3);
      scene.add(underside);

      const sculpture = new T.Group();
      scene.add(sculpture);

      // A compact rounded-box geometry without an addon/module dependency.
      const cube = own(new T.BoxGeometry(0.265, 0.265, 0.265, 5, 5, 5));
      const positions = cube.attributes.position;
      const normals = cube.attributes.normal;
      const point = new T.Vector3();
      const base = new T.Vector3();
      const normal = new T.Vector3();
      const half = 0.1325;
      const radius = 0.026;
      for (let i = 0; i < positions.count; i += 1) {
        point.fromBufferAttribute(positions, i);
        base.set(
          T.MathUtils.clamp(point.x, -half + radius, half - radius),
          T.MathUtils.clamp(point.y, -half + radius, half - radius),
          T.MathUtils.clamp(point.z, -half + radius, half - radius)
        );
        normal.copy(point).sub(base).normalize();
        point.copy(base).addScaledVector(normal, radius);
        positions.setXYZ(i, point.x, point.y, point.z);
        normals.setXYZ(i, normal.x, normal.y, normal.z);
      }
      positions.needsUpdate = normals.needsUpdate = true;
      cube.computeBoundingSphere();
      const cellMaterial = own(new T.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0.72, roughness: 0.19,
        clearcoat: 1, clearcoatRoughness: 0.12,
        envMapIntensity: 1.4, emissive: 0x2444b5, emissiveIntensity: 0.17
      }));
      const cells = [];
      for (let x = -2; x <= 2; x += 1) {
        for (let y = -2; y <= 2; y += 1) {
          for (let z = -2; z <= 2; z += 1) {
            if (x === 0 && y === 0 && z === 0) continue;
            cells.push({ x, y, z, distance: Math.sqrt(x*x + y*y + z*z), seed: (x+2)*25 + (y+2)*5 + z+2 });
          }
        }
      }
      const lattice = new T.InstancedMesh(cube, cellMaterial, cells.length);
      lattice.instanceMatrix.setUsage(T.DynamicDrawUsage);
      lattice.frustumCulled = false;
      sculpture.add(lattice);
      const silver = new T.Color(0xc7d7ff);
      const blue = new T.Color(0x3b5bc5);
      const color = new T.Color();
      cells.forEach((cell, index) => {
        color.copy(blue).lerp(silver, 0.2 + (cell.y + 2) / 4 * 0.58);
        lattice.setColorAt(index, color);
      });
      lattice.instanceColor.needsUpdate = true;
      const dummy = new T.Object3D();

      const coreMaterial = own(new T.MeshPhysicalMaterial({
        color: 0xecf4ff, metalness: 0.44, roughness: 0.12,
        emissive: 0x8ba6ff, emissiveIntensity: 1.6, clearcoat: 1,
        envMapIntensity: 2
      }));
      const core = new T.Mesh(cube, coreMaterial);
      sculpture.add(core);
      const innerLight = new T.PointLight(0x5d87ff, 7, 4, 2);
      sculpture.add(innerLight);

      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = glowCanvas.height = 128;
      const glowContext = glowCanvas.getContext('2d');
      const glowGradient = glowContext.createRadialGradient(64,64,0,64,64,64);
      glowGradient.addColorStop(0, 'rgba(195,219,255,.86)');
      glowGradient.addColorStop(.14, 'rgba(108,151,255,.65)');
      glowGradient.addColorStop(.42, 'rgba(61,93,245,.16)');
      glowGradient.addColorStop(1, 'rgba(25,44,180,0)');
      glowContext.fillStyle = glowGradient;
      glowContext.fillRect(0, 0, 128, 128);
      const glowTexture = new T.CanvasTexture(glowCanvas);
      textures.push(glowTexture);
      const glowMaterial = own(new T.SpriteMaterial({
        map: glowTexture, color: 0xb3ceff, transparent: true, opacity: 0.44,
        blending: T.AdditiveBlending, depthWrite: false
      }));
      const glow = new T.Sprite(glowMaterial);
      glow.scale.set(1.7, 1.7, 1);
      sculpture.add(glow);

      // Hairline circuit arcs stay quiet while the compression itself leads.
      const orbitGroup = new T.Group();
      scene.add(orbitGroup);
      const rings = [];
      for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
        const ringPoints = [];
        const radius = 2.18 + ringIndex * .19;
        for (let step = 0; step <= 160; step += 1) {
          const angle = step / 160 * Math.PI * (ringIndex === 2 ? 1.7 : 2);
          ringPoints.push(new T.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        const geometry = own(new T.BufferGeometry().setFromPoints(ringPoints));
        const material = own(new T.LineBasicMaterial({
          color: ringIndex === 0 ? 0x8ba9ff : 0x5472ba,
          transparent: true, opacity: ringIndex === 0 ? .30 : .16,
          depthWrite: false
        }));
        const line = new T.Line(geometry, material);
        line.rotation.set(.14 + ringIndex * .60, 0, -.18 + ringIndex * .43);
        orbitGroup.add(line);
        rings.push(line);
      }

      // Small beads and short luminous tails move on curved inward paths.
      const particleGeometry = own(new T.SphereGeometry(.022, 7, 5));
      const particleMaterial = own(new T.MeshBasicMaterial({ color: 0xc3d8ff }));
      const particles = new T.InstancedMesh(particleGeometry, particleMaterial, 48);
      particles.instanceMatrix.setUsage(T.DynamicDrawUsage);
      particles.frustumCulled = false;
      scene.add(particles);
      const tailPositions = new Float32Array(48 * 2 * 3);
      const tailGeometry = own(new T.BufferGeometry());
      tailGeometry.setAttribute('position', new T.BufferAttribute(tailPositions, 3).setUsage(T.DynamicDrawUsage));
      const tails = new T.LineSegments(tailGeometry, own(new T.LineBasicMaterial({
        color: 0x7899ff, transparent: true, opacity: .35,
        blending: T.AdditiveBlending, depthWrite: false
      })));
      tails.frustumCulled = false;
      scene.add(tails);

      const bracketMaterial = own(new T.LineBasicMaterial({ color: 0x7e9aff, transparent: true, opacity: .24 }));
      const bracketPoints = [];
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        const at = new T.Vector3(x * 1.61, y * 1.61, z * 1.61);
        for (const axis of ['x', 'y', 'z']) {
          const end = at.clone();
          end[axis] *= .82;
          bracketPoints.push(at, end);
        }
      }
      const brackets = new T.LineSegments(own(new T.BufferGeometry().setFromPoints(bracketPoints)), bracketMaterial);
      sculpture.add(brackets);

      const update = (time) => {
        const cycle = time % 8.8;
        const compression = smooth(1.65, 3.7, cycle) * (1 - smooth(5.25, 7.85, cycle));
        const pulse = Math.sin(time * 3.4) * .5 + .5;
        sculpture.rotation.set(.08 + Math.sin(time * .23) * .08, time * .16 + .23, Math.sin(time * .19) * .045);
        sculpture.position.y = Math.sin(time * .72) * .065;
        cells.forEach((cell, index) => {
          const staggered = Math.max(0, Math.min(1, compression * (1.06 - .06 * cell.distance / 3.464)));
          const spacing = .61 + (.113 - .61) * staggered;
          const curl = Math.sin(staggered * Math.PI) * .30;
          const angle = cell.y * curl;
          const px = cell.x * Math.cos(angle) - cell.z * Math.sin(angle);
          const pz = cell.x * Math.sin(angle) + cell.z * Math.cos(angle);
          const flutter = Math.sin(time * 1.15 + cell.seed * .6) * .025 * (1 - compression);
          dummy.position.set(px * spacing, cell.y * spacing + flutter, pz * spacing);
          dummy.rotation.set(curl * cell.z * .28, curl * cell.x * .3, curl * cell.y * .16);
          dummy.scale.setScalar(1 - staggered * .66);
          dummy.updateMatrix();
          lattice.setMatrixAt(index, dummy.matrix);
        });
        lattice.instanceMatrix.needsUpdate = true;
        cellMaterial.emissiveIntensity = .12 + compression * .38;
        core.rotation.set(time * .16, -time * .22, time * .12);
        core.scale.setScalar(.9 + compression * .12);
        coreMaterial.emissiveIntensity = 1.1 + compression * 2.0 + pulse * .18;
        glow.scale.setScalar(1.1 + compression * 1.25 + pulse * .1);
        glowMaterial.opacity = .30 + compression * .52;
        innerLight.intensity = 5 + compression * 8;
        brackets.scale.setScalar(1 - compression * .80);
        bracketMaterial.opacity = .18 + compression * .24;
        orbitGroup.rotation.y = -time * .10;
        orbitGroup.rotation.z = Math.sin(time * .2) * .10;
        rings.forEach((ring, index) => { ring.rotation.y = time * (.06 + index * .04); });

        for (let index = 0; index < 48; index += 1) {
          const phase = (time * (.13 + index % 3 * .024) + index / 48) % 1;
          const angle = phase * Math.PI * 2.0 + index * 2.39996;
          const radius = 2.3 - phase * (1.45 + compression * .5);
          const lift = Math.sin(index * 1.7 + phase * Math.PI) * (.55 + (1 - compression) * .13);
          dummy.position.set(Math.cos(angle) * radius, lift, Math.sin(angle) * radius);
          dummy.rotation.set(0, 0, 0);
          const fade = Math.sin(phase * Math.PI);
          dummy.scale.setScalar(fade * (.65 + compression * .5));
          dummy.updateMatrix();
          particles.setMatrixAt(index, dummy.matrix);
          const j = index * 6;
          tailPositions[j] = dummy.position.x;
          tailPositions[j+1] = dummy.position.y;
          tailPositions[j+2] = dummy.position.z;
          const trailing = angle - .07 * fade;
          tailPositions[j+3] = Math.cos(trailing) * (radius + .035 * fade);
          tailPositions[j+4] = lift + .02 * fade;
          tailPositions[j+5] = Math.sin(trailing) * (radius + .035 * fade);
        }
        particles.instanceMatrix.needsUpdate = true;
        tailGeometry.attributes.position.needsUpdate = true;
      };
      update(0);
      return {
        scene, camera, update,
        dispose() {
          resources.forEach(resource => resource.dispose());
          textures.forEach(texture => texture.dispose());
        }
      };
    }
  });
})();
