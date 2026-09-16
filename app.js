(() => {
  const body = document.body;
  const html = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-trigger');
  const menu = document.getElementById('mobile-menu');
  const bag = document.getElementById('bag-drawer');
  const scrim = document.querySelector('[data-scrim]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lockedY = 0;

  /* Keep closed off-canvas UI inside the viewport so it never expands document scrollWidth. */
  const runtimeStyle = document.createElement('style');
  runtimeStyle.textContent = `
    html{overflow-x:clip;scroll-behavior:auto!important}
    body{overflow-x:clip}
    .bag-drawer{transform:none!important;clip-path:inset(0 0 0 100%);visibility:hidden;pointer-events:none;transition:clip-path .45s cubic-bezier(.75,0,.15,1),visibility .45s!important}
    .bag-drawer[aria-hidden="false"]{clip-path:inset(0);visibility:visible;pointer-events:auto}
  `;
  document.head.appendChild(runtimeStyle);

  const lockPage = className => {
    lockedY = window.scrollY;
    body.classList.add(className);
    Object.assign(body.style,{position:'fixed',top:`-${lockedY}px`,left:'0',right:'0',width:'100%'});
    html.style.overflow = 'hidden';
  };
  const unlockPage = className => {
    body.classList.remove(className);
    Object.assign(body.style,{position:'',top:'',left:'',right:'',width:''});
    html.style.overflow = '';
    const y = lockedY;
    requestAnimationFrame(() => window.scrollTo(0,y));
  };

  const closeMenu = () => {
    if(!body.classList.contains('menu-open')) return;
    menu?.setAttribute('aria-hidden','true');
    menuButton?.setAttribute('aria-expanded','false');
    unlockPage('menu-open');
  };
  menuButton?.addEventListener('click',()=>{
    if(body.classList.contains('menu-open')) return closeMenu();
    menu?.setAttribute('aria-hidden','false');
    menuButton.setAttribute('aria-expanded','true');
    lockPage('menu-open');
  });
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));

  const openBag = () => {
    if(!bag || body.classList.contains('drawer-open')) return;
    bag.setAttribute('aria-hidden','false');
    lockPage('drawer-open');
    setTimeout(()=>bag.querySelector('.bag-close')?.focus(),180);
  };
  const closeBag = () => {
    if(!body.classList.contains('drawer-open')) return;
    bag?.setAttribute('aria-hidden','true');
    unlockPage('drawer-open');
  };
  document.querySelectorAll('.bag-trigger').forEach(b=>b.addEventListener('click',openBag));
  document.querySelector('.bag-close')?.addEventListener('click',closeBag);
  scrim?.addEventListener('click',closeBag);
  addEventListener('keydown',e=>{if(e.key==='Escape'){closeBag();closeMenu();}});

  const syncHeader=()=>{
    if(header && !header.classList.contains('is-solid')) header.classList.toggle('is-scrolled',scrollY>30);
  };
  syncHeader(); addEventListener('scroll',syncHeader,{passive:true});

  const parallax=document.querySelector('[data-parallax] img');
  if(parallax&&!reduceMotion) addEventListener('scroll',()=>{
    parallax.style.transform=`scale(1.035) translate3d(0,${Math.min(scrollY*.035,28)}px,0)`;
  },{passive:true});

  const readCart=()=>{try{return JSON.parse(sessionStorage.getItem('trama-zero-cart')||'null')}catch{return null}};
  const writeCart=item=>{try{sessionStorage.setItem('trama-zero-cart',JSON.stringify(item))}catch{}};
  const renderCart=()=>{
    const item=readCart();
    document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=item?'1':'0');
    const empty=document.querySelector('[data-bag-empty]'), row=document.querySelector('[data-bag-item]');
    if(empty) empty.hidden=!!item; if(row) row.hidden=!item;
    if(item){
      document.querySelectorAll('[data-bag-size]').forEach(el=>el.textContent=item.size||'M');
      document.querySelectorAll('[data-bag-color]').forEach(el=>el.textContent=item.color||'Ink');
    }
  };
  renderCart();

  let selectedSize='', selectedColor='Ink';
  const sizeLabel=document.querySelector('[data-size-label]'), colorLabel=document.querySelector('[data-color-label]');
  document.querySelectorAll('[data-size]').forEach(btn=>btn.addEventListener('click',()=>{
    selectedSize=btn.dataset.size||'';
    document.querySelectorAll('[data-size]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
    if(sizeLabel) sizeLabel.textContent=selectedSize;
  }));
  document.querySelectorAll('[data-color]').forEach(btn=>btn.addEventListener('click',()=>{
    selectedColor=btn.dataset.color||'Ink';
    document.querySelectorAll('[data-color]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
    if(colorLabel) colorLabel.textContent=selectedColor;
  }));
  document.querySelector('[data-add-to-bag]')?.addEventListener('click',e=>{
    if(!selectedSize){
      document.querySelector('.size-row')?.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:260});
      if(sizeLabel) sizeLabel.textContent='Scegli una taglia';
      return;
    }
    writeCart({product:'Modulo 01 / Shell',size:selectedSize,color:selectedColor,price:420}); renderCart();
    e.currentTarget.textContent='Aggiunto ✓'; setTimeout(()=>e.currentTarget.textContent='Aggiungi alla borsa',1200); openBag();
  });

  const stage=document.querySelector('[data-weave-stage]'), canvas=document.getElementById('weave-canvas');
  if(!stage||!canvas||reduceMotion) return;

  const startField=async()=>{
    try{
      const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75)); renderer.setClearColor(0,0); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
      const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(35,1,.1,100); camera.position.set(0,.1,7.2);
      const hemi=new THREE.HemisphereLight(0xf4ead7,0x211f1c,2.1), key=new THREE.DirectionalLight(0xfff0dc,4.2), rim=new THREE.PointLight(0xb84f2b,32,12,1.6); key.position.set(3.5,4,5); rim.position.set(-3.8,-1,2.5); scene.add(hemi,key,rim);
      const root=new THREE.Group(); scene.add(root); const meshes=[]; const colors=[0xe8dfcf,0x24211e,0xa34d2a];
      const makeRibbon=index=>{
        const seg=150,pos=new Float32Array((seg+1)*6),uvs=new Float32Array((seg+1)*4),idx=[],g=new THREE.BufferGeometry(),width=.32+index*.035;
        for(let i=0;i<=seg;i++){
          const t=i/seg,a=t*Math.PI*2.05+index*2.06,r=1.72-t*.28+index*.07,x=Math.cos(a)*r,y=(t-.5)*3.1+Math.sin(a*1.5+index)*.24,z=Math.sin(a)*.95+Math.cos(t*Math.PI*3+index)*.22,dx=-Math.sin(a)*width,dz=Math.cos(a)*width,b=i*6;
          pos.set([x+dx,y,z+dz,x-dx,y,z-dz],b); uvs.set([0,t,1,t],i*4); if(i<seg){const n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2)}
        }
        g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uvs,2)); g.setIndex(idx); g.computeVertexNormals();
        const m=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:colors[index],roughness:index===1?.72:.55,metalness:index===1?.08:0,clearcoat:.12,side:THREE.DoubleSide})); m.rotation.z=(index-1)*.18;m.userData.baseZ=m.rotation.z;root.add(m);meshes.push(m);
      };
      [0,1,2].forEach(makeRibbon);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.22,.015,10,180),new THREE.MeshStandardMaterial({color:0x6d665d,roughness:.6,metalness:.5})); ring.rotation.x=Math.PI/2;ring.position.y=-1.7;root.add(ring);
      let targetX=.18,targetY=-.28,rotX=targetX,rotY=targetY,drag=false,lastX=0,lastY=0,visible=true; const pointer={x:0,y:0};
      stage.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture?.(e.pointerId)});
      stage.addEventListener('pointerup',e=>{drag=false;stage.releasePointerCapture?.(e.pointerId)}); stage.addEventListener('pointercancel',()=>drag=false);
      stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width-.5)*2;pointer.y=((e.clientY-r.top)/r.height-.5)*2;if(drag){targetY+=(e.clientX-lastX)*.006;targetX=Math.max(-.7,Math.min(.8,targetX+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY}});
      const resize=()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(Math.max(1,width),Math.max(1,height),false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix()};resize();new ResizeObserver(resize).observe(stage);
      new IntersectionObserver(e=>visible=e[0]?.isIntersecting??true,{rootMargin:'120px'}).observe(stage);
      const clock=new THREE.Clock(); const animate=()=>{requestAnimationFrame(animate);if(!visible)return;const t=clock.getElapsedTime();if(!drag){targetY+=pointer.x*.00022;targetX+=pointer.y*.0001}rotX+=(targetX-rotX)*.055;rotY+=(targetY-rotY)*.055;root.rotation.x=rotX;root.rotation.y=rotY+scrollY*.00014;meshes.forEach((m,i)=>{m.rotation.z=m.userData.baseZ+Math.sin(t*.55+i*1.8)*.055;m.position.y=Math.sin(t*.42+i*2)*.035});renderer.render(scene,camera)};
      stage.classList.add('is-live'); animate();
    }catch(err){console.warn('TRAMA ZERO Weave Field fallback active.',err)}
  };
  const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();startField()}},{rootMargin:'300px'}); io.observe(stage);
})();
