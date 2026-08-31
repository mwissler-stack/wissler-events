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

  // Jump-nav mobile toggle (collapsed by default on narrow screens; the
  // wrapped full-name pills eat too much sticky screen space otherwise)
  var jumpToggle = document.querySelector(".jump-nav-toggle");
  var jumpTrack = document.querySelector(".jump-nav-track");
  if (jumpToggle && jumpTrack) {
    jumpToggle.addEventListener("click", function () {
      var isOpen = jumpTrack.classList.toggle("is-open");
      jumpToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    jumpTrack.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        jumpTrack.classList.remove("is-open");
        jumpToggle.setAttribute("aria-expanded", "false");
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

  // Projects page: cards grow on hover/keyboard-focus on devices that
  // actually support hover (desktop/trackpad), and toggle open on click/tap
  // everywhere — which on touch devices (no real hover) makes the whole list
  // behave as a plain tap-to-expand/collapse accordion. Growth is a plain
  // top-anchored real height change (no transform tricks), so neighboring
  // rows shift cleanly with no gaps. Hover is JS-controlled via an
  // .is-hovering class (rather than raw CSS :hover) so it can be suspended —
  // used by the jump-nav below to stop the scroll from accidentally popping
  // open rows the cursor happens to pass over.
  if (cards.length) {
    var cardList = Array.prototype.slice.call(cards);
    var rpList = cardList.map(function (card) {
      return card.querySelector(".rp-card");
    });
    var hoverSuspended = false;
    var pendingResume = null; // cleanup fn for an in-flight jump, if any
    var supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    var setActive = function (index, active) {
      var link = jumpLinks[index];
      if (link) link.classList.toggle("is-active", active);
    };

    rpList.forEach(function (rp, i) {
      if (!rp) return;

      if (supportsHover) {
        rp.addEventListener("mouseenter", function () {
          if (hoverSuspended) return;
          rp.classList.add("is-hovering");
          setActive(i, true);
        });
        rp.addEventListener("mouseleave", function () {
          rp.classList.remove("is-hovering");
          setActive(i, rp.classList.contains("is-open"));
        });
      }
      rp.addEventListener("focus", function () {
        setActive(i, true);
      });
      rp.addEventListener("blur", function () {
        setActive(i, rp.classList.contains("is-open"));
      });
      rp.addEventListener("click", function () {
        rp.classList.toggle("is-open");
        setActive(i, rp.classList.contains("is-open") || rp.classList.contains("is-hovering"));
      });
    });

    // Jump-nav: scroll to the project and force it open immediately (the
    // cursor is up here in the nav bar, not over the row, so hover alone
    // wouldn't open it). Hover is suspended everywhere else in the meantime
    // so the scroll can't accidentally pop open whatever the cursor passes
    // over, and it resumes once the user actually mouses into the opened
    // row and back out — with a timeout as a safety net in case they don't.
    jumpLinks.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var rp = rpList[i];
        var el = cardList[i];
        if (!rp || !el) return;

        if (pendingResume) {
          pendingResume();
        }

        hoverSuspended = true;
        rpList.forEach(function (otherRp, j) {
          if (otherRp && j !== i) {
            otherRp.classList.remove("is-open", "is-hovering");
            setActive(j, false);
          }
        });
        rp.classList.add("is-open");
        setActive(i, true);

        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

        var entered = false;
        var timeoutId;
        var resume = function () {
          rp.classList.remove("is-open");
          setActive(i, false);
          hoverSuspended = false;
          rp.removeEventListener("mouseenter", onEnter);
          rp.removeEventListener("mouseleave", onLeave);
          clearTimeout(timeoutId);
          if (pendingResume === resume) pendingResume = null;
        };
        var onEnter = function () {
          entered = true;
        };
        var onLeave = function () {
          if (entered) resume();
        };

        rp.addEventListener("mouseenter", onEnter);
        rp.addEventListener("mouseleave", onLeave);
        timeoutId = setTimeout(resume, 5000);
        pendingResume = resume;
      });
    });
  }
})();
