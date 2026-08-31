// Matthew Wissler — Event Production Portfolio
// Shared behavior: mobile nav, scroll reveal, projects filter tabs, and (on the
// Projects page) a damped "gravity well" scroll engine plus jump-nav.

(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal (simple fade-in-on-view, used on non-projects pages)
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("in-view");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  }

  // Projects filter tabs (also hides/shows matching jump-nav links)
  var tabs = document.querySelectorAll(".tab[data-filter]");
  var cards = document.querySelectorAll(".reveal-project[data-category]");
  var jumpLinks = document.querySelectorAll(".jump-nav a[data-category]");

  if (tabs.length && cards.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", "false");
        });
        tab.setAttribute("aria-selected", "true");
        var filter = tab.getAttribute("data-filter");
        cards.forEach(function (card) {
          var match = filter === "all" || card.getAttribute("data-category") === filter;
          card.classList.toggle("is-hidden", !match);
        });
        jumpLinks.forEach(function (link) {
          var match = filter === "all" || link.getAttribute("data-category") === filter;
          link.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  // Scroll-driven grow/shrink/reveal, damped scroll, and jump-nav for the
  // Projects page only.
  if (cards.length) {
    if (reduceMotion) {
      document.body.classList.add("no-motion");
      // Jump-nav still works for reduced-motion users, via plain native scroll.
      jumpLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
          var id = link.getAttribute("href").slice(1);
          var el = document.getElementById(id);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: "auto", block: "center" });
          }
        });
      });
    } else {
      var cardList = Array.prototype.slice.call(cards);

      // Reads every card's position and writes a --focus value (0–1) that
      // CSS uses for size, opacity, and border-radius. Returns the highest
      // focus value found, used to drive scroll damping and jump-nav state.
      var computeFocus = function () {
        var vh = window.innerHeight;
        var center = vh / 2;
        var threshold = vh * 0.48;
        var maxFocus = 0;
        var maxIndex = -1;

        var rects = cardList.map(function (card) {
          return card.getBoundingClientRect();
        });

        rects.forEach(function (rect, i) {
          var cardCenter = rect.top + rect.height / 2;
          var dist = Math.abs(cardCenter - center);
          var raw = Math.max(0, 1 - dist / threshold);
          var eased = raw * raw * (3 - 2 * raw); // smoothstep
          var card = cardList[i];
          card.style.setProperty("--focus", eased.toFixed(3));
          card.classList.toggle("is-focused", eased > 0.55);
          if (eased > maxFocus) {
            maxFocus = eased;
            maxIndex = i;
          }
        });

        if (jumpLinks.length) {
          jumpLinks.forEach(function (link, i) {
            link.classList.toggle("is-active", i === maxIndex && maxFocus > 0.4);
          });
        }

        return maxFocus;
      };

      // Damped "gravity well" scroll: mouse wheel / trackpad input pushes a
      // target position, but `current` is only ever allowed to move toward
      // it at a capped speed (px/frame) — not a proportional spring. That's
      // the fix for fast scrolling "rocketing" past a card without it ever
      // opening: no matter how far ahead `target` gets, `current` still has
      // to physically travel through every card's focus zone at a bounded
      // speed, and that speed drops further while a card is actively open.
      var current = window.scrollY;
      var target = window.scrollY;
      var ticking = false;
      var programmatic = false;
      var lastMaxFocus = 0;
      var BASE_SPEED = 0.55; // how much of each wheel tick reaches the target
      var MAX_STEP = 10; // px per frame ceiling under normal conditions
      var MIN_STEP = 1.2; // px per frame floor, so it still reaches target

      var maxScroll = function () {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      };

      var tick = function () {
        var ceiling = Math.max(MIN_STEP, MAX_STEP * (1 - lastMaxFocus * 0.75));
        var diff = target - current;
        var step = Math.sign(diff) * Math.min(Math.abs(diff), ceiling);
        current += step;
        if (Math.abs(target - current) < 0.5) {
          current = target;
        }
        programmatic = true;
        window.scrollTo(0, current);
        lastMaxFocus = computeFocus();
        if (current !== target) {
          requestAnimationFrame(tick);
        } else {
          ticking = false;
        }
      };

      window.addEventListener(
        "wheel",
        function (e) {
          e.preventDefault();
          target += e.deltaY * BASE_SPEED;
          target = Math.max(0, Math.min(maxScroll(), target));
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(tick);
          }
        },
        { passive: false }
      );

      // Keyboard scrolling and scrollbar dragging stay native (full speed,
      // fully accessible) — resync our virtual position whenever a scroll
      // happens that our own tick() didn't cause.
      window.addEventListener(
        "scroll",
        function () {
          if (!programmatic) {
            current = window.scrollY;
            target = window.scrollY;
          }
          programmatic = false;
        },
        { passive: true }
      );

      window.addEventListener("resize", computeFocus);

      // Jump-nav: ease to the chosen project using the same animation engine
      // as wheel scrolling, so the motion feels consistent either way.
      jumpLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          var id = link.getAttribute("href").slice(1);
          var el = document.getElementById(id);
          if (!el) return;
          var rect = el.getBoundingClientRect();
          var destination = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
          target = Math.max(0, Math.min(maxScroll(), destination));
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(tick);
          }
        });
      });

      computeFocus();
    }
  }
})();
