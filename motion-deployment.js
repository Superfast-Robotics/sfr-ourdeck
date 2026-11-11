/* Distributed intelligence and local compute, drawn as a dimensional concept. */
(() => {
  'use strict';
  if (!window.SFRMotion) return;

  window.SFRMotion.register({
    slideId: 'slide-3',
    host: '.deployment-animation',
    label: 'A floating network of compute nodes sends signals into a compact onboard processor.',
    build(T, width, height) {
      const scene = new T.Scene();
      const aspect = width / height;
      const camera = new T.OrthographicCamera(-3.3 * aspect, 3.3 * aspect, 3.3, -3.3, .1, 50);
      camera.position.set(6, 4.8, 11);
      camera.lookAt(0, 0, 0);
      scene.add(new T.HemisphereLight(0xc6d8ff, 0x12172f, 1.9));
      const key = new T.DirectionalLight(0xf0f5ff, 4.6);
      key.position.set(-4, 7, 5); scene.add(key);
      const rim = new T.DirectionalLight(0x507aff, 5.5);
      rim.position.set(3, 2, -5); scene.add(rim);
      const fill = new T.DirectionalLight(0x8caeff, 2.4);
      fill.position.set(3, -3, 5); scene.add(fill);

      const silver = new T.MeshPhysicalMaterial({ color:0xc2d0f1, metalness:.58, roughness:.23, clearcoat:1, clearcoatRoughness:.16 });
      const shell = new T.MeshStandardMaterial({ color:0x20335c, metalness:.62, roughness:.29 });
      const blue = new T.MeshPhysicalMaterial({ color:0x4565cf, metalness:.5, roughness:.23, clearcoat:1, emissive:0x203d9a, emissiveIntensity:.32 });
      const signal = new T.MeshBasicMaterial({ color:0xaabfff });
      const warmSignal = new T.MeshBasicMaterial({ color:0xffb49b });
      const lineMaterial = new T.LineBasicMaterial({ color:0x809cde, transparent:true, opacity:.36 });

      const root = new T.Group(); scene.add(root);
      const network = new T.Group(); network.position.y = 1.72; root.add(network);
      const orb = new T.Group(); network.add(orb);
      const icosahedron = new T.IcosahedronGeometry(1.05, 1);
      const orbWire = new T.LineSegments(new T.WireframeGeometry(icosahedron), new T.LineBasicMaterial({ color:0x8baaff, transparent:true, opacity:.28 }));
      orb.add(orbWire);
      const orbCore = new T.Mesh(new T.IcosahedronGeometry(.37, 1), blue); orb.add(orbCore);
      const orbGlow = new T.Mesh(new T.IcosahedronGeometry(.56, 1), new T.MeshBasicMaterial({ color:0x668bff, transparent:true, opacity:.09, depthWrite:false }));
      orb.add(orbGlow);

      const nodes = [];
      const nodesGeometry = new T.BoxGeometry(.53, .18, .63);
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const node = new T.Group();
        const base = new T.Mesh(nodesGeometry, shell); node.add(base);
        const lid = new T.Mesh(new T.BoxGeometry(.49, .055, .59), silver); lid.position.y=.105; node.add(lid);
        for (let j = 0; j < 3; j++) {
          const slot = new T.Mesh(new T.BoxGeometry(.065, .012, .40), blue);
          slot.position.set((j-1)*.12, .14, 0); node.add(slot);
        }
        node.position.set(Math.cos(angle)*1.72, Math.sin(angle*2)*.16, Math.sin(angle)*1.72);
        node.rotation.y=-angle;
        network.add(node);
        const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), node.position]), lineMaterial);
        network.add(line);
        const bead = new T.Mesh(new T.SphereGeometry(.045, 10, 7), signal); network.add(bead);
        nodes.push({node, line, bead, angle});
      }

      // Thin orbital arcs make the distributed network legible in one glance.
      const arcs=[];
      for(let i=0;i<2;i++) {
        const pts=Array.from({length:96},(_,j)=>{
          const a=j/95*Math.PI*1.65;
          return new T.Vector3(Math.cos(a)*2.05,0,Math.sin(a)*2.05);
        });
        const arc=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x627ab1,transparent:true,opacity:.28}));
        arc.rotation.x=i ? .35 : -.18;
        network.add(arc);arcs.push(arc);
      }

      const chip = new T.Group(); chip.position.set(0,-1.72,0); root.add(chip);
      const base=new T.Mesh(new T.BoxGeometry(2.56,.15,2.56),shell); chip.add(base);
      const plate=new T.Mesh(new T.BoxGeometry(2.34,.065,2.34),silver);plate.position.y=.12;chip.add(plate);
      const die=new T.Mesh(new T.BoxGeometry(1.48,.22,1.48),blue);die.position.y=.29;chip.add(die);
      const cap=new T.Mesh(new T.BoxGeometry(1.27,.055,1.27),shell);cap.position.y=.428;chip.add(cap);
      for(let side=0;side<4;side++) for(let i=0;i<10;i++) {
        const pin=new T.Mesh(new T.BoxGeometry(.085,.055,.24),silver);
        const along=(i-4.5)*.21;
        if(side<2) pin.position.set(along,-.01,side ? -1.34 : 1.34);
        else {pin.rotation.y=Math.PI/2;pin.position.set(side===2 ? -1.34 : 1.34,-.01,along);}
        chip.add(pin);
      }
      const computeCells=[];
      for(let x=0;x<4;x++) for(let z=0;z<4;z++) {
        const material=new T.MeshBasicMaterial({color:0x6689ed});
        const cell=new T.Mesh(new T.BoxGeometry(.217,.012,.217),material);
        cell.position.set((x-1.5)*.27,.467,(z-1.5)*.27);chip.add(cell);
        computeCells.push({cell,index:x*4+z});
      }
      const chipOutline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(2.62,.20,2.62)),new T.LineBasicMaterial({color:0x9bb5ff,transparent:true,opacity:.55}));
      chip.add(chipOutline);

      // A bundle of curved fibres links remote inference to local compute.
      const fibres=[];
      for(let i=0;i<7;i++) {
        const offset=(i-3)*.17;
        const curve=new T.CubicBezierCurve3(new T.Vector3(offset,1.25,0),new T.Vector3(offset+.28,.65,.45),new T.Vector3(offset-.35,-.45,.35),new T.Vector3(offset,-1.2,0));
        const material=new T.LineBasicMaterial({color:0x6f88bd,transparent:true,opacity:.22});
        const line=new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(50)),material);root.add(line);
        const bead=new T.Mesh(new T.SphereGeometry(i===3 ? .065 : .036,10,7),i===3 ? warmSignal : signal);root.add(bead);
        fibres.push({curve,line,bead,index:i});
      }
      const pulseRing=new T.Mesh(new T.TorusGeometry(1.7,.008,6,96),new T.MeshBasicMaterial({color:0x839fff,transparent:true,opacity:.25}));
      pulseRing.rotation.x=Math.PI/2; pulseRing.position.y=-1.85;root.add(pulseRing);

      function update(t) {
        root.rotation.y=.16*Math.sin(t*.22)-.12;
        network.position.y=1.72+Math.sin(t*.8)*.09;
        network.rotation.y=t*.11;
        orb.rotation.set(t*.12,t*.23,.16);
        orbGlow.scale.setScalar(1+Math.sin(t*1.7)*.11);
        nodes.forEach(({node,line,bead,angle},index)=>{
          node.position.y=Math.sin(t*.65+angle*2)*.14;
          line.geometry.attributes.position.setXYZ(1,node.position.x,node.position.y,node.position.z);
          line.geometry.attributes.position.needsUpdate=true;
          const progress=(t*.31+index/6)%1;
          bead.position.copy(node.position).multiplyScalar(1-progress);
          bead.scale.setScalar(.55+Math.sin(progress*Math.PI)*.55);
        });
        arcs[0].rotation.y=t*.13;arcs[1].rotation.y=-t*.09;
        chip.rotation.y=-.18+Math.sin(t*.3)*.13;
        chip.position.y=-1.72+Math.sin(t*.8+.7)*.045;
        computeCells.forEach(({cell,index})=>{
          const glow=.5+.5*Math.sin(t*3.2-index*.62);
          cell.material.color.setRGB(.25+glow*.38,.39+glow*.39,.77+glow*.23);
        });
        const outage=t%8>3.3 && t%8<4.7;
        fibres.forEach(({curve,line,bead,index})=>{
          const p=(t*.31+index*.13)%1;
          bead.position.copy(curve.getPoint(p));
          bead.visible=!(outage && p>.36 && p<.74);
          line.material.opacity=outage ? .07 : .22;
          if(index===3) bead.material=outage ? warmSignal : signal;
        });
        pulseRing.scale.setScalar(1+(t*.22%1)*.55);
        pulseRing.material.opacity=(1-(t*.22%1))*.26;
      }
      update(0);
      return {scene,camera,update};
    }
  });
})();
