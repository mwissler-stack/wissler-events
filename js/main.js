// Matthew Wissler — Event Production Portfolio
// Shared behavior: mobile nav, scroll reveal, projects filter tabs.

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

  // Scroll reveal
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

  // Projects filter tabs
  var tabs = document.querySelectorAll(".tab[data-filter]");
  var cards = document.querySelectorAll(".reveal-project[data-category]");
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
      });
    });
  }

  // Scroll-driven grow/shrink/reveal for project cards on the Projects page
  if (cards.length) {
    if (reduceMotion) {
      document.body.classList.add("no-motion");
    } else {
      var cardList = Array.prototype.slice.call(cards);

      var updateFocus = function () {
        var vh = window.innerHeight;
        var center = vh / 2;
        var threshold = vh * 0.42;

        // Read phase: measure all cards first to avoid layout thrashing.
        var rects = cardList.map(function (card) {
          return card.getBoundingClientRect();
        });

        // Write phase: apply the computed focus value to each card.
        rects.forEach(function (rect, i) {
          var cardCenter = rect.top + rect.height / 2;
          var dist = Math.abs(cardCenter - center);
          var raw = Math.max(0, 1 - dist / threshold);
          var eased = raw * raw * (3 - 2 * raw); // smoothstep
          var card = cardList[i];
          card.style.setProperty("--focus", eased.toFixed(3));
          card.classList.toggle("is-focused", eased > 0.55);
        });
      };

      var scheduled = false;
      var onScroll = function () {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(function () {
            updateFocus();
            scheduled = false;
          });
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      updateFocus();
    }
  }
})();
