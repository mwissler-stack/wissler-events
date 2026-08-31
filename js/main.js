// Matthew Wissler — Event Production Portfolio
// Shared behavior: mobile nav, scroll reveal, projects filter tabs, and (on
// the Projects page) hover/focus/tap-to-expand cards plus a jump-nav bar.
// Scrolling itself is left completely native — no interception.

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

  // Projects page: cards grow on hover/keyboard-focus (CSS handles the
  // animation itself), and toggle open on click/tap for touch devices where
  // hover doesn't apply. Scrolling is fully native — nothing here touches it.
  if (cards.length) {
    var cardList = Array.prototype.slice.call(cards);

    // Must match the collapsed/expanded heights set in the CSS (.rp-card and
    // .rp-card:hover) so the anchor math lines up with what actually renders.
    var COLLAPSED_H = 64;
    var EXPANDED_H = 420;
    var DELTA_H = EXPANDED_H - COLLAPSED_H;
    var DAMPING = 0.82; // <1 softens overlap into the row above at extreme edges

    cardList.forEach(function (card, i) {
      var rp = card.querySelector(".rp-card");
      if (!rp) return;

      var jumpLink = jumpLinks[i];
      var setActive = function (active) {
        if (jumpLink) jumpLink.classList.toggle("is-active", active);
      };

      // Where the pointer entered (0 = top of the row, 1 = bottom) becomes
      // the point the row grows from: translate it up by the share of the
      // height increase that lies above that point, so that point stays put.
      var anchorFromClientY = function (clientY) {
        var rect = rp.getBoundingClientRect();
        var relY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
        relY = Math.max(0, Math.min(1, relY));
        rp.style.setProperty("--anchor-shift", (-relY * DELTA_H * DAMPING).toFixed(1) + "px");
      };

      var resetAnchor = function () {
        if (!rp.classList.contains("is-open")) {
          rp.style.setProperty("--anchor-shift", "0px");
        }
      };

      rp.addEventListener("mouseenter", function (e) {
        anchorFromClientY(e.clientY);
        setActive(true);
      });
      rp.addEventListener("mouseleave", function () {
        resetAnchor();
        setActive(rp.classList.contains("is-open"));
      });
      rp.addEventListener("focus", function () {
        // No pointer position on keyboard focus — grow evenly from center.
        rp.style.setProperty("--anchor-shift", (-0.5 * DELTA_H * DAMPING).toFixed(1) + "px");
        setActive(true);
      });
      rp.addEventListener("blur", function () {
        resetAnchor();
        setActive(rp.classList.contains("is-open"));
      });
      rp.addEventListener("click", function (e) {
        if (typeof e.clientY === "number") {
          anchorFromClientY(e.clientY);
        }
        rp.classList.toggle("is-open");
        setActive(rp.classList.contains("is-open"));
      });
    });

    // Jump-nav: plain native smooth scroll to bring a project into view.
    // Hovering/focusing it once scrolled there is what triggers the expand.
    jumpLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        var el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
      });
    });
  }
})();
