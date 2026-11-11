/* A procedural binary-inference chip concept; no product geometry is implied. */
(() => {
  'use strict';
  if (!window.SFRMotion) return;
  window.SFRMotion.register({
    slideId: 'slide-11',
    host: '.binary-chip-animation',
    label: 'A compact binary inference chip with alternating computational cells and flowing binary signals.',
    build(T, width, height) {
      const scene = new T.Scene();
      const camera = new T.OrthographicCamera(-2.8*width/height,2.8*width/height,2.8,-2.8,.1,50);
      camera.position.set(6.4,7.3,8.7);
      camera.lookAt(0,.05,0);
      scene.add(new T.HemisphereLight(0xb4c9ff,0x0b1020,2.0));
      for (const [color, power, position] of [[0xf4f7ff,5.4,[-3,7,5]],[0x718dff,4.0,[4,2,-4]],[0xdbe8ff,2.2,[-4,1,-3]]]) {
        const light = new T.DirectionalLight(color,power); light.position.set(...position); scene.add(light);
      }
      const coreLight = new T.PointLight(0x5b7aff,8,8,2); coreLight.position.set(0,2,0); scene.add(coreLight);
      const root = new T.Group(); scene.add(root);
      const resources = [];
      const own = value => { resources.push(value); return value; };
      const material = values => own(new T.MeshPhysicalMaterial(values));
      const titanium = material({color:0x26314a,metalness:.74,roughness:.27,clearcoat:1});
      const graphite = material({color:0x0c1325,metalness:.45,roughness:.3});
      const silver = material({color:0xaebfd9,metalness:.68,roughness:.25});
      const blue = material({color:0x3f60cf,metalness:.44,roughness:.2,emissive:0x1f39ad,emissiveIntensity:.45,clearcoat:1});
      const mesh = (geometry,mat,parent=root) => {const m=new T.Mesh(own(geometry),mat);parent.add(m);return m;};
      const box = (w,h,d,mat,y) => { const m=mesh(new T.BoxGeometry(w,h,d),mat);m.position.y=y;return m; };
      box(3.52,.12,3.52,graphite,-.23);
      box(3.38,.15,3.38,titanium,-.1);
      box(2.82,.07,2.82,silver,.02);
      box(2.7,.13,2.7,graphite,.11);
      box(2.54,.07,2.54,blue,.21);
      const lineMaterial = own(new T.LineBasicMaterial({color:0x8ba8ff,transparent:true,opacity:.55}));
      for (const [size,y] of [[3.52,-.16],[2.82,.06],[2.54,.26]]) {
        const path=[[-size/2,y,-size/2],[size/2,y,-size/2],[size/2,y,size/2],[-size/2,y,size/2],[-size/2,y,-size/2]].map(p=>new T.Vector3(...p));
        root.add(new T.Line(own(new T.BufferGeometry().setFromPoints(path)),lineMaterial));
      }
      // Contact pins keep the sculpture visibly a processor, rather than an abstract cube.
      const pinGeometry = own(new T.BoxGeometry(.105,.075,.34));
      for (let side=0;side<4;side++) {
        const pins=new T.Group(); pins.rotation.y=side*Math.PI/2;root.add(pins);
        for(let i=0;i<14;i++) {
          const pin=new T.Mesh(pinGeometry,silver);pin.position.set((i-6.5)*.224,-.12,1.82);pins.add(pin);
        }
      }
      const digits=[0,1].map(digit=>{
        const c=document.createElement('canvas');c.width=128;c.height=128;
        const ctx=c.getContext('2d');ctx.fillStyle='#e5eeff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 86px monospace';ctx.fillText(String(digit),64,67);
        const tex=own(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;return tex;
      });
      const digitMaterials=digits.map(map=>own(new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,color:0xc5d5ff,opacity:.92})));
      const cellGeometry=own(new T.BoxGeometry(.47,.055,.47));
      const digitGeometry=own(new T.PlaneGeometry(.28,.28));
      const cells=[];
      for(let row=0;row<4;row++)for(let col=0;col<4;col++){
        const mat=material({color:0x4c6bc8,metalness:.32,roughness:.22,emissive:0x426aff,emissiveIntensity:.22,clearcoat:1});
        const cell=new T.Mesh(cellGeometry,mat);cell.position.set((col-1.5)*.56,.29,(row-1.5)*.56);root.add(cell);
        const digit=new T.Mesh(digitGeometry,digitMaterials[(row+col)%2]);digit.rotation.x=-Math.PI/2;digit.position.copy(cell.position);digit.position.y=.324;root.add(digit);
        cells.push({cell,digit,row,col});
      }
      const routes=[];
      const signalMaterial=own(new T.LineBasicMaterial({color:0x526eaa,transparent:true,opacity:.35}));
      const streams=new T.Group();scene.add(streams);
      for(let side=0;side<4;side++)for(let lane=0;lane<3;lane++){
        const rotate=p=>new T.Vector3(p[0],p[1],p[2]).applyAxisAngle(new T.Vector3(0,1,0),side*Math.PI/2);
        const offset=(lane-1)*.48;
        const curve=new T.CubicBezierCurve3(rotate([offset*1.6,-.4,3.45]),rotate([offset*1.35,-.25,2.85]),rotate([offset,-.12,2.35]),rotate([offset,-.1,1.88]));
        streams.add(new T.Line(own(new T.BufferGeometry().setFromPoints(curve.getPoints(40))),signalMaterial));
        const spriteMat=own(new T.SpriteMaterial({map:digits[(side+lane)%2],color:0xa9c1ff,transparent:true,opacity:.8,depthWrite:false}));
        const sprite=new T.Sprite(spriteMat);sprite.scale.set(.18,.18,1);streams.add(sprite);
        routes.push({curve,sprite,index:side*3+lane});
      }
      const ringPoints=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;ringPoints.push(new T.Vector3(Math.cos(a)*2.62,-.5,Math.sin(a)*2.62));}
      const orbit=new T.Line(own(new T.BufferGeometry().setFromPoints(ringPoints)),own(new T.LineBasicMaterial({color:0x4266af,transparent:true,opacity:.18})));scene.add(orbit);
      const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;
      const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,4,64,64,62);
      gradient.addColorStop(0,'rgba(62,101,245,.22)');gradient.addColorStop(.5,'rgba(47,78,190,.09)');gradient.addColorStop(1,'rgba(22,37,93,0)');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);
      const glowTex=own(new T.CanvasTexture(glowCanvas));
      const glow=mesh(new T.PlaneGeometry(7,7),own(new T.MeshBasicMaterial({map:glowTex,transparent:true,depthWrite:false})),scene);glow.rotation.x=-Math.PI/2;glow.position.y=-.54;
      return {
        scene,camera,
        update(t) {
          root.rotation.y=-.18+Math.sin(t*.26)*.1;
          root.position.y=Math.sin(t*.72)*.065;
          streams.rotation.y=root.rotation.y;
          for(const {cell,digit,row,col} of cells){
            const phase=t*1.35-row*.33-col*.16;
            const bit=Math.sin(phase)>0?1:0;
            const brightness=.18+.68*Math.pow(Math.max(0,Math.sin(phase)),3);
            cell.material.emissiveIntensity=brightness;
            digit.material=digitMaterials[bit];
            digit.position.y=.324+root.position.y*.03;
          }
          for(const {curve,sprite,index} of routes){
            const progress=(t*.32+index*.173)%1;sprite.position.copy(curve.getPoint(progress));sprite.material.opacity=Math.sin(progress*Math.PI)*.82;
          }
          coreLight.intensity=7+Math.sin(t*1.2)*1.2;
        },
        dispose(){resources.forEach(r=>r.dispose?.());}
      };
    }
  });
})();
