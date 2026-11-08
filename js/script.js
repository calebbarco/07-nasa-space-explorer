// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const loadButton = document.querySelector('button');
const gallery = document.getElementById('gallery');
const apodModal = document.getElementById('apodModal');
const modalImage = apodModal.querySelector('.modal-image');
const modalTitle = apodModal.querySelector('#modalTitle');
const modalDate = apodModal.querySelector('.modal-date');
const modalExplanation = apodModal.querySelector('.modal-explanation');
const modalCloseButton = apodModal.querySelector('.modal-close');

const apodEndpoint = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const apodsPerPage = 25;

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function getDaysBetween(firstDate, secondDate) {
	const firstTime = new Date(`${firstDate}T00:00:00Z`).getTime();
	const secondTime = new Date(`${secondDate}T00:00:00Z`).getTime();
	return Math.round((secondTime - firstTime) / 86400000);
}

async function fetchApodPage(page) {
	const response = await fetch(`${apodEndpoint}?page=${page}&per_page=${apodsPerPage}`);

	if (!response.ok) {
		throw new Error('NASA APOD request failed.');
	}

	return response.json();
}

function showMessage(message) {
	const messageElement = document.createElement('p');
	messageElement.className = 'placeholder';
	messageElement.textContent = message;
	gallery.replaceChildren(messageElement);
}

function getExplanation(apod) {
	return new DOMParser()
		.parseFromString(apod.explanation || '', 'text/html')
		.body.textContent.trim();
}

function openApodModal(apod) {
	modalImage.src = apod.hdurl || apod.url;
	modalImage.alt = apod.alt || apod.title;
	modalTitle.textContent = apod.title;
	modalDate.textContent = apod.date;
	modalExplanation.textContent = getExplanation(apod);
	apodModal.showModal();
}

function createApodCard(apod) {
	const card = document.createElement('article');
	card.className = 'gallery-item';
	const hasImage = apod.media_type === 'image' && apod.hdurl;

	if (hasImage) {
		const detailsButton = document.createElement('button');
		detailsButton.className = 'gallery-item-button';
		detailsButton.type = 'button';
		detailsButton.setAttribute('aria-label', `View details for ${apod.title}`);
		detailsButton.addEventListener('click', () => openApodModal(apod));
		const image = document.createElement('img');
		image.src = apod.hdurl;
		image.alt = apod.alt || apod.title;
		image.loading = 'lazy';
		detailsButton.append(image);

		const title = document.createElement('h2');
		title.textContent = apod.title;
		detailsButton.append(title);

		const date = document.createElement('p');
		date.textContent = apod.date;
		detailsButton.append(date);
		card.append(detailsButton);
	}

	if (!hasImage) {
		const title = document.createElement('h2');
		title.textContent = apod.title;
		card.append(title);

		const date = document.createElement('p');
		date.textContent = apod.date;
		card.append(date);
	}

	if (apod.url) {
		const mediaLink = document.createElement('a');
		mediaLink.className = 'media-link';
		mediaLink.href = apod.url;
		mediaLink.target = '_blank';
		mediaLink.rel = 'noopener noreferrer';
		mediaLink.textContent = apod.media_type === 'video'
			? "Watch this video on NASA's APOD page"
			: hasImage
				? "View this image on NASA's APOD page"
				: "View this media on NASA's APOD page";
		card.append(mediaLink);
	}

	if (!hasImage) {
		const description = document.createElement('p');
		description.textContent = getExplanation(apod);
		card.append(description);
	}

	return card;
}

async function loadApodImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	loadButton.disabled = true;
	loadButton.textContent = 'Loading...';
	showMessage('Your space images are on the way...');

	try {
		// The endpoint is paginated newest-first, so find which pages contain these dates.
		const newestPage = await fetchApodPage(1);
		if (newestPage.length === 0) {
			showMessage('NASA did not return any APOD records. Please try again later.');
			return;
		}

		const latestApodDate = newestPage[0].date;
		const newestOffset = Math.max(0, getDaysBetween(endDate, latestApodDate));
		const oldestOffset = Math.max(0, getDaysBetween(startDate, latestApodDate));
		const firstPage = Math.max(1, Math.floor(newestOffset / apodsPerPage));
		const lastPage = Math.floor(oldestOffset / apodsPerPage) + 2;
		const matchingApods = [];

		for (let page = firstPage; page <= lastPage; page += 1) {
			const apods = page === 1 ? newestPage : await fetchApodPage(page);
			matchingApods.push(...apods.filter(apod => apod.date >= startDate && apod.date <= endDate));
		}

		matchingApods.sort((first, second) => first.date.localeCompare(second.date));

		if (matchingApods.length === 0) {
			showMessage('No APOD records were found for these dates.');
			return;
		}

		gallery.replaceChildren(...matchingApods.map(createApodCard));
	} catch (error) {
		console.error(error);
		showMessage('Unable to load APOD images. Please check your connection and try again.');
	} finally {
		loadButton.disabled = false;
		loadButton.textContent = 'Get Space Images';
	}
}

loadButton.addEventListener('click', loadApodImages);
modalCloseButton.addEventListener('click', () => apodModal.close());
apodModal.addEventListener('click', event => {
	if (event.target === apodModal) {
		apodModal.close();
	}
});
