// Need viewer.js to process

const bg = document.querySelector(".background-iframe");
let d_src = "";
let d_interactivity = null;

function setBackground(src, interactivity) {
	try {
		bg.src = src;
		bg.style = interactivity ? "pointer-events: all;" : "	pointer-events: none;";
		return;
	} catch (error) {
		return console.error(error);
	}
}
