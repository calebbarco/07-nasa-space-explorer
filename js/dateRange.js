
// NASA's APOD API only has images from June 16, 1995 onwards
const earliestDate = '1995-06-16';
const daysInRange = 9;

// Get today's date in YYYY-MM-DD format (required by date inputs)
const today = new Date().toISOString().split('T')[0];

function setupDateInputs(startInput, endInput) {
  // Keep both date inputs inside a range where 9 APOD dates are available.
  const latestStart = new Date(`${today}T00:00:00Z`);
  latestStart.setUTCDate(latestStart.getUTCDate() - (daysInRange - 1));

  const earliestEnd = new Date(`${earliestDate}T00:00:00Z`);
  earliestEnd.setUTCDate(earliestEnd.getUTCDate() + (daysInRange - 1));

  startInput.min = earliestDate;
  startInput.max = latestStart.toISOString().split('T')[0];
  endInput.min = earliestEnd.toISOString().split('T')[0];
  endInput.max = today;

  // Default to the most recent 9 days, including today.
  startInput.value = latestStart.toISOString().split('T')[0];
  endInput.value = today;

  // Keep the selected range at exactly 9 consecutive days.
  startInput.addEventListener('change', () => {
    const endDate = new Date(`${startInput.value}T00:00:00Z`);
    endDate.setUTCDate(endDate.getUTCDate() + (daysInRange - 1));
    endInput.value = endDate.toISOString().split('T')[0];
  });

  endInput.addEventListener('change', () => {
    const startDate = new Date(`${endInput.value}T00:00:00Z`);
    startDate.setUTCDate(startDate.getUTCDate() - (daysInRange - 1));
    startInput.value = startDate.toISOString().split('T')[0];
  });
}
