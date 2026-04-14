document.addEventListener("DOMContentLoaded", function () {
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
		captionText.textContent = "Diploma de Graduacao - Frente";
		toggleSideButton.textContent = "Ver verso";
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
			captionText.textContent = "Diploma de Graduacao - Frente";
			toggleSideButton.textContent = "Ver verso";
		} else {
			modalImg.src = backImage;
			captionText.textContent = "Diploma de Graduacao - Verso";
			toggleSideButton.textContent = "Ver frente";
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
				navigator.clipboard.writeText("Captura de tela desabilitada nesta visualizacao.").catch(function () {});
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
