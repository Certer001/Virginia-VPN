(function () {
  function formatNewsDate(iso) {
    if (!iso) return "";
    try {
      var s = String(iso);
      var d = new Date(s.length === 10 ? s + "T12:00:00" : s);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return iso;
    }
  }

  function getSortedNewsItems() {
    if (!window.VIRGINIA_VPN_NEWS || !Array.isArray(window.VIRGINIA_VPN_NEWS)) return [];
    var items = window.VIRGINIA_VPN_NEWS.slice().filter(function (entry) {
      return entry && (String(entry.title || "").trim() || String(entry.body || "").trim());
    });
    items.sort(function (a, b) {
      var da = (a && a.date) || "";
      var db = (b && b.date) || "";
      var byDate = db.localeCompare(da);
      if (byDate !== 0) return byDate;
      var ta = String((a && a.title) || "");
      var tb = String((b && b.title) || "");
      return ta.localeCompare(tb, "ru");
    });
    return items;
  }

  function buildNewsArticleElement(item) {
    var article = document.createElement("article");
    article.className = "news-card reveal";
    var time = document.createElement("time");
    time.className = "news-card__date";
    time.setAttribute("datetime", item.date || "");
    time.textContent = formatNewsDate(item.date);
    var h3 = document.createElement("h3");
    h3.className = "news-card__title";
    h3.textContent = item.title || "";
    var bodyEl = document.createElement("div");
    bodyEl.className = "news-card__body";
    var raw = String(item.body || "");
    var paragraphs = raw.split(/\n\n+/).filter(function (p) {
      return p.trim().length > 0;
    });
    paragraphs.forEach(function (block) {
      var p = document.createElement("p");
      p.className = "news-card__text";
      p.textContent = block.replace(/\n+/g, " ").trim();
      bodyEl.appendChild(p);
    });
    article.appendChild(time);
    article.appendChild(h3);
    article.appendChild(bodyEl);
    return article;
  }

  function renderNews() {
    var container = document.getElementById("news-list");
    if (!container) return;
    var items = getSortedNewsItems();
    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "news-empty reveal";
      empty.textContent = "Новостей пока нет. Добавьте записи в файл news-data.js.";
      container.appendChild(empty);
      return;
    }
    var frag = document.createDocumentFragment();
    items.forEach(function (item) {
      frag.appendChild(buildNewsArticleElement(item));
    });
    container.appendChild(frag);
  }

  function renderNewsPreview() {
    var container = document.getElementById("news-preview-inner");
    if (!container) return;
    var items = getSortedNewsItems();
    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "news-preview__empty reveal";
      empty.textContent = "Новостей пока нет.";
      container.appendChild(empty);
      return;
    }
    container.appendChild(buildNewsArticleElement(items[0]));
  }

  renderNews();
  renderNewsPreview();

  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var header = document.querySelector(".header");
  var backdrop = document.getElementById("nav-backdrop");
  var yearEl = document.getElementById("year");
  var themeToggle = document.getElementById("theme-toggle");
  var THEME_STORAGE_KEY = "virginia-vpn-theme";

  function persistThemeChoice(theme) {
    if (theme !== "dark" && theme !== "light") return;
    try {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify({
          theme: theme,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {}
  }

  try {
    var legacy = localStorage.getItem(THEME_STORAGE_KEY);
    if (legacy === "dark" || legacy === "light") {
      persistThemeChoice(legacy);
    }
  } catch (e) {}

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function syncThemeToggleLabel() {
    if (!themeToggle) return;
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Включить светлую тему" : "Включить тёмную тему"
    );
  }

  if (themeToggle) {
    syncThemeToggleLabel();
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      persistThemeChoice(next);
      syncThemeToggleLabel();
    });
  }

  var scrollLockY = 0;

  function isMobileNav() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function unlockPageScroll() {
    var docEl = document.documentElement;
    var hadLock = docEl.classList.contains("nav-open-lock");
    docEl.classList.remove("nav-open-lock");
    document.body.classList.remove("nav-open-lock");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    if (hadLock) {
      window.scrollTo(0, scrollLockY);
    }
  }

  function lockPageScroll() {
    scrollLockY = window.scrollY || window.pageYOffset || 0;
    var docEl = document.documentElement;
    docEl.classList.add("nav-open-lock");
    document.body.classList.add("nav-open-lock");
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollLockY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function resetNavForDesktop() {
    if (!nav || !toggle) return;
    if (isMobileNav()) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Открыть меню");
    unlockPageScroll();
    if (header) {
      header.classList.remove("header--menu-open");
    }
    nav.removeAttribute("aria-hidden");
    if (backdrop) {
      backdrop.classList.remove("is-open");
      backdrop.setAttribute("hidden", "");
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    if (isMobileNav()) {
      if (open) {
        lockPageScroll();
      } else {
        unlockPageScroll();
      }
    } else {
      unlockPageScroll();
    }
    if (header) {
      header.classList.toggle("header--menu-open", open);
    }
    if (isMobileNav()) {
      nav.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) {
        backdrop.classList.toggle("is-open", open);
        backdrop.setAttribute("aria-hidden", open ? "false" : "true");
        if (open) {
          backdrop.removeAttribute("hidden");
        } else {
          backdrop.setAttribute("hidden", "");
        }
      }
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      if (!isMobileNav()) return;
      var open = !nav.classList.contains("is-open");
      setNavOpen(open);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (isMobileNav()) {
          setNavOpen(false);
        }
      });
    });

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setNavOpen(false);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open") && isMobileNav()) {
        setNavOpen(false);
      }
    });

    window.addEventListener("resize", function () {
      resetNavForDesktop();
      if (isMobileNav()) {
        var stillOpen = nav.classList.contains("is-open");
        nav.setAttribute("aria-hidden", stillOpen ? "false" : "true");
        if (backdrop) {
          backdrop.setAttribute("aria-hidden", stillOpen ? "false" : "true");
          if (!stillOpen) {
            backdrop.setAttribute("hidden", "");
            backdrop.classList.remove("is-open");
          }
        }
      }
    });

    if (isMobileNav()) {
      nav.setAttribute("aria-hidden", "true");
      if (backdrop) {
        backdrop.setAttribute("hidden", "");
        backdrop.setAttribute("aria-hidden", "true");
      }
    }
  }

  var scrollTopBtn = document.getElementById("scroll-top");
  if (scrollTopBtn) {
    var SCROLL_TOP_THRESHOLD = 380;
    function syncScrollTopBtn() {
      var y = window.scrollY || window.pageYOffset || 0;
      var show = y > SCROLL_TOP_THRESHOLD;
      scrollTopBtn.classList.toggle("scroll-top--visible", show);
      scrollTopBtn.setAttribute("aria-hidden", show ? "false" : "true");
      scrollTopBtn.tabIndex = show ? 0 : -1;
    }
    scrollTopBtn.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
    window.addEventListener("scroll", syncScrollTopBtn, { passive: true });
    syncScrollTopBtn();
  }

  var reveals = document.querySelectorAll(".reveal");
  if (!reveals.length || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  reveals.forEach(function (el) {
    io.observe(el);
  });
})();
