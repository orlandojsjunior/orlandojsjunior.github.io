document.addEventListener("DOMContentLoaded", function () {
	var THEME_STORAGE_KEY = "preferred-theme";
	var currentTheme = "dark";
	var themeButton = document.getElementById("theme-toggle");
	var themeIcon = document.getElementById("theme-icon");
	var themeColorMeta = document.querySelector('meta[name="theme-color"]');
	var ICON_SUN = '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><rect x="11" y="1.5" width="2" height="4" rx="1" fill="currentColor"/><rect x="11" y="18.5" width="2" height="4" rx="1" fill="currentColor"/><rect x="18.5" y="11" width="4" height="2" rx="1" fill="currentColor"/><rect x="1.5" y="11" width="4" height="2" rx="1" fill="currentColor"/><rect x="17.2" y="4.9" width="2" height="4" rx="1" transform="rotate(45 18.2 6.9)" fill="currentColor"/><rect x="4.8" y="17.3" width="2" height="4" rx="1" transform="rotate(45 5.8 19.3)" fill="currentColor"/><rect x="17.2" y="15.1" width="2" height="4" rx="1" transform="rotate(135 18.2 17.1)" fill="currentColor"/><rect x="4.8" y="2.7" width="2" height="4" rx="1" transform="rotate(135 5.8 4.7)" fill="currentColor"/></svg>';
	var ICON_MOON = '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path fill="currentColor" d="M14.53 2.47a.75.75 0 0 0-1.08.82 8.25 8.25 0 0 1-10.16 10.16.75.75 0 0 0-.82 1.08 9.75 9.75 0 1 0 12.06-12.06Z"/></svg>';

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
