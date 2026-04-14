document.addEventListener("DOMContentLoaded", function () {
	var THEME_STORAGE_KEY = "preferred-theme";
	var currentTheme = "dark";
	var themeButton = document.getElementById("theme-toggle");
	var themeIcon = document.getElementById("theme-icon");
	var themeColorMeta = document.querySelector('meta[name="theme-color"]');
	var ICON_SUN = '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M12 4.75a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.75a1 1 0 0 1 1-1Zm0 11.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm7.25-6a1 1 0 0 1 1-1h1.25a1 1 0 1 1 0 2H20.25a1 1 0 0 1-1-1ZM2.5 12a1 1 0 0 1 1-1h1.25a1 1 0 1 1 0 2H3.5a1 1 0 0 1-1-1Zm14.48 5.07a1 1 0 0 1 1.42 0l.88.88a1 1 0 1 1-1.42 1.41l-.88-.88a1 1 0 0 1 0-1.41Zm-11.26 0a1 1 0 0 1 1.42 1.41l-.88.88a1 1 0 0 1-1.42-1.41l.88-.88Zm12.14-12.13a1 1 0 0 1 1.42 1.41l-.88.88a1 1 0 1 1-1.42-1.41l.88-.88Zm-12.14 0 .88.88A1 1 0 1 1 5.18 7.23l-.88-.88A1 1 0 0 1 5.72 4.94Z" fill="currentColor"/></svg>';
	var ICON_MOON = '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M15.76 3.18a1 1 0 0 1 .98 1.58A8.5 8.5 0 1 0 19.24 14a1 1 0 0 1 1.58.98A10.5 10.5 0 1 1 9.02 3.18a1 1 0 0 1 .98 1.58A8.5 8.5 0 0 0 19.24 14a1 1 0 0 1 1.58.98 10.46 10.46 0 0 1-5.06 6.43A10.5 10.5 0 0 1 3.18 9.02a10.46 10.46 0 0 1 6.43-5.06 1 1 0 0 1 1.06.32 1 1 0 0 1 .18 1.06 8.5 8.5 0 0 0 4.91 11.44 8.49 8.49 0 0 0 3.98.49 1 1 0 0 1 .98 1.58A10.47 10.47 0 0 1 15.76 3.18Z" fill="currentColor"/></svg>';

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
		} catch (error) {
			// Ignora falha de escrita em storage restrito.
		}
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
