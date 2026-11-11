/* A dimensional compression metaphor. No quantitative results are generated here. */
(() => {
  'use strict';
  if (!window.SFRMotion) return;

  window.SFRMotion.register({
    slideId: 'slide-7',
    host: '.compression-animation',
    build(THREE, width, height) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 60);
      camera.position.set(0.1, 1.15, 6.6);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.HemisphereLight(0xe2eaff, 0x101327, 2.25));
      const key = new THREE.DirectionalLight(0xf2f5ff, 4.4);
      key.position.set(-3, 5, 5); scene.add(key);
      const edge = new THREE.DirectionalLight(0x527bff, 3.2);
      edge.position.set(3, -1, -3); scene.add(edge);
      const coreLight = new THREE.PointLight(0x8eafff, 13, 7, 2);
      coreLight.position.set(2.5, .2, 1.2); scene.add(coreLight);

      const root = new THREE.Group(); scene.add(root);
      const source = new THREE.Vector3(-2.25, .05, 0);
      const destination = new THREE.Vector3(2.6, .05, 0);
      const sourceRotation = new THREE.Euler(.18, -.35, .07);
      const clamp = THREE.MathUtils.clamp;
      const smooth = (a, b, x) => { const v = clamp((x-a)/(b-a),0,1); return v*v*(3-2*v); };

      // The source block is made from seven separate wafer layers.
      const geometry = new THREE.BoxGeometry(.195, .195, .043);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xa4b9ee, metalness: .52, roughness: .26,
        clearcoat: 1, clearcoatRoughness: .13,
        emissive: 0x1c3d8f, emissiveIntensity: .16
      });
      const count = 7 * 7 * 7;
      const wafers = new THREE.InstancedMesh(geometry, material, count);
      wafers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      root.add(wafers);
      const positions = [], dummy = new THREE.Object3D();
      const color = new THREE.Color();
      for (let layer = 0; layer < 7; layer++) {
        for (let row = 0; row < 7; row++) {
          for (let col = 0; col < 7; col++) {
            const index = positions.length;
            const local = new THREE.Vector3((col-3)*.235, (row-3)*.235, (layer-3)*.21);
            const from = local.clone().applyEuler(sourceRotation).add(source);
            const to = new THREE.Vector3((col-3)*.028, (row-3)*.028, (layer-3)*.028).add(destination);
            positions.push({ from, to, local, delay: layer*.12 + (col+row)*.018, row, col, layer });
            color.setHSL(.625, .39, .40 + .30*(layer/6) + .05*(col/6));
            wafers.setColorAt(index, color);
          }
        }
      }

      // Thin wafer frames keep the original volume visible as the data leaves it.
      const frames = [];
      for (let layer = 0; layer < 7; layer++) {
        const shape = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.78, 1.78, .025));
        const frame = new THREE.LineSegments(shape, new THREE.LineBasicMaterial({color:0x8da8ed, transparent:true, opacity:.24}));
        frame.rotation.copy(sourceRotation);
        frame.position.copy(new THREE.Vector3(0,0,(layer-3)*.21).applyEuler(sourceRotation).add(source));
        root.add(frame); frames.push(frame);
      }

      // A lens and precise curved tracks make the direction of the transform legible.
      const lens = new THREE.Group(); lens.position.set(.3, 0, 0); root.add(lens);
      const rings = [];
      [1.02, .9].forEach((radius, i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius, i ? .006 : .012, 6, 96),
          new THREE.MeshBasicMaterial({color:i ? 0x5878ce : 0xa6beff, transparent:true, opacity:i ? .28 : .58})
        );
        ring.rotation.y = 1.08; ring.rotation.z = -.12;
        lens.add(ring); rings.push(ring);
      });
      const tracks = [];
      const trackDots = [];
      const dotGeo = new THREE.SphereGeometry(.024, 8, 6);
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI * 2 / 12;
        const y = Math.cos(angle), z = Math.sin(angle);
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(-1.37, y*.72, z*.72),
          new THREE.Vector3(-.3, y*1.1, z*.8),
          new THREE.Vector3(.65, y*.36, z*.36),
          new THREE.Vector3(2.5, y*.1, z*.1)
        );
        const track = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(56)),
          new THREE.LineBasicMaterial({color:0x7899ef, transparent:true, opacity:.13}));
        root.add(track); tracks.push(track);
        for (let j = 0; j < 2; j++) {
          const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({color:j ? 0xdce7ff : 0x90b5ff, transparent:true, opacity:.75}));
          root.add(dot); trackDots.push({dot, curve, offset:i/12+j*.5});
        }
      }

      // The receiving die is tiny but tangible: beveled stacked metal plates.
      const chip = new THREE.Group(); chip.position.copy(destination); chip.rotation.set(.25,-.4,.08); root.add(chip);
      const chipBase = new THREE.Mesh(new THREE.BoxGeometry(.54,.54,.08), new THREE.MeshPhysicalMaterial({color:0x344a77,metalness:.62,roughness:.28,clearcoat:1}));
      chipBase.position.z = -.2; chip.add(chipBase);
      const chipRim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.57,.57,.12)), new THREE.LineBasicMaterial({color:0x9cbdff,transparent:true,opacity:.8}));
      chipRim.position.z=-.2; chip.add(chipRim);
      const die = new THREE.Mesh(new THREE.BoxGeometry(.37,.37,.045), new THREE.MeshPhysicalMaterial({color:0xc6dcff,metalness:.52,roughness:.16,emissive:0x4d7de1,emissiveIntensity:.4,clearcoat:1}));
      die.position.z=.17; chip.add(die);
      const pinGeo = new THREE.BoxGeometry(.055,.025,.025);
      const pinMat = new THREE.MeshStandardMaterial({color:0xd0dcf1,metalness:.85,roughness:.24});
      for(let side=0;side<4;side++) for(let p=0;p<7;p++) {
        const pin = new THREE.Mesh(pinGeo,pinMat);
        const angle = side*Math.PI/2;
        pin.position.set(Math.cos(angle)*.31 - Math.sin(angle)*(p-3)*.064,Math.sin(angle)*.31 + Math.cos(angle)*(p-3)*.064,-.17);
        pin.rotation.z=angle; chip.add(pin);
      }

      // Smooth radial glow drawn locally; no image requests or star-field decoration.
      const glowCanvas = document.createElement('canvas'); glowCanvas.width=128; glowCanvas.height=128;
      const context = glowCanvas.getContext('2d');
      const gradient = context.createRadialGradient(64,64,0,64,64,64);
      gradient.addColorStop(0,'rgba(149,187,255,.66)'); gradient.addColorStop(.18,'rgba(91,136,255,.21)'); gradient.addColorStop(1,'rgba(67,105,255,0)');
      context.fillStyle=gradient; context.fillRect(0,0,128,128);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x9cbaff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));
      glow.position.copy(destination); glow.scale.set(2.35,2.35,1); root.add(glow);

      const rail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.25,-1.28,0),new THREE.Vector3(3.2,-1.28,0)
      ]), new THREE.LineBasicMaterial({color:0x536b9e,transparent:true,opacity:.24}));
      root.add(rail);
      const tickGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.04,0),new THREE.Vector3(0,.04,0)]);
      for(let i=0;i<29;i++){const tick=new THREE.Line(tickGeo,new THREE.LineBasicMaterial({color:0x6b84ba,transparent:true,opacity:i%4===0?.45:.2}));tick.position.set(-3.2+i*.225,-1.28,0);root.add(tick);}

      function update(time) {
        const cycle = (time % 9.2);
        // Hold, converge in a wave, hold at the die, and refill without a hard cut.
        const reset = smooth(7.6,9.2,cycle);
        const globalProgress = smooth(1.0,5.7,cycle) * (1-reset);
        for(let i=0;i<positions.length;i++) {
          const item=positions[i];
          const progress=smooth(1.0+item.delay,4.7+item.delay,cycle)*(1-reset);
          const eased = progress*progress*(3-2*progress);
          dummy.position.lerpVectors(item.from,item.to,eased);
          const arc=Math.sin(progress*Math.PI);
          dummy.position.y += arc*.2*Math.sin(item.row*.47 + item.col*.24);
          dummy.position.z += arc*.35*Math.sin(item.col*.31+item.layer*.3);
          const scale=1 - .88*eased;
          dummy.scale.set(scale,scale,scale);
          dummy.rotation.set(sourceRotation.x*(1-eased)+eased*.25,sourceRotation.y+arc*.8,sourceRotation.z+arc*.12);
          dummy.updateMatrix(); wafers.setMatrixAt(i,dummy.matrix);
        }
        wafers.instanceMatrix.needsUpdate=true;
        root.rotation.y = Math.sin(time*.35)*.045;
        frames.forEach((frame)=>{frame.material.opacity=.17+.13*(1-globalProgress);});
        for(const {dot,curve,offset} of trackDots) {
          const p=(time*.27+offset)%1;
          dot.position.copy(curve.getPoint(p));
          dot.material.opacity=Math.sin(p*Math.PI)*(.30+.6*globalProgress);
          dot.scale.setScalar(.8+.4*globalProgress);
        }
        rings[0].material.opacity=.35+.3*globalProgress;
        lens.rotation.x=.06*Math.sin(time*.5);
        chip.rotation.y=-.4+Math.sin(time*.5)*.12;
        die.material.emissiveIntensity=.3+globalProgress*.9;
        glow.material.opacity=.25+globalProgress*.5;
        glow.scale.setScalar(2.1+.24*Math.sin(time*1.8));
        coreLight.intensity=8+globalProgress*9;
      }
      update(0);
      return {scene,camera,update};
    }
  });
})();
