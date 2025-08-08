// ==================== CONSTANTS ====================
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TIMEOUTS = {
  COPY_FEEDBACK: 2000,
  BUTTON_RESET: 2000,
  ERROR_DISPLAY: 3000,
  CALENDAR_RENDER_DELAY: 100,
  GAME_OVER_RESET: 3000,
};

const SELECTORS = {
  CALENDAR_DATES: ".calendar-dates",
  CALENDAR_CURRENT_DATE: ".calendar-current-date",
  SEND_BUTTON: "#send-button",
  COPY_BUTTON: ".copy-button",
  EMAIL_TEMPLATE: "#email-template",
};

// ==================== GLOBAL STATE ====================
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let isCalendarActive = true;
let calendarElements = [];

// Snake game state
let snakeGame = {
  active: false,
  bodyValues: [],
  position: [0, -1],
  fruitPosition: [0, 0],
  size: 1,
  period: 500,
  direction: [0, 1],
  keyDirection: 0,
  keyQueue: [],
  isOver: false,
  isTerminated: false,
};

// ==================== UTILITIES ====================

/**
 * Safely access localStorage
 */
function getFromStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely save to localStorage
 */
function setInStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to save "${key}" to localStorage:`, error);
    return false;
  }
}

/**
 * Update button disabled state
 */
function setButtonState(button, enabled) {
  if (!button) return;

  button.disabled = !enabled;
  button.style.opacity = enabled ? "1" : "0.5";
  button.style.cursor = enabled ? "pointer" : "not-allowed";
}

/**
 * Show temporary feedback
 */
function showFeedback(element, duration = TIMEOUTS.COPY_FEEDBACK) {
  if (!element) return;

  element.style.opacity = "1";
  setTimeout(() => {
    element.style.opacity = "0";
  }, duration);
}

// ==================== THEME MANAGEMENT ====================

function initializeTheme() {
  const savedTheme = getFromStorage("theme") || "dark";
  const themeIcon = document.getElementById("theme-icon");

  if (!themeIcon) {
    console.error("Theme icon element not found");
    return;
  }

  if (savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeIcon.textContent = "light_mode";
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeIcon.textContent = "dark_mode";
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const themeIcon = document.getElementById("theme-icon");

  if (!themeIcon) {
    console.error("Theme icon element not found");
    return;
  }

  if (currentTheme === "light") {
    document.documentElement.removeAttribute("data-theme");
    themeIcon.textContent = "dark_mode";
    setInStorage("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    themeIcon.textContent = "light_mode";
    setInStorage("theme", "light");
  }
}

// ==================== CALENDAR SYSTEM ====================

/**
 * Render the calendar for current month/year
 */
function renderCalendar() {
  if (!isCalendarActive) return;

  const calendarDates = document.querySelector(SELECTORS.CALENDAR_DATES);
  const currentDateElement = document.querySelector(
    SELECTORS.CALENDAR_CURRENT_DATE
  );

  // Clear previous calendar
  calendarDates.innerHTML = "";
  calendarElements = [];

  // Calculate calendar grid
  let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay() - 1;
  if (firstDayOfMonth === -1) firstDayOfMonth = 6; // Adjust for Monday start

  const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const lastDayOfMonth = new Date(
    currentYear,
    currentMonth,
    lastDateOfMonth
  ).getDay();
  const lastDateOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Add previous month's trailing days
  for (let i = firstDayOfMonth; i > 0; i--) {
    const day = lastDateOfPrevMonth - i + 1;
    const li = createCalendarDay(
      day,
      "inactive",
      `${day}/${currentMonth}/${currentYear}`
    );
    calendarElements.push(li);
  }

  // Add current month's days
  for (let i = 1; i <= lastDateOfMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday =
      i === new Date().getDate() &&
      currentMonth === new Date().getMonth() &&
      currentYear === new Date().getFullYear();

    const className = isWeekend ? "inactive" : "active";
    const fullDate = `${i}/${currentMonth + 1}/${currentYear}`;

    const li = createCalendarDay(i, className, fullDate, isToday);
    calendarElements.push(li);
  }

  // Add next month's leading days
  for (let i = lastDayOfMonth; i < 7; i++) {
    const day = i - lastDayOfMonth + 1;
    const li = createCalendarDay(
      day,
      "inactive",
      `${day}/${currentMonth + 2}/${currentYear}`
    );
    calendarElements.push(li);
  }

  // Update display
  currentDateElement.innerText = `${MONTHS[currentMonth]} ${currentYear}`;
  calendarElements.forEach((li) => calendarDates.appendChild(li));

  // Attach event listeners
  attachDateClickListeners();
}

/**
 * Create a calendar day element
 */
function createCalendarDay(day, className, fullDate, isToday = false) {
  const li = document.createElement("li");
  li.textContent = day;
  li.className = className;
  li.setAttribute("data-date", fullDate);
  if (isToday) li.id = "today";
  return li;
}

/**
 * Attach click listeners to calendar dates
 */
function attachDateClickListeners() {
  const dateElements = document.querySelectorAll(".calendar-dates li");

  dateElements.forEach((dateElement) => {
    if (!dateElement.classList.contains("inactive")) {
      dateElement.addEventListener("click", () => {
        if (isCalendarActive) {
          dateElement.classList.toggle("selected");
          generateEmailTemplate();
          updateSendButtonState();
        }
      });
    }
  });
}

/**
 * Navigate calendar months
 */
function navigateMonth(direction) {
  currentMonth += direction;

  if (currentMonth < 0 || currentMonth > 11) {
    currentDate = new Date(currentYear, currentMonth, new Date().getDate());
    currentYear = currentDate.getFullYear();
    currentMonth = currentDate.getMonth();
  } else {
    currentDate = new Date();
  }

  renderCalendar();
}

/**
 * Go to today's date
 */
function goToToday() {
  currentDate = new Date();
  currentYear = currentDate.getFullYear();
  currentMonth = currentDate.getMonth();
  renderCalendar();
}

// ==================== FORM VALIDATION ====================

/**
 * Validate all required form fields
 */
function validateForm() {
  const requiredFields = ["name", "street", "city", "zip", "distance", "rate"];
  const selectedDates = document.querySelectorAll(".selected");

  const allFieldsFilled = requiredFields.every((fieldId) => {
    const value = document.getElementById(fieldId)?.value.trim();
    return value && value !== "";
  });

  return allFieldsFilled && selectedDates.length > 0;
}

/**
 * Update send button based on form validity
 */
function updateSendButtonState() {
  const sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
  setButtonState(sendButton, validateForm() && isCalendarActive);
}

/**
 * Save form data to localStorage
 */
function saveFormToStorage() {
  const fields = ["name", "street", "zip", "city", "iban", "distance", "rate"];
  fields.forEach((field) => {
    const value = document.getElementById(field)?.value;
    if (value) setInStorage(field, value);
  });
}

/**
 * Load form data from localStorage
 */
function loadFormFromStorage() {
  const fields = [
    "name",
    "street",
    "zip",
    "city",
    "iban",
    "distance",
    "rate",
    "hr-name",
  ];
  fields.forEach((field) => {
    const value = getFromStorage(field);
    if (value) {
      const element = document.getElementById(field);
      if (element) element.value = value;
    }
  });
}

// ==================== EMAIL FUNCTIONALITY ====================

/**
 * Update copy button state based on email content
 */
function updateCopyButtonState() {
  const copyButton = document.querySelector(SELECTORS.COPY_BUTTON);
  const emailTextarea = document.getElementById("email-template");

  if (emailTextarea && copyButton) {
    setButtonState(copyButton, emailTextarea.value.trim() !== "");
  }
}

/**
 * Generate email template based on selected dates
 */
function generateEmailTemplate() {
  const userName = document.getElementById("name")?.value.trim();
  let hrName =
    document.getElementById("hr-name")?.value.trim() || "HR Department";
  const selectedDates = document.querySelectorAll(".selected");
  const emailTextarea = document.getElementById("email-template");

  if (!userName || selectedDates.length === 0) {
    emailTextarea.value = "";
    updateCopyButtonState();
    return;
  }

  // Get dates and analyze months
  const datesArray = Array.from(selectedDates).map((date) => date.dataset.date);
  const monthAnalysis = analyzeMonths(datesArray);

  let emailText = "";
  if (monthAnalysis.singleMonth) {
    const monthName = MONTHS[monthAnalysis.singleMonth.month];
    const year = monthAnalysis.singleMonth.year;
    emailText = `Dear ${hrName},

Please find attached my travel expense report for ${monthName} ${year}.
Let me know if you have any questions.

Best wishes,
${userName}`;
  } else if (monthAnalysis.isMixed) {
    const monthsList = monthAnalysis.monthsFound.join(", ");
    emailText = `Dear ${hrName},

Please find attached my travel expense report for ${monthsList}.
Let me know if you have any questions.

Best wishes,
${userName}`;
  }

  emailTextarea.value = emailText;
  updateCopyButtonState();
}

/**
 * Copy email to clipboard
 */
function copyEmailToClipboard() {
  const emailTextarea = document.getElementById("email-template");
  const feedback = document.getElementById("copy-feedback");

  if (!emailTextarea.value) return;

  // Save HR name when copying
  const hrName = document.getElementById("hr-name")?.value.trim();
  if (hrName) setInStorage("hr-name", hrName);

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(emailTextarea.value)
      .then(() => showFeedback(feedback))
      .catch(() => fallbackCopy(emailTextarea, feedback));
  } else {
    fallbackCopy(emailTextarea, feedback);
  }
}

/**
 * Fallback clipboard copy for older browsers
 */
function fallbackCopy(textarea, feedback) {
  textarea.select();
  textarea.setSelectionRange(0, 99999);

  try {
    if (document.execCommand("copy")) {
      showFeedback(feedback);
    } else {
      alert(
        "Copy failed. Please select the text manually and copy with Ctrl+C (Cmd+C on Mac)."
      );
    }
  } catch (err) {
    alert("Copy operation not supported. Please select the text manually.");
  }
}

// ==================== PDF GENERATION ====================

/**
 * Generate expense report PDF
 */
function generateReport() {
  if (!isCalendarActive || !validateForm()) return;

  saveFormToStorage();

  // Get form values
  const formData = {
    name: document.getElementById("name").value,
    street: document.getElementById("street").value,
    city: document.getElementById("city").value,
    zip: document.getElementById("zip").value,
    iban: document.getElementById("iban").value,
    distance: document.getElementById("distance").value,
    rate: document.getElementById("rate").value,
  };

  // Get selected dates
  const selectedDates = document.querySelectorAll(".selected");
  const dates = Array.from(selectedDates).map((date) => date.dataset.date);

  if (dates.length === 0) {
    alert("Please select at least one date.");
    return;
  }

  createPDF(formData, dates);
}

/**
 * Create PDF document
 */
function createPDF(formData, dates) {
  // Calculate expense data
  const distanceKm = Math.ceil(parseFloat(formData.distance));
  const ratePerKm = parseFloat(formData.rate);
  const dailyDistance = distanceKm * 2;
  const dailyAmount = dailyDistance * ratePerKm;
  const totalDistance = dailyDistance * dates.length;
  const totalAmount = dailyAmount * dates.length;

  // Create PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Expense claim form", 105, 25, { align: "center" });

  // Personal information
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  let yPos = 45;

  // Name and IBAN
  doc.setFont("helvetica", "bold");
  doc.text("Name:", 20, yPos);
  doc.text("IBAN:", 105, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formData.name, 45, yPos);
  doc.text(formData.iban || "N/A", 130, yPos);

  yPos += 15;

  // Address
  doc.setFont("helvetica", "bold");
  doc.text("Address:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(`${formData.street}, ${formData.zip}, ${formData.city}`, 50, yPos);

  yPos += 15;

  // Period
  doc.setFont("helvetica", "bold");
  doc.text("Period/month:", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(`${currentMonth + 1}/${currentYear}`, 65, yPos);

  yPos += 25;

  // Table data
  const tableData = [
    ["Date", "Description", "# km's", "Rate per km", "Amount"],
  ];

  dates.forEach((date) => {
    tableData.push([
      date,
      `2 x ${distanceKm} km traveled`,
      dailyDistance.toString(),
      `€${ratePerKm.toFixed(2)}`,
      `€${dailyAmount.toFixed(2)}`,
    ]);
  });

  tableData.push([
    "",
    "TOTAL:",
    totalDistance.toString(),
    "",
    `€${totalAmount.toFixed(2)}`,
  ]);

  // Draw table
  doc.autoTable({
    head: [tableData[0]],
    body: tableData.slice(1),
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
    },
  });

  // Final total
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFont("helvetica", "bold");
  doc.text(`Total amount: €${totalAmount.toFixed(2)}`, 20, finalY);

  // Save PDF
  const fileName = `expenses_${MONTHS[currentMonth]}_${currentYear}.pdf`;
  doc.save(fileName);
}

// ==================== OFFICE DAYS FUNCTIONALITY ====================

/**
 * Create and add upload button for office days
 */
function createUploadButton() {
  const calendarHeader = document.querySelector(".calendar-header");
  if (!calendarHeader || document.querySelector("#upload-office-days-btn"))
    return;

  // Create hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.style.display = "none";
  fileInput.id = "office-days-file-input";

  // Create visible button
  const uploadButton = document.createElement("button");
  uploadButton.id = "upload-office-days-btn";
  uploadButton.innerHTML =
    '<span class="material-symbols-rounded">upload_file</span>';
  uploadButton.title = "Upload office days JSON file";

  // Handle file selection
  fileInput.addEventListener("change", handleOfficeDaysUpload);

  // Button click opens file dialog
  uploadButton.addEventListener("click", () => {
    if (isCalendarActive) fileInput.click();
  });

  calendarHeader.appendChild(fileInput);
  calendarHeader.appendChild(uploadButton);
}

/**
 * Handle office days file upload
 */
async function handleOfficeDaysUpload(event) {
  if (!isCalendarActive) return;

  const file = event.target.files[0];
  if (!file) return;

  const uploadButton = document.querySelector("#upload-office-days-btn");
  uploadButton.innerHTML =
    '<span class="material-symbols-rounded">hourglass_empty</span>';

  try {
    const text = await file.text();
    const officeDays = JSON.parse(text);

    if (!Array.isArray(officeDays) || officeDays.length === 0) {
      throw new Error("Invalid file format");
    }

    const monthAnalysis = analyzeMonths(officeDays);

    // Check for mixed months
    if (monthAnalysis.isMixed) {
      uploadButton.innerHTML =
        '<span class="material-symbols-rounded">error</span>';
      alert(
        `Mixed Month Data Detected\n\nThe file contains dates from multiple months:\n• ${monthAnalysis.monthsFound.join(
          "\n• "
        )}\n\nPlease upload office days for only one month at a time.`
      );
      setTimeout(() => {
        uploadButton.innerHTML =
          '<span class="material-symbols-rounded">upload_file</span>';
      }, TIMEOUTS.ERROR_DISPLAY);
      return;
    }

    // Navigate to the correct month
    if (monthAnalysis.singleMonth) {
      currentMonth = monthAnalysis.singleMonth.month;
      currentYear = monthAnalysis.singleMonth.year;
      currentDate = new Date(currentYear, currentMonth, 1);
      renderCalendar();

      // Select the dates after calendar renders
      setTimeout(() => {
        selectOfficeDays(officeDays);
        uploadButton.innerHTML =
          '<span class="material-symbols-rounded">check_circle</span>';
        setTimeout(() => {
          uploadButton.innerHTML =
            '<span class="material-symbols-rounded">upload_file</span>';
        }, TIMEOUTS.BUTTON_RESET);
      }, TIMEOUTS.CALENDAR_RENDER_DELAY);
    }
  } catch (error) {
    console.error("Error parsing office days file:", error);
    uploadButton.innerHTML =
      '<span class="material-symbols-rounded">error</span>';
    setTimeout(() => {
      uploadButton.innerHTML =
        '<span class="material-symbols-rounded">upload_file</span>';
    }, TIMEOUTS.BUTTON_RESET);
  }

  // Clear file input
  event.target.value = "";
}

/**
 * Select office days in calendar
 */
function selectOfficeDays(officeDays) {
  // Clear existing selections
  document.querySelectorAll(".calendar-dates .selected").forEach((el) => {
    el.classList.remove("selected");
  });

  // Select new dates
  officeDays.forEach((dateStr) => {
    const dateElements = document.querySelectorAll(
      `.calendar-dates li[data-date="${dateStr}"]`
    );
    dateElements.forEach((element) => {
      if (!element.classList.contains("inactive")) {
        element.classList.add("selected");
      }
    });
  });

  updateSendButtonState();
  generateEmailTemplate();
}

/**
 * Analyze which months are in the dates array
 */
function analyzeMonths(dates) {
  const monthsFound = new Set();
  const monthYearData = [];

  dates.forEach((dateStr) => {
    try {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        if (month >= 1 && month <= 12 && year > 1900) {
          const monthYear = `${MONTHS[month - 1]} ${year}`;
          monthsFound.add(monthYear);
          monthYearData.push({ month: month - 1, year: year, monthYear });
        }
      }
    } catch (e) {
      // Ignore invalid dates
    }
  });

  return {
    monthsFound: Array.from(monthsFound),
    isMixed: monthsFound.size > 1,
    singleMonth: monthsFound.size === 1 ? monthYearData[0] : null,
  };
}

// ==================== SNAKE GAME ====================

/**
 * Start the snake game
 */
function startGame() {
  if (snakeGame.active) return;

  // Initialize game state
  snakeGame.active = true;
  snakeGame.isOver = false;
  snakeGame.isTerminated = false;
  snakeGame.size = 2;
  snakeGame.period = 500;
  snakeGame.position = [0, -1];
  snakeGame.direction = [0, 1];
  snakeGame.keyDirection = 0;
  snakeGame.keyQueue = [];
  snakeGame.bodyValues = [];

  // Setup game board
  const todayIndex = calendarElements.findIndex((el) => el.id === "today");
  const cols = 7;
  snakeGame.fruitPosition = [Math.floor(todayIndex / cols), todayIndex % cols];

  // Initialize calendar for game
  isCalendarActive = false;
  calendarElements.forEach((el) => {
    el.classList = "inactive";
    el.id = "";
    snakeGame.bodyValues.push(0);
  });

  // Animate title
  const gameTitle = document.querySelectorAll(".gameTitle");
  gameTitle.forEach((letter, i) => {
    setTimeout(() => {
      letter.classList.add("move-up");
    }, i * 100);
  });

  // Animate tail out to the right when the game starts
  const tail = document.querySelector(".tail");
  if (tail) tail.classList.add("move-right");

  document.querySelector(".calendar-current-date").innerText = "Score: 0";
  updateSendButtonState();

  // Start game loop
  updateSnakeGame();
}

/**
 * Update snake game state
 */
function updateSnakeGame() {
  if (!snakeGame.active || snakeGame.isTerminated) return;

  const cols = 7;
  const rows = Math.floor(calendarElements.length / cols);

  if (!snakeGame.isOver) {
    // Process key input
    if (snakeGame.keyQueue.length > 0) {
      snakeGame.keyDirection = snakeGame.keyQueue.shift();
      const directionMap = {
        0: [0, 1], // Right
        1: [0, -1], // Left
        2: [-1, 0], // Up
        3: [1, 0], // Down
      };
      snakeGame.direction = directionMap[snakeGame.keyDirection];
    }

    // Update position
    snakeGame.position[0] += snakeGame.direction[0];
    snakeGame.position[1] += snakeGame.direction[1];

    // Wrap around edges
    if (snakeGame.position[0] < 0) snakeGame.position[0] = rows - 1;
    else if (snakeGame.position[0] >= rows) snakeGame.position[0] = 0;
    if (snakeGame.position[1] < 0) snakeGame.position[1] = cols - 1;
    else if (snakeGame.position[1] >= cols) snakeGame.position[1] = 0;

    // Decrease period for difficulty
    snakeGame.period = Math.max(200, snakeGame.period - 1);
  }

  // Update display
  renderSnakeGame(cols);

  // Check win/lose conditions
  checkSnakeGameStatus();

  // Continue game loop
  if (!snakeGame.isTerminated) {
    setTimeout(updateSnakeGame, snakeGame.period);
  }
}

/**
 * Render snake game visuals
 */
function renderSnakeGame(cols) {
  const posIndex = snakeGame.position[0] * cols + snakeGame.position[1];
  const rows = Math.floor(calendarElements.length / cols);

  // Check collision
  if (!snakeGame.isOver && snakeGame.bodyValues[posIndex] > 0) {
    snakeGame.isOver = true;
    document.querySelector(".calendar-current-date").innerText =
      "💀 Game Over 💀";
    snakeGame.period = 50;
  }

  // Update snake body
  if (!snakeGame.isOver) {
    snakeGame.bodyValues[posIndex] = snakeGame.size + 1;
  }

  // Render cells
  calendarElements.forEach((el, i) => {
    if (snakeGame.bodyValues[i] > 0) {
      el.classList = "selected";
      el.id = "snake";
      snakeGame.bodyValues[i]--;
    }
    if (snakeGame.bodyValues[i] === 0) {
      el.classList = "inactive";
      el.id = "";
    }
  });

  // Mark snake head only while game is running
  if (!snakeGame.isOver) {
    calendarElements[posIndex].id = "head";
  }

  // Check fruit collection
  if (
    snakeGame.position[0] === snakeGame.fruitPosition[0] &&
    snakeGame.position[1] === snakeGame.fruitPosition[1]
  ) {
    // Find a new fruit position not on the snake body
    let newRow = snakeGame.fruitPosition[0];
    let newCol = snakeGame.fruitPosition[1];
    let newIndex = newRow * cols + newCol;
    let attempts = 0;
    do {
      newRow = Math.floor(Math.random() * rows);
      newCol = Math.floor(Math.random() * cols);
      newIndex = newRow * cols + newCol;
      attempts++;
      // Safety to avoid potential infinite loops in degenerate cases
      if (attempts > calendarElements.length * 2) break;
    } while (snakeGame.bodyValues[newIndex] > 0 || newIndex === posIndex);

    snakeGame.fruitPosition = [newRow, newCol];
    snakeGame.size++;
    document.querySelector(".calendar-current-date").innerText = `Score: ${
      snakeGame.size - 1
    }`;
  }

  // Mark fruit (recompute index after potential move)
  const newFruitIndex =
    snakeGame.fruitPosition[0] * cols + snakeGame.fruitPosition[1];
  calendarElements[newFruitIndex].id = "fruit";
}

/**
 * Check win/lose conditions for snake game
 */
function checkSnakeGameStatus() {
  const inactiveCount = snakeGame.bodyValues.filter((v) => v === 0).length;

  // Check win condition
  if (inactiveCount < 1) {
    snakeGame.isOver = true;
    document.querySelector(".calendar-current-date").innerText =
      "🎉 You Win 🎉";
    if (window.ConfettiPage) window.ConfettiPage.play();
    snakeGame.period = 50;
    snakeGame.isTerminated = true;
  }

  // Check if game over animation finished
  // const selectedCount = snakeGame.bodyValues.filter((v) => v > 0).length;
  // Just take the sum of the body values
  const selectedCount = snakeGame.bodyValues.reduce(
    (acc, curr) => acc + curr,
    0
  );
  if (snakeGame.isOver && selectedCount <= 0 && !snakeGame.isTerminated) {
    // Stop the game loop and pause on game over before resetting
    snakeGame.isTerminated = true;
    setTimeout(() => {
      resetAfterSnakeGame();
    }, TIMEOUTS.GAME_OVER_RESET);
  }
}

/**
 * Reset after snake game ends
 */
function resetAfterSnakeGame() {
  snakeGame.active = false;
  isCalendarActive = true;

  // Reset game title
  document.querySelectorAll(".gameTitle").forEach((letter) => {
    letter.classList.remove("move-up");
  });

  // Reset tail animation
  const tail = document.querySelector(".tail");
  if (tail) tail.classList.remove("move-right");

  // Restore calendar
  renderCalendar();
  updateSendButtonState();
}

// Snake game controls
document.addEventListener("keydown", (event) => {
  if (!snakeGame.active || snakeGame.isOver) return;

  const keyMap = {
    ArrowRight: 0,
    ArrowLeft: 1,
    ArrowUp: 2,
    ArrowDown: 3,
  };

  const oppositeMap = {
    ArrowLeft: 0,
    ArrowRight: 1,
    ArrowDown: 2,
    ArrowUp: 3,
  };

  if (event.key in keyMap) {
    const newDirection = keyMap[event.key];

    // Prevent opposite direction
    if (
      snakeGame.keyQueue.length === 0 &&
      snakeGame.keyDirection !== oppositeMap[event.key]
    ) {
      snakeGame.keyQueue.push(newDirection);
    } else if (
      snakeGame.keyQueue.length === 1 &&
      snakeGame.keyQueue[0] !== newDirection &&
      snakeGame.keyQueue[0] !== oppositeMap[event.key]
    ) {
      snakeGame.keyQueue.push(newDirection);
    }
  }
});

// ==================== INITIALIZATION ====================

/**
 * Attach input listeners
 */
function attachInputListeners() {
  const requiredInputs = document.querySelectorAll(
    "#name, #street, #city, #zip, #iban, #distance, #rate"
  );

  requiredInputs.forEach((input) => {
    input.addEventListener("input", () => {
      updateSendButtonState();
      generateEmailTemplate();
    });
  });

  // HR name input
  const hrNameInput = document.getElementById("hr-name");
  if (hrNameInput) {
    hrNameInput.addEventListener("input", generateEmailTemplate);
  }

  // Calendar dates click
  const calendarDates = document.querySelector(".calendar-dates");
  if (calendarDates) {
    calendarDates.addEventListener("click", () => {
      setTimeout(() => {
        updateSendButtonState();
        generateEmailTemplate();
      }, 0);
    });
  }
}

/**
 * Initialize navigation icons
 */
function initializeNavigation() {
  // Previous/Next month navigation
  document.getElementById("calendar-prev")?.addEventListener("click", () => {
    navigateMonth(-1);
    updateSendButtonState();
  });

  document.getElementById("calendar-next")?.addEventListener("click", () => {
    navigateMonth(1);
    updateSendButtonState();
  });

  // Today button
  document.getElementById("calendar-today")?.addEventListener("click", () => {
    goToToday();
    updateSendButtonState();
  });
}

/**
 * Initialize application on DOM load
 */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  initializeTheme();

  // Initialize buttons
  const sendButton = document.querySelector(SELECTORS.SEND_BUTTON);
  const copyButton = document.querySelector(SELECTORS.COPY_BUTTON);

  setButtonState(sendButton, false);
  setButtonState(copyButton, false);

  // Load saved form data
  loadFormFromStorage();

  // Render calendar
  renderCalendar();

  // Attach listeners
  attachInputListeners();
  initializeNavigation();

  // Add upload button
  createUploadButton();

  // Update initial states
  updateSendButtonState();
  generateEmailTemplate();
});

// Expose functions for HTML onclick handlers
window.toggleTheme = toggleTheme;
window.generateReport = generateReport;
window.copyEmailToClipboard = copyEmailToClipboard;
window.startGame = startGame;
