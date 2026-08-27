/* MSAR site — shared behaviour: nav, reveal-on-scroll, counters, filters, lightbox, modals, forms */
(function(){
  "use strict";

  /* Mark JS as active so CSS can opt in to reveal animations (see style.css).
     If this line never runs, content stays at its default visible state. */
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header scroll state ---------- */
  var header = document.querySelector('.site-header');
  if(header){
    var onScroll = function(){
      if(window.scrollY > 12){ header.classList.add('is-scrolled'); }
      else { header.classList.remove('is-scrolled'); }
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');
  if(toggle && panel){
    toggle.addEventListener('click', function(){
      var open = toggle.classList.toggle('is-open');
      panel.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    panel.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        toggle.classList.remove('is-open');
        panel.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-children');
  if('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll('[data-count-to]');
  if(counters.length){
    var animateCount = function(el){
      var to = parseFloat(el.getAttribute('data-count-to'));
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1400;
      var start = null;
      if(reduceMotion){ el.textContent = to + suffix; return; }
      function step(ts){
        if(!start) start = ts;
        var progress = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = Math.round(eased * to);
        el.textContent = val + suffix;
        if(progress < 1){ requestAnimationFrame(step); }
      }
      requestAnimationFrame(step);
    };
    if('IntersectionObserver' in window){
      var cio = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, {threshold:0.5});
      counters.forEach(function(el){ cio.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- generic filter bars (data-filter-group / data-filter-target) ---------- */
  document.querySelectorAll('[data-filter-group]').forEach(function(group){
    var targetSelector = group.getAttribute('data-filter-group');
    var items = document.querySelectorAll(targetSelector);
    group.querySelectorAll('.filter-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        group.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var cat = btn.getAttribute('data-filter');
        items.forEach(function(item){
          var cats = (item.getAttribute('data-cat') || '').split(' ');
          var show = cat === 'all' || cats.indexOf(cat) !== -1;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* ---------- lightbox (gallery) ---------- */
  var lightbox = document.querySelector('.lightbox');
  if(lightbox){
    var lbImg = lightbox.querySelector('img');
    var lbCap = lightbox.querySelector('.lb-cap');
    var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.masonry .g-item'));
    var currentIndex = 0;

    function openLightbox(i){
      currentIndex = i;
      var item = galleryItems[i];
      var full = item.getAttribute('data-full') || item.querySelector('img').src;
      lbImg.src = full;
      lbImg.alt = item.querySelector('img').alt || '';
      if(lbCap) lbCap.textContent = item.getAttribute('data-caption') || '';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    galleryItems.forEach(function(item, i){
      item.addEventListener('click', function(){ openLightbox(i); });
    });
    var lbClose = lightbox.querySelector('.lb-close');
    var lbPrev = lightbox.querySelector('.lb-prev');
    var lbNext = lightbox.querySelector('.lb-next');
    if(lbClose) lbClose.addEventListener('click', closeLightbox);
    if(lbPrev) lbPrev.addEventListener('click', function(){ openLightbox((currentIndex - 1 + galleryItems.length) % galleryItems.length); });
    if(lbNext) lbNext.addEventListener('click', function(){ openLightbox((currentIndex + 1) % galleryItems.length); });
    lightbox.addEventListener('click', function(e){ if(e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function(e){
      if(!lightbox.classList.contains('is-open')) return;
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft' && lbPrev) lbPrev.click();
      if(e.key === 'ArrowRight' && lbNext) lbNext.click();
    });
  }

  /* ---------- detail modals (events / news) ---------- */
  var modalOverlay = document.querySelector('.modal-overlay');
  if(modalOverlay){
    var modalMedia = modalOverlay.querySelector('.modal-media img');
    var modalBody = modalOverlay.querySelector('.modal-body');

    function openModal(trigger){
      var data = JSON.parse(trigger.getAttribute('data-modal'));
      if(modalMedia){ modalMedia.src = data.img; modalMedia.alt = data.title; }
      modalBody.innerHTML =
        '<div class="eyebrow">' + (data.eyebrow || '') + '</div>' +
        '<h3>' + data.title + '</h3>' +
        (data.meta ? '<div class="modal-meta">' + data.meta + '</div>' : '') +
        (data.body || '') +
        (data.actions || '');
      modalOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(){
      modalOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('[data-modal]').forEach(function(trigger){
      trigger.addEventListener('click', function(e){
        e.preventDefault();
        openModal(trigger);
      });
    });
    modalOverlay.addEventListener('click', function(e){
      if(e.target === modalOverlay) closeModal();
    });
    var modalCloseBtn = modalOverlay.querySelector('.modal-close');
    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeModal();
    });
  }

  /* ---------- forms: client-side validation + confirmation (no backend wired yet) ---------- */
  document.querySelectorAll('form[data-demo-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.checkValidity()){
        form.reportValidity();
        return;
      }
      var wrap = form.closest('.form-card');
      var success = wrap ? wrap.querySelector('.form-success') : null;
      form.style.display = 'none';
      if(success) success.classList.add('is-open');
    });
  });

})();
