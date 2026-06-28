/* ==========================================================================
   KOFEO — main.js
   Custom cursor · curtain page transitions · scroll reveals · image reveals
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------ */
  /* Hero entrance                                                       */
  /* ------------------------------------------------------------------ */
  var HeroEntrance = {
    played: false,

    play: function () {
      if (this.played) return;
      this.played = true;

      var hero = document.querySelector('.hero');
      if (!hero) return;

      if (reducedMotion) {
        hero.classList.add('is-hero-entered', 'is-hero-settled');
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          hero.classList.add('is-hero-entered');
          HeroEntrance.settle(hero);
        });
      });
    },

    settle: function (hero) {
      var bg = hero.querySelector('.hero__bg img');
      if (!bg) {
        hero.classList.add('is-hero-settled');
        return;
      }

      bg.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'transform') {
          hero.classList.add('is-hero-settled');
        }
      }, { once: true });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Curtain transition                                                  */
  /* ------------------------------------------------------------------ */
  var Curtain = {
    el: null,
    duration: 1050,

    init: function () {
      this.el = document.querySelector('.curtain');
      if (!this.el) {
        HeroEntrance.play();
        return;
      }

      if (reducedMotion) {
        this.el.style.display = 'none';
        HeroEntrance.play();
        return;
      }

      var onCurtainOpened = function (e) {
        if (e.target === Curtain.el && e.propertyName === 'transform') {
          Curtain.el.removeEventListener('transitionend', onCurtainOpened);
          HeroEntrance.play();
        }
      };

      this.el.addEventListener('transitionend', onCurtainOpened);

      // reveal current page
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          Curtain.el.classList.add('is-visible');
          setTimeout(function () {
            Curtain.el.classList.add('is-open');
          }, 120);
        });
      });

      this.bindLinks();
    },

    bindLinks: function () {
      var self = this;
      var links = document.querySelectorAll('a[href]');

      links.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href) return;
        if (href.indexOf('http') === 0) return;
        if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
        if (link.target === '_blank') return;
        if (href.charAt(0) === '#') return; // in-page anchors keep native smooth scroll

        link.addEventListener('click', function (e) {
          var url = link.href;
          var sameDoc = url.split('#')[0] === window.location.href.split('#')[0];
          if (sameDoc) return; // same page, let it scroll normally

          e.preventDefault();
          self.close(function () {
            window.location.href = url;
          });
        });
      });
    },

    close: function (cb) {
      if (!this.el) { cb(); return; }
      this.el.classList.remove('is-open');
      setTimeout(cb, this.duration * 0.92);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Custom cursor                                                       */
  /* ------------------------------------------------------------------ */
  var Cursor = {
    ring: null,
    dot: null,
    mx: 0, my: 0,
    rx: 0, ry: 0,

    init: function () {
      if (!finePointer || reducedMotion) return;

      this.ring = document.createElement('div');
      this.ring.className = 'cursor-ring';
      this.dot = document.createElement('div');
      this.dot.className = 'cursor-dot';
      document.body.appendChild(this.ring);
      document.body.appendChild(this.dot);
      document.documentElement.classList.add('has-custom-cursor');

      this.mx = this.rx = window.innerWidth / 2;
      this.my = this.ry = window.innerHeight / 2;
      this.dot.style.transform = 'translate(' + this.mx + 'px,' + this.my + 'px) translate(-50%,-50%)';

      var self = this;

      document.addEventListener('mousemove', function (e) {
        self.mx = e.clientX;
        self.my = e.clientY;
        self.dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-50%)';
      });

      document.addEventListener('mousedown', function () { self.ring.classList.add('is-down'); });
      document.addEventListener('mouseup', function () { self.ring.classList.remove('is-down'); });

      document.addEventListener('mouseleave', function () {
        document.documentElement.classList.add('cursor-hidden');
      });
      document.addEventListener('mouseenter', function () {
        document.documentElement.classList.remove('cursor-hidden');
      });

      var hoverSelector = 'a, button, input, textarea, .nav-toggle, [data-cursor-hover]';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest(hoverSelector)) {
          self.ring.classList.add('is-hover');
        }
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest(hoverSelector)) {
          self.ring.classList.remove('is-hover');
        }
      });

      this.loop();
    },

    loop: function () {
      this.rx += (this.mx - this.rx) * 0.18;
      this.ry += (this.my - this.ry) * 0.18;
      this.ring.style.transform = 'translate(' + this.rx + 'px,' + this.ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(this.loop.bind(this));
    }
  };

  /* ------------------------------------------------------------------ */
  /* Scroll reveal — sections fade/rise in once 40% visible              */
  /* ------------------------------------------------------------------ */
  var ScrollReveal = {
    init: function () {
      var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal, .reveal-scope')).filter(function (target) {
        return !target.closest('.hero');
      });
      if (!targets.length) return;

      if (reducedMotion || !('IntersectionObserver' in window)) {
        targets.forEach(function (t) { t.classList.add('in-view'); });
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -5% 0px' });

      targets.forEach(function (t) { observer.observe(t); });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Image reveal — side curtain panels slide away, image settles        */
  /* ------------------------------------------------------------------ */
  var ImageReveal = {
    init: function () {
      var wraps = document.querySelectorAll('.img-reveal');
      if (!wraps.length) return;

      wraps.forEach(function (wrap) {
        if (!wrap.querySelector('.img-reveal__panel--l')) {
          var l = document.createElement('div');
          l.className = 'img-reveal__panel img-reveal__panel--l';
          var r = document.createElement('div');
          r.className = 'img-reveal__panel img-reveal__panel--r';
          wrap.appendChild(l);
          wrap.appendChild(r);
        }
      });

      if (reducedMotion || !('IntersectionObserver' in window)) {
        wraps.forEach(function (w) { w.classList.add('in-view'); });
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25, rootMargin: '0px 0px -5% 0px' });

      wraps.forEach(function (w) { observer.observe(w); });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                    */
  /* ------------------------------------------------------------------ */
  var Nav = {
    init: function () {
      var toggle = document.querySelector('.nav-toggle');
      var nav = document.querySelector('.main-nav');
      if (!toggle || !nav) return;

      toggle.addEventListener('click', function () {
        toggle.classList.toggle('is-open');
        nav.classList.toggle('is-open');
      });

      nav.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          toggle.classList.remove('is-open');
          nav.classList.remove('is-open');
        });
      });

      var header = document.querySelector('.site-header');
      if (header) {
        window.addEventListener('scroll', function () {
          if (window.scrollY > 12) header.classList.add('is-scrolled');
          else header.classList.remove('is-scrolled');
        });
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Contact form (static demo submission)                               */
  /* ------------------------------------------------------------------ */
  var ContactForm = {
    init: function () {
      var form = document.querySelector('#reserveForm');
      if (!form) return;
      var success = document.querySelector('.form-success');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        form.style.display = 'none';
        if (success) success.classList.add('is-shown');
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* FAQ accordion                                                       */
  /* ------------------------------------------------------------------ */
  var FAQAccordion = {
    init: function () {
      var items = document.querySelectorAll('.faq-item');
      if (!items.length) return;

      items.forEach(function (item) {
        var button = item.querySelector('.faq-item__button');
        var panel = item.querySelector('.faq-item__panel');
        if (!button || !panel) return;

        button.addEventListener('click', function () {
          var isOpen = item.classList.contains('is-open');
          if (isOpen) FAQAccordion.close(item, button, panel);
          else FAQAccordion.open(item, button, panel);
        });
      });

      window.addEventListener('resize', function () {
        items.forEach(function (item) {
          var panel = item.querySelector('.faq-item__panel');
          if (panel && item.classList.contains('is-open')) {
            panel.style.maxHeight = panel.scrollHeight + 'px';
          }
        });
      });
    },

    open: function (item, button, panel) {
      item.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    },

    close: function (item, button, panel) {
      item.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';
    }
  };

  /* ------------------------------------------------------------------ */
  /* Gallery lightbox                                                    */
  /* ------------------------------------------------------------------ */
  var GalleryLightbox = {
    items: [],
    modal: null,
    image: null,
    caption: null,
    closeBtn: null,
    prevBtn: null,
    nextBtn: null,
    activeIndex: 0,
    lastFocus: null,
    touchStartX: 0,
    touchStartY: 0,

    init: function () {
      this.items = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-item]'));
      this.modal = document.querySelector('.gallery-lightbox');
      if (!this.items.length || !this.modal) return;

      this.image = this.modal.querySelector('.gallery-lightbox__img');
      this.caption = this.modal.querySelector('.gallery-lightbox__caption');
      this.closeBtn = this.modal.querySelector('.gallery-lightbox__close');
      this.prevBtn = this.modal.querySelector('.gallery-lightbox__nav--prev');
      this.nextBtn = this.modal.querySelector('.gallery-lightbox__nav--next');

      var self = this;

      this.items.forEach(function (item, index) {
        item.addEventListener('click', function () {
          self.open(index);
        });
      });

      this.closeBtn.addEventListener('click', function () { self.close(); });
      this.prevBtn.addEventListener('click', function () { self.show(self.activeIndex - 1); });
      this.nextBtn.addEventListener('click', function () { self.show(self.activeIndex + 1); });

      this.modal.addEventListener('click', function (e) {
        if (e.target === self.modal) self.close();
      });

      this.modal.addEventListener('touchstart', function (e) {
        if (!e.changedTouches.length) return;
        self.touchStartX = e.changedTouches[0].clientX;
        self.touchStartY = e.changedTouches[0].clientY;
      }, { passive: true });

      this.modal.addEventListener('touchend', function (e) {
        if (!e.changedTouches.length) return;
        var dx = e.changedTouches[0].clientX - self.touchStartX;
        var dy = e.changedTouches[0].clientY - self.touchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) self.show(self.activeIndex + 1);
          else self.show(self.activeIndex - 1);
        }
      }, { passive: true });

      document.addEventListener('keydown', function (e) {
        if (!self.modal.classList.contains('is-open')) return;

        if (e.key === 'Escape') self.close();
        if (e.key === 'ArrowLeft') self.show(self.activeIndex - 1);
        if (e.key === 'ArrowRight') self.show(self.activeIndex + 1);
        if (e.key === 'Tab') self.trapFocus(e);
      });
    },

    open: function (index) {
      this.lastFocus = document.activeElement;
      this.show(index);
      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      this.closeBtn.focus();
    },

    close: function () {
      var self = this;
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      setTimeout(function () {
        if (!self.modal.classList.contains('is-open')) {
          self.image.removeAttribute('src');
          self.image.alt = '';
        }
      }, reducedMotion ? 0 : 460);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    },

    show: function (index) {
      if (index < 0) index = this.items.length - 1;
      if (index >= this.items.length) index = 0;
      this.activeIndex = index;

      var item = this.items[index];
      var img = item.querySelector('img');
      var src = item.getAttribute('data-full') || (img ? img.src : '');
      var alt = img ? img.alt : '';

      this.image.src = src;
      this.image.alt = alt;
      this.caption.textContent = alt;
    },

    trapFocus: function (e) {
      var focusable = this.modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Testimonials carousel                                               */
  /* ------------------------------------------------------------------ */
  var Testimonials = {
    carousels: [],

    init: function () {
      var roots = document.querySelectorAll('[data-testimonial-carousel]');
      if (!roots.length) return;

      this.carousels = Array.prototype.slice.call(roots).map(function (root) {
        return Testimonials.create(root);
      }).filter(Boolean);
    },

    create: function (root) {
      var viewport = root.querySelector('.testimonials-viewport');
      var track = root.querySelector('[data-testimonial-track]');
      var cards = Array.prototype.slice.call(root.querySelectorAll('.testimonial-card'));
      var prev = root.querySelector('[data-testimonial-prev]');
      var next = root.querySelector('[data-testimonial-next]');
      var dotsWrap = root.querySelector('[data-testimonial-dots]');

      if (!viewport || !track || !cards.length) return null;

      var carousel = {
        root: root,
        viewport: viewport,
        track: track,
        cards: cards,
        prev: prev,
        next: next,
        dotsWrap: dotsWrap,
        dots: [],
        index: 0,
        startX: 0,
        currentX: 0,
        dragging: false
      };

      if (dotsWrap) {
        dotsWrap.innerHTML = '';
        cards.forEach(function (card, index) {
          var dot = document.createElement('button');
          dot.className = 'testimonial-dot';
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Show testimonial ' + (index + 1));
          dot.addEventListener('click', function () {
            Testimonials.goTo(carousel, index);
          });
          dotsWrap.appendChild(dot);
          carousel.dots.push(dot);
        });
      }

      if (prev) {
        prev.addEventListener('click', function () {
          Testimonials.goTo(carousel, carousel.index - 1);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          Testimonials.goTo(carousel, carousel.index + 1);
        });
      }

      viewport.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') Testimonials.goTo(carousel, carousel.index - 1);
        if (e.key === 'ArrowRight') Testimonials.goTo(carousel, carousel.index + 1);
      });

      viewport.addEventListener('pointerdown', function (e) {
        carousel.dragging = true;
        carousel.startX = e.clientX;
        carousel.currentX = e.clientX;
        viewport.setPointerCapture(e.pointerId);
      });

      viewport.addEventListener('pointermove', function (e) {
        if (!carousel.dragging) return;
        carousel.currentX = e.clientX;
      });

      viewport.addEventListener('pointerup', function (e) {
        if (!carousel.dragging) return;
        carousel.dragging = false;
        var delta = carousel.currentX - carousel.startX;
        if (Math.abs(delta) > 42) {
          Testimonials.goTo(carousel, carousel.index + (delta < 0 ? 1 : -1));
        }
        if (viewport.hasPointerCapture(e.pointerId)) {
          viewport.releasePointerCapture(e.pointerId);
        }
      });

      viewport.addEventListener('pointercancel', function () {
        carousel.dragging = false;
      });

      window.addEventListener('resize', function () {
        Testimonials.update(carousel, false);
      });

      Testimonials.update(carousel, false);
      return carousel;
    },

    goTo: function (carousel, index) {
      var max = carousel.cards.length - 1;
      var nextIndex = index < 0 ? max : (index > max ? 0 : index);
      if (nextIndex === carousel.index) return;

      carousel.index = nextIndex;
      Testimonials.update(carousel, true);
    },

    update: function (carousel, animate) {
      var active = carousel.cards[carousel.index];
      var x = active ? active.offsetLeft : 0;

      carousel.track.style.transform = 'translate3d(' + (-x) + 'px, 0, 0)';

      carousel.cards.forEach(function (card, index) {
        var isActive = index === carousel.index;
        card.classList.toggle('is-active', isActive);
        card.classList.toggle('is-entering', isActive && animate && !reducedMotion);
        card.setAttribute('aria-hidden', isActive ? 'false' : 'true');

        if (isActive && animate && !reducedMotion) {
          card.addEventListener('animationend', function () {
            card.classList.remove('is-entering');
          }, { once: true });
        }
      });

      carousel.dots.forEach(function (dot, index) {
        var isActive = index === carousel.index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Click feedback                                                      */
  /* ------------------------------------------------------------------ */
  var ClickFeedback = {
    init: function () {
      var targets = document.querySelectorAll('[data-click-feedback]');
      if (!targets.length || reducedMotion) return;

      targets.forEach(function (target) {
        target.addEventListener('pointerdown', function (e) {
          var rect = target.getBoundingClientRect();
          target.style.setProperty('--ripple-x', (e.clientX - rect.left) + 'px');
          target.style.setProperty('--ripple-y', (e.clientY - rect.top) + 'px');
          target.classList.remove('has-ripple');
          void target.offsetWidth;
          target.classList.add('has-ripple');
        });

        target.addEventListener('animationend', function (e) {
          if (e.animationName === 'directions-ripple') {
            target.classList.remove('has-ripple');
          }
        });
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cookie consent                                                      */
  /* ------------------------------------------------------------------ */
  var CookieConsent = {
    banner: null,
    currentChoice: null,

    init: function () {
      this.banner = document.querySelector('[data-cookie-consent]');
      if (!this.banner) return;

      this.bind();
      this.show();
    },

    bind: function () {
      var self = this;
      var actions = this.banner.querySelectorAll('[data-cookie-action]');

      actions.forEach(function (button) {
        button.addEventListener('click', function () {
          self.currentChoice = button.getAttribute('data-cookie-action') || null;
          self.dismiss();
        });
      });
    },

    show: function () {
      var self = this;
      this.banner.hidden = false;

      if (reducedMotion) {
        this.banner.classList.add('is-visible');
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          self.banner.classList.add('is-visible');
        });
      });
    },

    dismiss: function () {
      var self = this;
      this.banner.classList.add('is-leaving');
      this.banner.classList.remove('is-visible');

      setTimeout(function () {
        self.banner.hidden = true;
        self.banner.classList.remove('is-leaving');
      }, reducedMotion ? 0 : 320);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Careers page                                                        */
  /* ------------------------------------------------------------------ */
  var Careers = {
    root: null,
    list: null,
    detail: null,
    search: null,
    chips: [],
    empty: null,
    toast: null,
    modal: null,
    applicationRole: null,
    selectedId: '',
    activeFilter: 'All',
    jobs: [
      {
        id: 'Receptionist',
        title: 'Receptionist',
        department: 'Administration',
        type: 'Full-Time',
        location: 'King William\'s Town',
        level: 'Junior',
        status: 'Hiring',
        salary: 'R9,500 - R12,500 per month',
        closingDate: '31 July 2026',
        preview: 'You will be the first point of contact for every guest visiting or contacting the restaurant. You will welcome',
        about: 'You will be the first point of contact for every guest visiting or contacting the restaurant. You will welcome guests with professionalism, manage reservations, answer enquiries, and ensure every customer receives outstanding service before they even reach their table.',
        responsibilities: ['Welcome guests with a warm and professional attitude.', 'Manage restaurant reservations and seating schedules.', 'Answer phone calls, emails, and customer enquiries.', 'Coordinate guest arrivals with the floor team.', 'Assist with special requests and reservations.'],
        requirements: ['1+ years in reception or customer service.', 'Excellent verbal communication skills.', 'Professional appearance and friendly personality.', 'Availability for evenings, weekends, and public holidays.'],
        nice: ['Restaurant reservation system experience.', 'POS knowledge.', 'Multilingual communication.'],
        benefits: ['Uniform provided.', 'Paid leave.', 'Career growth opportunities.', 'Staff discounts.'],
        process: ['Apply', 'In-person Interview', 'Final chat'],
        tags: ['Receptionist', 'Full-Time']
      },
      {
        id: 'Waiter / Waitress',
        title: 'Waiter / Waitress',
        department: 'Restaurant Operations',
        type: 'Full-Time',
        location: 'King Williams Town',
        level: 'Mid-Level',
        status: 'Hiring',
        salary: 'R8,500 – R12,000 per month + Tips',
        closingDate: '16 August 2026',
        preview: 'You will provide exceptional dining experiences by delivering attentive service, accurately taking orders, and',
        about: 'You will provide exceptional dining experiences by delivering attentive service, accurately taking orders, and ensuring every guest leaves satisfied.',
        responsibilities: ['Welcome and seat guests.', 'Present menus and explain specials.', 'Take food and beverage orders accurately.', 'Recommend menu items.', 'Process payments.','Resolve guest concerns professionally.' ],
        requirements: ['Grade 12 / Matric', 'Previous restaurant experience preferred.', 'Excellent communication skills.', 'Ability to stand for long periods.','Weekend and evening availability.'],
        nice: ['POS experience., or ecommerce experience.', 'Wine knowledge.', 'Customer service training.','Upselling skills.'],
        benefits: ['Competitive salary.', 'Tips.', 'Uniform.', 'Promotion opportunities.'],
        process: ['Apply', 'In-person Interview', 'Final Decision'],
        tags: ['Waiter / Waitress', 'Operations', 'Full-Time']
      },
      {
        id: 'brand-designer',
        title: 'Brand Designer',
        department: 'Design',
        type: 'Full-Time',
        location: 'Hybrid',
        level: 'Mid-Level',
        status: 'Hybrid',
        salary: 'R30,000 - R44,000 per month',
        closingDate: '9 August 2026',
        preview: 'Shape menus, campaign systems, digital assets, and the visual language guests recognize across every touchpoint.',
        about: 'You will help translate the restaurant\'s voice into elegant, useful brand work across print, web, social, signage, and seasonal launches.',
        responsibilities: ['Design campaign, menu, and event assets.', 'Maintain brand consistency across digital and print.', 'Create templates for weekly content workflows.', 'Work with photography and venue teams on art direction.'],
        requirements: ['A refined portfolio of brand and layout work.', 'Strong typography and production skills.', 'Comfort preparing files for print and web.', 'Ability to respond quickly without losing craft.'],
        nice: ['Hospitality or food brand experience.', 'Motion design basics.', 'Photography art direction experience.'],
        benefits: ['Hybrid work week.', 'Creative production budget.', 'Team dining allowance.', 'Paid design conference day.'],
        process: ['Apply', 'Portfolio review', 'Creative interview', 'Offer'],
        tags: ['Design', 'Hybrid', 'Full-Time']
      },
      {
        id: 'growth-marketing-coordinator',
        title: 'Growth Marketing Coordinator',
        department: 'Marketing',
        type: 'Full-Time',
        location: 'Hybrid',
        level: 'Junior',
        status: 'Closing Soon',
        salary: 'R20,000 - R28,000 per month',
        closingDate: '12 July 2026',
        preview: 'Coordinate campaigns, partnerships, newsletters, and launches that keep regulars close and new guests curious.',
        about: 'You will run the weekly marketing operating rhythm, keep campaigns moving, and turn venue moments into useful audience touchpoints.',
        responsibilities: ['Coordinate email, social, and partner campaign calendars.', 'Track campaign performance and booking impact.', 'Brief creative assets and collect approvals.', 'Support event launches and private dining promotions.'],
        requirements: ['1+ year in marketing, content, or partnerships.', 'Organized project coordination skills.', 'Comfort writing concise campaign copy.', 'Basic analytics and reporting confidence.'],
        nice: ['Hospitality or events marketing experience.', 'Email platform experience.', 'Light photo or video editing ability.'],
        benefits: ['Hybrid schedule.', 'Mentorship from senior leadership.', 'Staff meals.', 'Monthly learning stipend.'],
        process: ['Apply', 'Screening', 'Campaign exercise', 'Final chat'],
        tags: ['Marketing', 'Hybrid', 'Full-Time']
      },
      {
        id: 'people-operations-partner',
        title: 'People Operations Partner',
        department: 'HR',
        type: 'Full-Time',
        location: 'King William\'s Town',
        level: 'Senior',
        status: 'Hiring',
        salary: 'R32,000 - R46,000 per month',
        closingDate: '23 August 2026',
        preview: 'Build the hiring, onboarding, and development systems that help great hospitality people stay and grow.',
        about: 'This role partners closely with venue leadership to make hiring, onboarding, scheduling, and team development feel structured and human.',
        responsibilities: ['Own hiring pipelines for venue and support roles.', 'Improve onboarding and training documentation.', 'Support team feedback, performance, and retention rhythms.', 'Keep people policies clear and compliant.'],
        requirements: ['4+ years in HR, people operations, or talent.', 'Experience supporting shift-based teams.', 'Strong documentation and communication habits.', 'Calm handling of sensitive people matters.'],
        nice: ['Hospitality HR experience.', 'Payroll or scheduling system knowledge.', 'Facilitation or training experience.'],
        benefits: ['Leadership development path.', 'Wellness support.', 'Staff meals.', 'Paid professional development.'],
        process: ['Apply', 'Phone screen', 'Leadership interview', 'Reference checks'],
        tags: ['HR', 'Full-Time']
      },
      {
        id: 'culinary-intern',
        title: 'Culinary Intern',
        department: 'Design',
        type: 'Internship',
        location: 'King William\'s Town',
        level: 'Entry',
        status: 'Upcoming',
        salary: 'Paid internship',
        closingDate: 'Applications open 1 September 2026',
        preview: 'A paid kitchen internship for emerging cooks who want to learn disciplined prep, plating, and service flow.',
        about: 'This upcoming internship gives early-career cooks structured exposure to prep, pastry, plating, and live service under close mentorship.',
        responsibilities: ['Support daily prep lists and station setup.', 'Learn safe, clean, consistent kitchen habits.', 'Assist with plating and service support.', 'Join weekly learning and feedback sessions.'],
        requirements: ['Culinary school enrollment or equivalent interest.', 'Reliable schedule and strong attention to cleanliness.', 'Willingness to learn from direct feedback.', 'Availability for a 12-week placement.'],
        nice: ['Basic knife skills.', 'Interest in pastry or fermentation.', 'Previous cafe or restaurant exposure.'],
        benefits: ['Paid placement.', 'Mentorship from senior cooks.', 'Staff meals.', 'Certificate of completion.'],
        process: ['Register interest', 'Intro call', 'Kitchen visit', 'Placement'],
        tags: ['Internship']
      },
      {
        id: 'event-sales-manager',
        title: 'Event Sales Manager',
        department: 'Sales',
        type: 'Full-Time',
        location: 'Hybrid',
        level: 'Senior',
        status: 'Filled',
        salary: 'R35,000 - R50,000 per month',
        closingDate: 'Closed',
        preview: 'Manage private dining inquiries, event proposals, and high-touch group booking experiences.',
        about: 'This role has been filled, but the profile remains visible so future applicants can understand the kind of commercial hospitality roles we hire for.',
        responsibilities: ['Manage event inquiries and proposals.', 'Coordinate private dining details with operations.', 'Own follow-up and client relationship quality.', 'Track event revenue and conversion.'],
        requirements: ['Premium events or hospitality sales experience.', 'Strong proposal and client communication skills.', 'Commercial discipline and operational empathy.', 'Availability around key event dates.'],
        nice: ['CRM experience.', 'Corporate events network.', 'Menu and beverage pairing knowledge.'],
        benefits: ['Commission participation.', 'Hybrid schedule.', 'Staff dining allowance.', 'Leadership pathway.'],
        process: ['Closed', 'Talent pool', 'Future match'],
        tags: ['Sales', 'Hybrid', 'Full-Time'],
        closed: true
      }
    ],

    init: function () {
      this.root = document.querySelector('[data-careers-page]');
      if (!this.root) return;

      this.list = this.root.querySelector('[data-job-list]');
      this.detail = this.root.querySelector('[data-job-detail]');
      this.search = this.root.querySelector('[data-job-search]');
      this.chips = Array.prototype.slice.call(this.root.querySelectorAll('[data-filter]'));
      this.empty = this.root.querySelector('[data-empty-state]');
      this.toast = document.querySelector('[data-career-toast]');
      this.modal = document.querySelector('[data-application-modal]');
      this.applicationRole = document.querySelector('[data-application-role]');
      this.selectedId = this.getInitialId();

      this.bind();
      this.renderList();
      this.renderDetail(this.getSelectedJob(), false);
    },

    bind: function () {
      var self = this;

      this.search.addEventListener('input', function () {
        self.renderList();
      });

      this.chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          self.activeFilter = chip.getAttribute('data-filter') || 'All';
          self.chips.forEach(function (item) {
            item.classList.toggle('is-active', item === chip);
          });
          self.renderList();
        });
      });

      var reset = this.root.querySelector('[data-reset-filters]');
      if (reset) {
        reset.addEventListener('click', function () {
          self.search.value = '';
          self.activeFilter = 'All';
          self.chips.forEach(function (chip) {
            chip.classList.toggle('is-active', chip.getAttribute('data-filter') === 'All');
          });
          self.renderList();
        });
      }

      document.addEventListener('click', function (e) {
        var close = e.target.closest('[data-close-application]');
        if (close) self.closeApplication();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') self.closeApplication();
      });

      var form = document.querySelector('[data-application-form]');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          form.reset();
          self.closeApplication();
          self.showToast('Application received. We will be in touch.');
        });
      }
    },

    getInitialId: function () {
      var hash = window.location.hash.replace('#job-', '');
      var match = this.jobs.filter(function (job) { return job.id === hash; })[0];
      return (match || this.jobs[0]).id;
    },

    getSelectedJob: function () {
      var selected = this.jobs.filter(function (job) { return job.id === Careers.selectedId; })[0];
      return selected || this.jobs[0];
    },

    getFilteredJobs: function () {
      var term = (this.search.value || '').toLowerCase().trim();
      var filter = this.activeFilter;

      return this.jobs.filter(function (job) {
        var haystack = [job.title, job.department, job.location].join(' ').toLowerCase();
        var matchesSearch = !term || haystack.indexOf(term) !== -1;
        var matchesFilter = filter === 'All' || job.tags.indexOf(filter) !== -1 || job.department === filter || job.type === filter || job.location === filter;
        return matchesSearch && matchesFilter;
      }).sort(function (a, b) {
        if (!!a.closed === !!b.closed) return 0;
        return a.closed ? 1 : -1;
      });
    },

    renderList: function () {
      var self = this;
      var jobs = this.getFilteredJobs();
      this.list.innerHTML = '';
      this.empty.hidden = jobs.length > 0;

      jobs.forEach(function (job, index) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'job-card';
        if (job.id === self.selectedId) card.className += ' is-selected';
        if (job.closed) card.className += ' is-closed';
        card.setAttribute('data-cursor-hover', '');
        card.setAttribute('aria-pressed', job.id === self.selectedId ? 'true' : 'false');
        card.innerHTML =
          '<span class="job-card__top">' +
            '<span class="job-card__title">' + self.escape(job.title) + '</span>' +
            self.badge(job) +
          '</span>' +
          '<span class="job-card__preview">' + self.escape(job.preview) + '</span>' +
          '<span class="job-card__meta">' +
            '<span>' + self.escape(job.department) + '</span>' +
            '<span>' + self.escape(job.type) + '</span>' +
            '<span>' + self.escape(job.location) + '</span>' +
            '<span>' + self.escape(job.level) + '</span>' +
          '</span>';

        card.addEventListener('click', function () {
          self.selectJob(job.id);
        });

        self.list.appendChild(card);
        setTimeout(function () {
          card.classList.add('is-visible');
        }, reducedMotion ? 0 : index * 70);
      });
    },

    selectJob: function (id) {
      if (id === this.selectedId) return;
      this.selectedId = id;
      if (history.replaceState) history.replaceState(null, '', '#job-' + id);
      this.renderList();
      this.renderDetail(this.getSelectedJob(), true);
    },

    renderDetail: function (job, animate) {
      var self = this;
      var render = function () {
        self.detail.innerHTML =
          '<div class="career-detail__header">' +
            self.badge(job) +
            '<h2 class="h2 career-detail__title">' + self.escape(job.title) + '</h2>' +
            '<div class="career-detail__meta">' +
              '<span>' + self.escape(job.department) + '</span>' +
              '<span>' + self.escape(job.location) + '</span>' +
              '<span>' + self.escape(job.type) + '</span>' +
              '<span>' + self.escape(job.level) + '</span>' +
            '</div>' +
            '<p class="career-detail__salary">' + self.escape(job.salary) + '</p>' +
          '</div>' +
          '<div class="career-detail__grid">' +
            self.detailBlock('About the Role', '<p class="career-detail__text">' + self.escape(job.about) + '</p>', true) +
            self.detailBlock('Responsibilities', self.listMarkup(job.responsibilities), false) +
            self.detailBlock('Requirements', self.listMarkup(job.requirements), false) +
            self.detailBlock('Nice-to-have Skills', self.listMarkup(job.nice), false) +
            self.detailBlock('Benefits', self.listMarkup(job.benefits), false) +
            self.detailBlock('Hiring Process', self.processMarkup(job.process), true) +
          '</div>' +
          '<div class="career-detail__footer">' +
            '<p class="career-detail__closing"><strong>Closing Date</strong><br>' + self.escape(job.closingDate) + '</p>' +
            '<div class="career-detail__actions">' +
              '<button class="btn career-apply" type="button" data-apply-job' + (job.closed ? ' disabled' : '') + '>' + (job.closed ? 'Position Closed' : 'Apply Now') + '</button>' +
              '<button class="btn btn-ghost career-action" type="button" data-share-job>Share</button>' +
              '<button class="btn btn-ghost career-action" type="button" data-copy-job>Copy Link</button>' +
            '</div>' +
          '</div>';

        self.bindDetailActions(job);
        self.detail.classList.remove('is-changing');
        if (window.innerWidth <= 900) self.detail.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      };

      if (animate && !reducedMotion) {
        this.detail.classList.add('is-changing');
        setTimeout(render, 220);
      } else {
        render();
      }
    },

    bindDetailActions: function (job) {
      var self = this;
      var apply = this.detail.querySelector('[data-apply-job]');
      var share = this.detail.querySelector('[data-share-job]');
      var copy = this.detail.querySelector('[data-copy-job]');

      if (apply && !job.closed) {
        apply.addEventListener('click', function () {
          self.openApplication(job);
        });
      }
      if (share) {
        share.addEventListener('click', function (e) {
          self.ripple(share, e);
          self.shareJob(job);
        });
      }
      if (copy) {
        copy.addEventListener('click', function (e) {
          self.ripple(copy, e);
          self.copyJob(job, 'Job link copied.');
        });
      }
    },

    openApplication: function (job) {
      if (!this.modal) return;
      this.applicationRole.textContent = job.title + ' - ' + job.department;
      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('application-open');
      var first = this.modal.querySelector('input, button, textarea');
      if (first) first.focus();
    },

    closeApplication: function () {
      if (!this.modal || !this.modal.classList.contains('is-open')) return;
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('application-open');
    },

    shareJob: function (job) {
      var url = this.jobUrl(job);
      if (navigator.share) {
        navigator.share({ title: job.title + ' at The King Club', text: job.preview, url: url }).catch(function () {});
      } else {
        this.copyJob(job, 'Job link copied.');
      }
    },

    copyJob: function (job, message) {
      var self = this;
      var url = this.jobUrl(job);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          self.showToast(message);
        }).catch(function () {
          self.fallbackCopy(url, message);
        });
      } else {
        this.fallbackCopy(url, message);
      }
    },

    fallbackCopy: function (text, message) {
      var temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.left = '-999px';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(temp);
      this.showToast(message);
    },

    showToast: function (message) {
      var self = this;
      if (!this.toast) return;
      this.toast.textContent = message;
      this.toast.classList.add('is-visible');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(function () {
        self.toast.classList.remove('is-visible');
      }, 2600);
    },

    ripple: function (button, event) {
      var rect = button.getBoundingClientRect();
      button.style.setProperty('--ripple-x', (event.clientX - rect.left) + 'px');
      button.style.setProperty('--ripple-y', (event.clientY - rect.top) + 'px');
      button.classList.remove('has-ripple');
      void button.offsetWidth;
      button.classList.add('has-ripple');
    },

    jobUrl: function (job) {
      return window.location.href.split('#')[0] + '#job-' + job.id;
    },

    detailBlock: function (title, body, wide) {
      return '<section class="career-detail__block' + (wide ? ' career-detail__block--wide' : '') + '">' +
        '<h3 class="career-detail__label">' + this.escape(title) + '</h3>' + body +
      '</section>';
    },

    listMarkup: function (items) {
      return '<ul class="career-detail__list">' + items.map(function (item) {
        return '<li>' + Careers.escape(item) + '</li>';
      }).join('') + '</ul>';
    },

    processMarkup: function (items) {
      return '<div class="career-detail__process">' + items.map(function (item) {
        return '<span>' + Careers.escape(item) + '</span>';
      }).join('') + '</div>';
    },

    badge: function (job) {
      var label = job.closed ? 'Closed' : (job.status === 'Upcoming' ? 'Coming Soon' : job.status);
      var mod = label.toLowerCase().replace(/\s+/g, '-');
      return '<span class="career-badge career-badge--' + mod + '">' + this.escape(label) + '</span>';
    },

    escape: function (value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }
  };

  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    Curtain.init();
    Cursor.init();
    ScrollReveal.init();
    ImageReveal.init();
    Nav.init();
    ContactForm.init();
    FAQAccordion.init();
    GalleryLightbox.init();
    Testimonials.init();
    ClickFeedback.init();
    CookieConsent.init();
    Careers.init();
  });
})();
