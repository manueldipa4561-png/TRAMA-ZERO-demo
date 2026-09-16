(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-trigger');
  const mobileMenu = document.getElementById('mobile-menu');
  const bag = document.getElementById('bag-drawer');
  const scrim = document.querySelector('[data-scrim]');
  let lockedScrollY = 0;

  const lockPage = (className) => {
    lockedScrollY = window.scrollY;
    body.classList.add(className);
    body.style.position = 'fixed';
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
  };

  const unlockPage = (className) => {
    body.classList.remove(className);
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, lockedScrollY);
  };

  const closeMenu = () => {
    if (!body.classList.contains('menu-open')) return;
    mobileMenu?.setAttribute('aria-hidden', 'true');
    menuButton?.setAttribute('aria-expanded', 'false');
    unlockPage('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const open = body.classList.contains('menu-open');
    if (open) return closeMenu();
    mobileMenu?.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    lockPage('menu-open');
  });

  mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));

  const openBag = () => {
    if (!bag || body.classList.contains('drawer-open')) return;
    bag.setAttribute('aria-hidden', 'false');
    lockPage('drawer-open');
    setTimeout(() => bag.querySelector('.bag-close')?.focus(), 180);
  };
  const closeBag = () => {
    if (!body.classList.contains('drawer-open')) return;
    bag?.setAttribute('aria-hidden', 'true');
    unlockPage('drawer-open');
  };
  document.querySelectorAll('.bag-trigger').forEach(btn => btn.addEventListener('click', openBag));
  document.querySelector('.bag-close')?.addEventListener('click', closeBag);
  scrim?.addEventListener('click', closeBag);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (body.classList.contains('drawer-open')) closeBag();
    if (body.classList.contains('menu-open')) closeMenu();
  });

  const syncHeader = () => {
    if (!header || header.classList.contains('is-solid')) return;
    header.classList.toggle('is-scrolled', window.scrollY > 30);
  };
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallax = document.querySelector('[data-parallax] img');
  if (parallax && !reduceMotion) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY * 0.035, 28);
      parallax.style.transform = `scale(1.035) translate3d(0, ${y}px, 0)`;
    }, { passive: true });
  }

  const readCart = () => {
    try { return JSON.parse(sessionStorage.getItem('trama-zero-cart') || 'null'); }
    catch { return null; }
  };
  const writeCart = (item) => {
    try { sessionStorage.setItem('trama-zero-cart', JSON.stringify(item)); } catch {}
  };
  const renderCart = () => {
    const item = readCart();
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = item ? '1' : '0');
    const empty = document.querySelector('[data-bag-empty]');
    const bagItem = document.querySelector('[data-bag-item]');
    if (empty) empty.hidden = Boolean(item);
    if (bagItem) bagItem.hidden = !item;
    if (item) {
      document.querySelectorAll('[data-bag-size]').forEach(el => el.textContent = item.size || 'M');
      document.querySelectorAll('[data-bag-color]').forEach(el => el.textContent = item.color || 'Ink');
    }
  };
  renderCart();

  let selectedSize = '';
  let selectedColor = 'Ink';
  const sizeLabel = document.querySelector('[data-size-label]');
  const colorLabel = document.querySelector('[data-color-label]');

  document.querySelectorAll('[data-size]').forEach(button => {
    button.addEventListener('click', () => {
      selectedSize = button.dataset.size || '';
      document.querySelectorAll('[data-size]').forEach(btn => btn.setAttribute('aria-pressed', String(btn === button)));
      if (sizeLabel) sizeLabel.textContent = selectedSize;
    });
  });

  document.querySelectorAll('[data-color]').forEach(button => {
    button.addEventListener('click', () => {
      selectedColor = button.dataset.color || 'Ink';
      document.querySelectorAll('[data-color]').forEach(btn => btn.setAttribute('aria-pressed', String(btn === button)));
      if (colorLabel) colorLabel.textContent = selectedColor;
    });
  });

  document.querySelector('[data-add-to-bag]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (!selectedSize) {
      const sizeGroup = document.querySelector('.size-row');
      sizeGroup?.animate([
        { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
      ], { duration: 260 });
      sizeLabel && (sizeLabel.textContent = 'Scegli una taglia');
      return;
    }
    writeCart({ product: 'Modulo 01 / Shell', size: selectedSize, color: selectedColor, price: 420 });
    renderCart();
    button.textContent = 'Aggiunto ✓';
    setTimeout(() => button.textContent = 'Aggiungi alla borsa', 1200);
    openBag();
  });

  const stage = document.querySelector('[data-weave-stage]');
  const canvas = document.getElementById('weave-canvas');
  if (!stage || !canvas || reduceMotion) return;

  const startWeaveField = async () => {
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0.1, 7.2);

      const ambient = new THREE.HemisphereLight(0xf4ead7, 0x211f1c, 2.1);
      const key = new THREE.DirectionalLight(0xfff0dc, 4.2);
      key.position.set(3.5, 4, 5);
      const rim = new THREE.PointLight(0xb84f2b, 32, 12, 1.6);
      rim.position.set(-3.8, -1, 2.5);
      scene.add(ambient, key, rim);

      const root = new THREE.Group();
      scene.add(root);

      const colors = [0xe8dfcf, 0x24211e, 0xa34d2a];
      const meshes = [];

      const makeRibbon = (index) => {
        const segments = 150;
        const positions = new Float32Array((segments + 1) * 2 * 3);
        const uvs = new Float32Array((segments + 1) * 2 * 2);
        const indices = [];
        const geometry = new THREE.BufferGeometry();
        const width = 0.32 + index * 0.035;

        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const a = t * Math.PI * 2.05 + index * 2.06;
          const radius = 1.72 - t * 0.28 + index * 0.07;
          const x = Math.cos(a) * radius;
          const y = (t - .5) * 3.1 + Math.sin(a * 1.5 + index) * .24;
          const z = Math.sin(a) * .95 + Math.cos(t * Math.PI * 3 + index) * .22;
          const dx = -Math.sin(a) * width;
          const dz = Math.cos(a) * width;
          const base = i * 6;
          positions.set([x + dx, y, z + dz, x - dx, y, z - dz], base);
          const uv = i * 4;
          uvs.set([0, t, 1, t], uv);
          if (i < segments) {
            const n = i * 2;
            indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
          }
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhysicalMaterial({
          color: colors[index],
          roughness: index === 1 ? .72 : .55,
          metalness: index === 1 ? .08 : 0,
          clearcoat: .12,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = (index - 1) * .18;
        mesh.userData.baseZ = mesh.rotation.z;
        root.add(mesh);
        meshes.push(mesh);
      };
      [0,1,2].forEach(makeRibbon);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.22, .015, 10, 180),
        new THREE.MeshStandardMaterial({ color: 0x6d665d, roughness: .6, metalness: .5 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.7;
      root.add(ring);

      let targetX = 0.18, targetY = -0.28;
      let rotX = targetX, rotY = targetY;
      let drag = false, lastX = 0, lastY = 0;
      const pointer = { x: 0, y: 0 };

      stage.addEventListener('pointerdown', e => {
        drag = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture?.(e.pointerId);
      });
      stage.addEventListener('pointerup', e => { drag = false; stage.releasePointerCapture?.(e.pointerId); });
      stage.addEventListener('pointercancel', () => drag = false);
      stage.addEventListener('pointermove', e => {
        const rect = stage.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width - .5) * 2;
        pointer.y = ((e.clientY - rect.top) / rect.height - .5) * 2;
        if (drag) {
          targetY += (e.clientX - lastX) * .006;
          targetX += (e.clientY - lastY) * .004;
          targetX = Math.max(-.7, Math.min(.8, targetX));
          lastX = e.clientX; lastY = e.clientY;
        }
      });

      const resize = () => {
        const { width, height } = stage.getBoundingClientRect();
        renderer.setSize(Math.max(1, width), Math.max(1, height), false);
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
      };
      resize();
      new ResizeObserver(resize).observe(stage);

      const observer = new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting ?? true;
      }, { rootMargin: '120px' });
      let visible = true;
      observer.observe(stage);

      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        if (!visible) return;
        const t = clock.getElapsedTime();
        if (!drag) {
          targetY += pointer.x * .00022;
          targetX += pointer.y * .0001;
        }
        rotX += (targetX - rotX) * .055;
        rotY += (targetY - rotY) * .055;
        root.rotation.x = rotX;
        root.rotation.y = rotY + window.scrollY * .00014;
        meshes.forEach((mesh, i) => {
          mesh.rotation.z = mesh.userData.baseZ + Math.sin(t * .55 + i * 1.8) * .055;
          mesh.position.y = Math.sin(t * .42 + i * 2) * .035;
        });
        renderer.render(scene, camera);
      };
      stage.classList.add('is-live');
      animate();
    } catch (error) {
      console.warn('TRAMA ZERO Weave Field fallback active.', error);
    }
  };

  const weaveObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      weaveObserver.disconnect();
      startWeaveField();
    }
  }, { rootMargin: '300px' });
  weaveObserver.observe(stage);
})();
