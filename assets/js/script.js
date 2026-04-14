document.addEventListener("DOMContentLoaded", function () {
	var STORAGE_KEY = "preferred-language";
	var translations = {
		pt: {
			htmlLang: "pt-BR",
			skipToContent: "Pular para o conteudo principal",
			navAbout: "Sobre",
			navGraduation: "Graduacao",
			navPostgrad: "Pos-graduacao",
			navCerts: "Certificacoes",
			navSkills: "Habilidades",
			navTimeline: "Timeline",
			navPortfolio: "Portfolio",
			navPresence: "Presenca online",
			heroTag: "Solucoes em IA, Compliance, LGPD e Desenvolvimento Web",
			heroIntro: "Arquiteto solucoes digitais seguras e escalaveis para desafios reais de negocio e governanca.",
			heroSubtitle: "17+ anos em tecnologia, unindo experiencia em infraestrutura de TI com atuacao atual em IA, Compliance, LGPD e desenvolvimento web.",
			heroCta: "Falar no LinkedIn",
			proofExp: "Anos de experiencia em tecnologia",
			proofProjects: "Projetos publicados em producao",
			proofCerts: "Certificacoes internacionais AWS",
			proofHours: "Formacao complementar em dados e desenvolvimento",
			aboutTitle: "Sobre Mim",
			graduationTitle: "Graduacao",
			graduationIntro: "Formacao academica concluida que sustenta minha atuacao tecnica em desenvolvimento de sistemas, infraestrutura e operacoes de TI.",
			graduationEvidence: "✓ Curso concluido com sucesso",
			postgradTitle: "Pos-graduacao",
			postgradIntro: "Especializacao em andamento com foco em cloud computing e inteligencia artificial.",
			certificationsTitle: "Certificacoes de Nivel Internacional",
			skillsTitle: "Habilidades Tecnicas",
			timelineTitle: "Experiencia Profissional",
			presenceTitle: "Presenca Online",
			portfolioTitle: "Portfolio",
			footerText: "Site pessoal e portfolio - Orlando Junior",
			modalClose: "Fechar visualizacao do diploma",
			modalToggle: "Alternar entre frente e verso do diploma",
			modalCaptionFront: "Diploma de Graduacao - Frente",
			modalCaptionBack: "Diploma de Graduacao - Verso",
			modalShowBack: "Ver verso",
			modalShowFront: "Ver frente",
			clipboardProtected: "Captura de tela desabilitada nesta visualizacao."
		},
		en: {
			htmlLang: "en",
			skipToContent: "Skip to main content",
			navAbout: "About",
			navGraduation: "Graduation",
			navPostgrad: "Postgraduate",
			navCerts: "Certifications",
			navSkills: "Skills",
			navTimeline: "Timeline",
			navPortfolio: "Portfolio",
			navPresence: "Online presence",
			heroTag: "AI, Compliance, LGPD and Web Development Solutions",
			heroIntro: "I design secure and scalable digital solutions for real business and governance challenges.",
			heroSubtitle: "17+ years in technology, combining IT infrastructure expertise with current focus on AI, Compliance, LGPD and web development.",
			heroCta: "Talk on LinkedIn",
			proofExp: "Years of experience in technology",
			proofProjects: "Projects published in production",
			proofCerts: "International AWS certifications",
			proofHours: "Additional training in data and development",
			aboutTitle: "About Me",
			graduationTitle: "Graduation",
			graduationIntro: "Completed academic education that supports my technical work in systems development, infrastructure and IT operations.",
			graduationEvidence: "✓ Program successfully completed",
			postgradTitle: "Postgraduate",
			postgradIntro: "Specialization in progress focused on cloud computing and artificial intelligence.",
			certificationsTitle: "International Level Certifications",
			skillsTitle: "Technical Skills",
			timelineTitle: "Professional Experience",
			presenceTitle: "Online Presence",
			portfolioTitle: "Portfolio",
			footerText: "Personal website and portfolio - Orlando Junior",
			modalClose: "Close diploma preview",
			modalToggle: "Switch between diploma front and back",
			modalCaptionFront: "Graduation Diploma - Front",
			modalCaptionBack: "Graduation Diploma - Back",
			modalShowBack: "View back",
			modalShowFront: "View front",
			clipboardProtected: "Screenshot disabled in this protected view."
		}
	};

	var currentLanguage = "pt";
	var langButtons = Array.from(document.querySelectorAll("[data-lang-option]"));

	function getText(key) {
		var languagePack = translations[currentLanguage] || translations.pt;
		return languagePack[key] || translations.pt[key] || "";
	}

	function applyLanguage(lang) {
		if (!translations[lang]) {
			return;
		}

		currentLanguage = lang;
		document.documentElement.lang = getText("htmlLang");
		document.documentElement.setAttribute("data-lang", lang);

		document.querySelectorAll("[data-i18n]").forEach(function (node) {
			var key = node.getAttribute("data-i18n");
			var translated = getText(key);
			if (translated) {
				node.textContent = translated;
			}
		});

		document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
			var key = node.getAttribute("data-i18n-aria-label");
			var translated = getText(key);
			if (translated) {
				node.setAttribute("aria-label", translated);
			}
		});

		langButtons.forEach(function (button) {
			var isActive = button.getAttribute("data-lang-option") === lang;
			button.classList.toggle("is-active", isActive);
			button.setAttribute("aria-pressed", String(isActive));
		});

		try {
			window.localStorage.setItem(STORAGE_KEY, lang);
		} catch (error) {
			// Ignora falha de escrita em storage restrito.
		}
	}

	langButtons.forEach(function (button) {
		button.addEventListener("click", function () {
			applyLanguage(button.getAttribute("data-lang-option") || "pt");
		});
	});

	try {
		var storedLanguage = window.localStorage.getItem(STORAGE_KEY);
		if (storedLanguage && translations[storedLanguage]) {
			currentLanguage = storedLanguage;
		}
	} catch (error) {
		currentLanguage = "pt";
	}

	applyLanguage(currentLanguage);

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
		captionText.textContent = getText("modalCaptionFront");
		toggleSideButton.textContent = getText("modalShowBack");
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
			captionText.textContent = getText("modalCaptionFront");
			toggleSideButton.textContent = getText("modalShowBack");
		} else {
			modalImg.src = backImage;
			captionText.textContent = getText("modalCaptionBack");
			toggleSideButton.textContent = getText("modalShowFront");
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
				navigator.clipboard.writeText(getText("clipboardProtected")).catch(function () {});
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
