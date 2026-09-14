(() => {
  const sections = [...document.querySelectorAll('.page-section')];
  const nav = document.querySelector('#site-nav');
  const menu = document.querySelector('.menu-toggle');
  const previews = [...document.querySelectorAll('.card-preview')];
  const previewToggle = document.querySelector('.preview-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headlinePhrases = [...document.querySelectorAll('.headline-phrases > span')];
  const headlineToggle = document.querySelector('.headline-toggle');
  const headlineWords = headlinePhrases.map(phrase => phrase.textContent);
  const typedHeadline = document.createElement('span');
  typedHeadline.className = 'headline-typed is-current';
  typedHeadline.textContent = headlineWords[0];
  headlinePhrases.forEach(phrase => phrase.classList.remove('is-current'));
  document.querySelector('.headline-phrases').append(typedHeadline);
  let headlinePaused = reducedMotion.matches;
  let headlineIndex = 0;
  let deletingHeadline = true;
  let headlineTimer;
  function typeHeadline() {
    const phrase = headlineWords[headlineIndex];
    let delay;
    if (deletingHeadline) {
      typedHeadline.textContent = typedHeadline.textContent.slice(0, -1);
      delay = 45;
      if (!typedHeadline.textContent) {
        headlineIndex = (headlineIndex + 1) % headlineWords.length;
        deletingHeadline = false;
        delay = 250;
      }
    } else {
      typedHeadline.textContent = phrase.slice(0, typedHeadline.textContent.length + 1);
      delay = 85;
      if (typedHeadline.textContent === phrase) {
        deletingHeadline = true;
        delay = 2200;
      }
    }
    headlineTimer = setTimeout(typeHeadline, delay);
  }
  function syncHeadline() {
    clearTimeout(headlineTimer);
    headlineToggle.textContent = headlinePaused ? 'Play text' : 'Pause text';
    headlineToggle.setAttribute('aria-pressed', String(headlinePaused));
    if (headlinePaused || document.hidden || document.querySelector('#home').hidden) {
      typedHeadline.textContent = headlineWords[headlineIndex];
      deletingHeadline = true;
      return;
    }
    headlineTimer = setTimeout(typeHeadline, 2200);
  }
  headlineToggle.addEventListener('click', () => { headlinePaused = !headlinePaused; syncHeadline(); });
  reducedMotion.addEventListener('change', () => { headlinePaused = reducedMotion.matches; syncHeadline(); });
  document.addEventListener('visibilitychange', syncHeadline);
  let previewsPaused = reducedMotion.matches;
  function syncPreviews() {
    previewToggle.textContent = previewsPaused ? 'Play previews' : 'Pause previews';
    previewToggle.setAttribute('aria-pressed', String(previewsPaused));
    previews.forEach(video => {
      const bounds = video.getBoundingClientRect();
      const visible = !video.closest('[hidden]') && bounds.bottom > 0 && bounds.top < innerHeight;
      if (!previewsPaused && !document.hidden && visible) {
        video.muted = true;
        video.play().catch(() => {});
      } else video.pause();
    });
  }
  const previewObserver = new IntersectionObserver(syncPreviews);
  previews.forEach(video => previewObserver.observe(video));
  previewToggle.addEventListener('click', () => { previewsPaused = !previewsPaused; syncPreviews(); });
  reducedMotion.addEventListener('change', () => { previewsPaused = reducedMotion.matches; syncPreviews(); });
  document.addEventListener('visibilitychange', syncPreviews);
  const demos = [...document.querySelectorAll('.demo-loop')];
  function syncDemos() {
    demos.forEach(video => {
      const bounds = video.getBoundingClientRect();
      const visible = !video.closest('[hidden]') && bounds.bottom > 0 && bounds.top < innerHeight;
      const paused = video.dataset.paused ? video.dataset.paused === 'true' : reducedMotion.matches;
      video.setAttribute('aria-label', paused ? 'Play demonstration' : 'Pause demonstration');
      if (visible && !document.hidden && !paused) {
        video.muted = true;
        video.play().catch(() => { video.controls = true; });
      } else video.pause();
    });
  }
  const demoObserver = new IntersectionObserver(syncDemos);
  demos.forEach(video => {
    video.tabIndex = 0;
    video.setAttribute('role', 'button');
    const toggle = () => { video.dataset.paused = String(!(video.dataset.paused ? video.dataset.paused === 'true' : reducedMotion.matches)); syncDemos(); };
    video.addEventListener('click', toggle);
    video.addEventListener('keydown', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggle(); } });
    demoObserver.observe(video);
  });
  document.addEventListener('visibilitychange', syncDemos);
  reducedMotion.addEventListener('change', () => { demos.forEach(video => delete video.dataset.paused); syncDemos(); });
  function renderPage(focus = false) {
    const requested = new URL(location.href).searchParams.get('page') || 'home';
    const active = sections.find(section => section.id === requested) || document.querySelector('#home');
    sections.forEach(section => { section.hidden = section !== active; });
    document.querySelectorAll('video').forEach(video => video.pause());
    document.querySelectorAll('iframe[data-src]').forEach(frame => {
      if (active.contains(frame)) { if (!frame.hasAttribute('src')) frame.src = frame.dataset.src; }
      else frame.removeAttribute('src');
    });
    nav.classList.remove('open'); menu.setAttribute('aria-expanded','false');
    document.title = active.id === 'home' ? 'Claudio Scuderi — Gameplay & Technical Designer' : `${active.querySelector('h1, h2')?.textContent.trim() || active.id} — Claudio Scuderi`;
    const anchor = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (anchor && active.contains(anchor)) anchor.scrollIntoView();
    else if (focus) window.scrollTo(0,0);
    if (focus) document.querySelector('#main').focus({preventScroll:true});
    syncPreviews();
    syncHeadline();
    syncDemos();
  }
  document.querySelectorAll('.case-page').forEach(section => {
    const toc = section.querySelector('.case-nav');
    section.querySelectorAll('.gameDesch2').forEach((heading,index) => {
      heading.id = `${section.id}-chapter-${index}`;
      if(toc){const link=document.createElement('a');link.href=`?page=${section.id}#${heading.id}`;link.textContent=heading.textContent.trim();toc.append(link);}
    });
    section.querySelectorAll('iframe').forEach(frame=>{frame.dataset.src=frame.getAttribute('src');frame.removeAttribute('src');});
    section.querySelectorAll('img').forEach(img=>{
      if(img.closest('a'))return;
      img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',`Enlarge ${img.alt}`);
      const open=()=>{viewer.querySelector('img').src=img.src;viewer.querySelector('img').alt=img.alt;viewer.querySelector('p').textContent=img.alt;viewer.showModal();};
      img.addEventListener('click',open);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  });
  const viewer = document.querySelector('#image-viewer');
  viewer.querySelector('button').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
  document.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0||link.target)return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.pathname!==location.pathname||!url.searchParams.has('page'))return;
    event.preventDefault();history.pushState({},'',url);renderPage(true);
  });
  window.addEventListener('popstate',()=>renderPage(true));
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}});
  document.querySelector('.copy-email').addEventListener('click',async()=>{
    const status=document.querySelector('#copy-status');
    try{await navigator.clipboard.writeText('claudioscuderi.gd@gmail.com');status.textContent='Email copied!';}
    catch{status.textContent='Select the email address above to copy it, or click it to get in touch.';}
  });
  renderPage();
})();
