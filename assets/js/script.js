
document.addEventListener("DOMContentLoaded", function () {
	// Efeito de header ao rolar
	var header = document.querySelector('header');
	var lastScroll = 0;
	window.addEventListener('scroll', function() {
		var scrollY = window.scrollY || window.pageYOffset;
		if (header) {
			if (scrollY > 24) {
				header.classList.add('scrolled');
			} else {
				header.classList.remove('scrolled');
			}
		}
		lastScroll = scrollY;
	});
	// Menu mobile toggle
	var menuToggle = document.getElementById("menu-toggle");
	var navMobile = document.getElementById("nav-mobile");
	if (menuToggle && navMobile) {
		menuToggle.addEventListener("click", function () {
			var expanded = menuToggle.getAttribute("aria-expanded") === "true";
			menuToggle.setAttribute("aria-expanded", !expanded);
			menuToggle.classList.toggle("active");
			navMobile.classList.toggle("open");
		});
		// Fecha o menu ao clicar em um link
		navMobile.querySelectorAll("a").forEach(function(link) {
			link.addEventListener("click", function() {
				menuToggle.setAttribute("aria-expanded", "false");
				menuToggle.classList.remove("active");
				navMobile.classList.remove("open");
			});
		});
	}

	// Tema (original)
	var THEME_STORAGE_KEY = "preferred-theme";
	var currentTheme = "dark";
	var themeButton = document.getElementById("theme-toggle");
	var themeIcon = document.getElementById("theme-icon");
	var themeColorMeta = document.querySelector('meta[name="theme-color"]');
	var ICON_SUN = '<svg viewBox="0 0 24 24" fill="currentColor" role="presentation" focusable="false"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"/></svg>';
	var ICON_MOON = '<svg viewBox="0 0 24 24" fill="currentColor" role="presentation" focusable="false"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clip-rule="evenodd"/></svg>';

	function applyTheme(theme) {
		if (!["dark", "light"].includes(theme)) {
			return;
		}
		currentTheme = theme;
		document.documentElement.setAttribute("data-theme", theme);
		if (themeColorMeta) {
			themeColorMeta.setAttribute("content", theme === "dark" ? "#0d1422" : "#edf3ff");
		}
		updateThemeButtonLabel();
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch (error) {}
	}

	function updateThemeButtonLabel() {
		if (!themeButton || !themeIcon) {
			return;
		}
		var nextTheme = currentTheme === "dark" ? "light" : "dark";
		themeIcon.innerHTML = nextTheme === "light" ? ICON_SUN : ICON_MOON;
		themeIcon.classList.toggle("is-sun", nextTheme === "light");
		themeIcon.classList.toggle("is-moon", nextTheme !== "light");
		themeButton.setAttribute("aria-label", nextTheme === "light" ? "Ativar modo claro" : "Ativar modo escuro");
		themeButton.setAttribute("aria-pressed", String(currentTheme === "dark"));
	}

	if (themeButton) {
		themeButton.addEventListener("click", function () {
			var nextTheme = currentTheme === "dark" ? "light" : "dark";
			applyTheme(nextTheme);
		});
	}

	try {
		var storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (storedTheme && ["dark", "light"].includes(storedTheme)) {
			currentTheme = storedTheme;
		}
	} catch (error) {
		currentTheme = "dark";
	}
	applyTheme(currentTheme);

	var navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
	var sections = navLinks
		.map(function (link) {
			var id = link.getAttribute("href");
			return id ? document.querySelector(id) : null;
		})
		.filter(function (section) {
			return section;
		});

	function updateActiveNavLink() {
		if (!navLinks.length || !sections.length) {
			return;
		}

		var header = document.querySelector("header");
		var headerOffset = (header ? header.offsetHeight : 0) + 28;
		var scrollPosition = window.scrollY + headerOffset;
		var activeId = sections[0].id;

		sections.forEach(function (section) {
			if (scrollPosition >= section.offsetTop) {
				activeId = section.id;
			}
		});

		navLinks.forEach(function (link) {
			var isActive = link.getAttribute("href") === "#" + activeId;
			link.classList.toggle("active", isActive);

			if (isActive) {
				link.setAttribute("aria-current", "page");
			} else {
				link.removeAttribute("aria-current");
			}
		});
	}

	updateActiveNavLink();
	window.addEventListener("scroll", updateActiveNavLink, { passive: true });
	window.addEventListener("resize", updateActiveNavLink);

	function initRevealAnimations() {
		var revealTargets = Array.from(document.querySelectorAll(".proof-card, .card, .project, .cert-item, .timeline-item, .skill-group, .about-highlight"));
		if (!revealTargets.length) {
			return;
		}

		revealTargets.forEach(function (element) {
			element.classList.add("reveal-item");
		});

		Array.from(document.querySelectorAll(".proof-grid, .cards, .projects, .cert-list, .timeline, .skills-board, .about-content")).forEach(function (group) {
			var items = Array.from(group.querySelectorAll(".reveal-item"));
			items.forEach(function (item, index) {
				item.style.setProperty("--reveal-delay", index * 85 + "ms");
			});
		});

		var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduceMotion || typeof window.IntersectionObserver === "undefined") {
			revealTargets.forEach(function (element) {
				element.classList.add("is-revealed");
			});
			return;
		}

		var observer = new window.IntersectionObserver(
			function (entries, obs) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) {
						return;
					}

					entry.target.classList.add("is-revealed");
					obs.unobserve(entry.target);
				});
			},
			{
				threshold: 0.16,
				rootMargin: "0px 0px -8% 0px"
			}
		);

		revealTargets.forEach(function (element) {
			observer.observe(element);
		});
	}

	initRevealAnimations();

	function sendAnalyticsEvent(eventName, params) {
		if (typeof window.plausible === "function") {
			window.plausible(eventName, { props: params || {} });
		}

		if (typeof window.gtag === "function") {
			window.gtag("event", eventName, params || {});
		}
	}

	document.addEventListener("click", function (event) {
		var link = event.target.closest("a[href]");
		if (!link) {
			return;
		}

		var href = link.getAttribute("href") || "";
		if (!href || href.startsWith("#")) {
			return;
		}

		var normalizedHref = href.toLowerCase();
		var linkText = (link.textContent || "").trim();

		if (normalizedHref.includes("linkedin.com")) {
			sendAnalyticsEvent("click_linkedin", {
				link_text: linkText,
				url: href
			});
			return;
		}

		if (normalizedHref.includes("github.com")) {
			sendAnalyticsEvent("click_github", {
				link_text: linkText,
				url: href
			});
			return;
		}

		if (link.closest("#portfolio") && link.classList.contains("btn-project")) {
			sendAnalyticsEvent("click_projeto", {
				link_text: linkText,
				url: href
			});
		}
	});

	var backToTopButton = document.getElementById("back-to-top");
	if (backToTopButton) {
		function updateBackToTopVisibility() {
			var shouldShow = window.scrollY > 420;
			backToTopButton.classList.toggle("is-visible", shouldShow);
		}

		backToTopButton.addEventListener("click", function () {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});

		updateBackToTopVisibility();
		window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
	}

	var modal = document.getElementById("diploma-modal");
	var trigger = document.getElementById("diploma-trigger");
	var modalImg = document.getElementById("diploma-img-full");
	var captionText = document.getElementById("modal-caption");
	var closeButton = document.getElementById("diploma-close");
	var toggleSideButton = document.getElementById("diploma-toggle-side");

	if (!modal || !trigger || !modalImg || !captionText || !closeButton || !toggleSideButton) {
		return;
	}

	var frontImage = "assets/diplomas/diploma-frente-full.jpg";
	var backImage = "assets/diplomas/diploma-verso-full.jpg";
	var modalCaptionFront = "Diploma de Graduacao - Frente";
	var modalCaptionBack = "Diploma de Graduacao - Verso";
	var modalShowBack = "Ver verso";
	var modalShowFront = "Ver frente";
	var clipboardProtectedMessage = "Captura de tela desabilitada nesta visualizacao.";
	var showingFront = true;
	var blockedKeys = ["s", "u", "p", "c", "i", "j"];

	trigger.setAttribute("draggable", "false");
	modalImg.setAttribute("draggable", "false");

	function openModalWithFront() {
		showingFront = true;
		modal.style.display = "block";
		modal.setAttribute("aria-hidden", "false");
		document.body.classList.add("diploma-guard");
		modalImg.src = frontImage;
		captionText.textContent = modalCaptionFront;
		toggleSideButton.textContent = modalShowBack;
		closeButton.focus();
	}

	function closeModal() {
		modal.style.display = "none";
		modal.setAttribute("aria-hidden", "true");
		document.body.classList.remove("diploma-guard");
		trigger.focus();
	}

	trigger.addEventListener("click", openModalWithFront);
	trigger.addEventListener("keydown", function (event) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openModalWithFront();
		}
	});

	closeButton.addEventListener("click", closeModal);

	modal.addEventListener("click", function (event) {
		if (event.target === modal) {
			closeModal();
		}
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape" && modal.style.display === "block") {
			closeModal();
		}

		if (event.key === "Tab" && modal.style.display === "block") {
			var focusables = [closeButton, toggleSideButton].filter(Boolean);
			if (!focusables.length) {
				return;
			}

			var first = focusables[0];
			var last = focusables[focusables.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	});

	toggleSideButton.addEventListener("click", function () {
		showingFront = !showingFront;

		if (showingFront) {
			modalImg.src = frontImage;
			captionText.textContent = modalCaptionFront;
			toggleSideButton.textContent = modalShowBack;
		} else {
			modalImg.src = backImage;
			captionText.textContent = modalCaptionBack;
			toggleSideButton.textContent = modalShowFront;
		}
	});

	// Dificulta salvar/copiar por menus e arraste.
	document.addEventListener("contextmenu", function (event) {
		if (event.target.closest("#diploma-trigger") || event.target.closest("#diploma-img-full")) {
			event.preventDefault();
		}
	});

	document.addEventListener("dragstart", function (event) {
		if (event.target.closest("#diploma-trigger") || event.target.closest("#diploma-img-full")) {
			event.preventDefault();
		}
	});

	// Bloqueia cópia/recorte quando a visualização protegida estiver ativa.
	document.addEventListener("copy", function (event) {
		if (modal.style.display === "block") {
			event.preventDefault();
		}
	});

	document.addEventListener("cut", function (event) {
		if (modal.style.display === "block") {
			event.preventDefault();
		}
	});

	document.addEventListener("selectstart", function (event) {
		if (modal.style.display === "block") {
			event.preventDefault();
		}
	});

	// Dificulta atalhos de inspeção, impressão e salvamento enquanto o modal estiver aberto.
	document.addEventListener("keydown", function (event) {
		var isModalOpen = modal.style.display === "block";
		var key = (event.key || "").toLowerCase();

		if (!isModalOpen) {
			return;
		}

		if (event.key === "PrintScreen") {
			event.preventDefault();
			modalImg.classList.add("is-protected");
			setTimeout(function () {
				modalImg.classList.remove("is-protected");
			}, 1200);

			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(clipboardProtectedMessage).catch(function () {});
			}
		}

		if (event.ctrlKey && blockedKeys.includes(key)) {
			event.preventDefault();
		}

		if (event.key === "F12") {
			event.preventDefault();
		}

		if (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) {
			event.preventDefault();
		}
	});
});
