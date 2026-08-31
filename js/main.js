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

    cardList.forEach(function (card, i) {
      var rp = card.querySelector(".rp-card");
      if (!rp) return;

      var jumpLink = jumpLinks[i];
      var setActive = function (active) {
        if (jumpLink) jumpLink.classList.toggle("is-active", active);
      };

      rp.addEventListener("mouseenter", function () {
        setActive(true);
      });
      rp.addEventListener("mouseleave", function () {
        setActive(rp.classList.contains("is-open"));
      });
      rp.addEventListener("focus", function () {
        setActive(true);
      });
      rp.addEventListener("blur", function () {
        setActive(rp.classList.contains("is-open"));
      });
      rp.addEventListener("click", function () {
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
