let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const calendarDates = document.querySelector(".calendar-dates");

const currdate = document.querySelector(".calendar-current-date");

const prenexIcons = document.querySelectorAll(".calendar-navigation span");

var isCalendarActive = true;
var calendarElements = [];

// Array of month names
const months = [
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

const attach_date_listeners = () => {
  const dateIcons = document.querySelectorAll(".calendar-dates li");
  // Attach a click event listener to each date
  dateIcons.forEach((dateIcon) => {
    // if the date is not inactive
    if (!dateIcon.classList.contains("inactive")) {
      // When a date is clicked
      dateIcon.addEventListener("click", () => {
        if (isCalendarActive) {
          // add class selected to the selected date
          if (dateIcon.classList.contains("selected")) {
            dateIcon.classList.remove("selected");
          } else {
            dateIcon.classList.add("selected");
          }
        }
      });
    }
  });
};

const validateForm = () => {
  const userName = document.querySelector("#name").value.trim();
  const userStreet = document.querySelector("#street").value.trim();
  const userCity = document.querySelector("#city").value.trim();
  const userZip = document.querySelector("#zip").value.trim();
  const userDistance = document.querySelector("#distance").value.trim();
  const userRate = document.querySelector("#rate").value.trim();
  const selectedDates = document.querySelectorAll(".selected");

  // Check if all required fields are filled and at least one date is selected
  return (
    userName !== "" &&
    userStreet !== "" &&
    userCity !== "" &&
    userZip !== "" &&
    userDistance !== "" &&
    userRate !== "" &&
    selectedDates.length > 0
  );
};

const updateSendButtonState = () => {
  const sendButton = document.querySelector("#send-button");
  if (validateForm() && isCalendarActive) {
    sendButton.hidden = false;
  } else {
    sendButton.hidden = true;
  }
};

const attachInputListeners = () => {
  const requiredInputs = document.querySelectorAll(
    "#name, #street, #city, #zip, #iban, #distance, #rate"
  );
  const calendarDates = document.querySelector(".calendar-dates");

  requiredInputs.forEach((input) => {
    input.addEventListener("input", updateSendButtonState);
  });

  calendarDates.addEventListener("click", () => {
    setTimeout(updateSendButtonState, 0); // Delay to allow click event to modify "selected" classes
  });

  prenexIcons.forEach((icon) => {
    icon.addEventListener("click", updateSendButtonState);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.querySelector("#send-button");
  sendButton.hidden = true;

  // Attach listeners for input fields and dates
  attachInputListeners();
});

// Function to save input values to localStorage
function saveToLocalStorage() {
  localStorage.setItem("name", document.getElementById("name").value);
  localStorage.setItem("street", document.getElementById("street").value);
  localStorage.setItem("zip", document.getElementById("zip").value);
  localStorage.setItem("city", document.getElementById("city").value);
  localStorage.setItem("iban", document.getElementById("iban").value);
  localStorage.setItem("distance", document.getElementById("distance").value);
  localStorage.setItem("rate", document.getElementById("rate").value);
}

// Function to retrieve input values from localStorage
function getInputFromLocalStorage() {
  const fields = ["name", "street", "zip", "city", "iban", "distance", "rate"];

  fields.forEach((field) => {
    const value = localStorage.getItem(field);
    if (value) {
      const inputElement = document.getElementById(field);
      if (inputElement) {
        inputElement.value = value;
      }
    }
  });
}

// Updated generateReport function using localStorage
const generateReport = () => {
  if (!isCalendarActive) {
    return;
  }

  // Save input values to localStorage
  saveToLocalStorage();

  // Retrieve input values from the form
  const userName = document.querySelector("#name").value;
  const userStreet = document.querySelector("#street").value;
  const userCity = document.querySelector("#city").value;
  const userZip = document.querySelector("#zip").value;
  const userIban = document.querySelector("#iban").value;
  const userDistance = document.querySelector("#distance").value;
  const userRate = document.querySelector("#rate").value;

  // Collect selected dates
  const selectedDates = document.querySelectorAll(".selected");
  const datesOutput = Array.from(selectedDates).map(
    (date) => date.dataset.date
  );

  // Validate inputs
  if (
    !userName ||
    !userStreet ||
    !userCity ||
    !userZip ||
    !userRate ||
    datesOutput.length === 0
  ) {
    alert("Please fill in all fields and select at least one date.");
    return;
  }

  // Generate the Excel file
  requestExcel(
    userName,
    userStreet,
    userCity,
    userZip,
    userIban,
    userDistance,
    userRate,
    datesOutput
  );

  // send an event to Google Analytics
  gtag("event", "generate_report", {
    event_category: "report",
    event_label: "excel",
  });
};

const requestExcel = async (
  userName,
  userStreet,
  userCity,
  userZip,
  userIban,
  userDistance,
  userRate,
  datesOutput
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Expenses");

  // Define styles
  const headerFont = { name: "Verdana", size: 22 };
  const regularFont = { name: "Verdana", size: 11 };
  const borderStyle = {
    top: { style: "thin", color: { argb: "00000000" } },
    left: { style: "thin", color: { argb: "00000000" } },
    bottom: { style: "thin", color: { argb: "00000000" } },
    right: { style: "thin", color: { argb: "00000000" } },
  };

  // Header information
  worksheet.addRow([null, "Expense claim form"]);
  worksheet.addRow(["Name:", userName, "IBAN:", userIban]);
  worksheet.addRow([
    "Address:",
    `${userStreet}, ${userZip}, ${userCity}`,
    "Period/month:",
    `${month + 1}/${year}`,
  ]);
  worksheet.addRow([]); // Empty row for spacing

  // Apply styles to header rows
  [1, 2, 3].forEach((rowNumber) => {
    const row = worksheet.getRow(rowNumber);
    row.eachCell((cell) => {
      cell.font = rowNumber === 1 ? headerFont : regularFont;
      cell.border = borderStyle;
    });
  });

  // Column headers
  const headerRow = worksheet.addRow([
    "Date",
    "Description",
    "# km's",
    "Rate per km",
    "Amount",
  ]);
  headerRow.font = regularFont;
  headerRow.eachCell((cell) => {
    cell.border = borderStyle;
  });

  // Populate data rows
  const distanceKm = Math.ceil(parseFloat(userDistance));
  const ratePerKm = parseFloat(userRate); // Use the user-provided rate

  datesOutput.forEach((date) => {
    const description = `2 x ${distanceKm} km traveled`;
    const amountFormula = `C${worksheet.lastRow.number + 1}*D${
      worksheet.lastRow.number + 1
    }`;
    worksheet.addRow([
      date,
      description,
      distanceKm * 2,
      ratePerKm,
      { formula: amountFormula },
    ]);
  });

  // Add totals
  const sumStartRow = 6;
  const sumEndRow = worksheet.lastRow.number;
  worksheet.addRow([
    null,
    null,
    { formula: `SUM(C${sumStartRow}:C${sumEndRow})` },
    null,
    { formula: `SUM(E${sumStartRow}:E${sumEndRow})` },
  ]);
  const emptyRow = worksheet.addRow([null, null, null, null, null]); // Empty row for spacing
  const totalAmountRow = worksheet.addRow([
    null,
    null,
    "Total amount",
    null,
    { formula: `SUM(E${sumStartRow}:E${sumEndRow})` },
  ]);

  // Apply borders and fonts to data rows
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      // Apply border
      cell.border = borderStyle;

      // Apply font
      if (rowNumber === 1) {
        cell.font = headerFont;
      } else {
        cell.font = regularFont;
      }
    });
  });

  // Merge cells
  worksheet.mergeCells("D2:E2"); // Merge D2:E2
  worksheet.mergeCells("D3:E3"); // Merge D3:E3

  // Set column widths
  worksheet.columns = [
    { width: 18 }, // Date
    { width: 50 }, // Description
    { width: 18 }, // Distance
    { width: 18 }, // Rate
    { width: 18 }, // Amount
  ];

  const lastRow = worksheet.lastRow.number;
  const lastColumn = worksheet.columns.length;

  // Generate and download the Excel file
  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${months[month]}_${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0);
  } catch (error) {
    console.error("Error generating Excel file:", error);
  }
};

// Function to generate the calendar
const manipulate = () => {
  if (!isCalendarActive) {
    return;
  }

  // Clear previous calendar elements if any
  calendarDates.innerHTML = ""; // Assuming 'day' is your container element
  calendarElements = [];

  // Get the first day of the month (0 - Sunday, 6 - Saturday)
  let dayone = new Date(year, month, 1).getDay() - 1;
  if (dayone === -1) {
    dayone = 6; // Adjusting so that Monday is 0 and Sunday is 6
  }

  // Get the last date of the current month
  const lastdate = new Date(year, month + 1, 0).getDate();

  // Get the day of the week for the last date of the current month
  const dayend = new Date(year, month, lastdate).getDay();

  // Get the last date of the previous month
  const monthlastdate = new Date(year, month, 0).getDate();

  // Helper function to create an <li> element
  const createListItem = (text, className, fullDate, isToday = false) => {
    const li = document.createElement("li");
    li.textContent = text;
    li.className = className;
    li.setAttribute("data-date", fullDate);
    if (isToday) {
      li.id = "today"; // Assuming 'today' is unique; consider using a class instead if multiple elements can be today
    }
    return li;
  };

  // Add the last few days of the previous month
  for (let i = dayone; i > 0; i--) {
    const monthDay = monthlastdate - i + 1;
    const fullDate = `${monthDay}/${month}/${year}`;
    const li = createListItem(monthDay, "inactive", fullDate);
    calendarElements.push(li);
  }

  // Add the current month's days
  for (let i = 1; i <= lastdate; i++) {
    // Check if the current date is today
    const today = new Date();
    const isToday =
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const monthDay = i;
    const fullDate = `${monthDay}/${month + 1}/${year}`;
    const weekday = new Date(year, month, i).getDay();
    const className = weekday === 0 || weekday === 6 ? "inactive" : "active";

    const li = createListItem(monthDay, className, fullDate, isToday);
    calendarElements.push(li);
  }

  // Add the first few days of the next month
  for (let i = dayend; i < 7; i++) {
    const monthDay = i - dayend + 1;
    const fullDate = `${monthDay}/${month + 2}/${year}`;
    const li = createListItem(monthDay, "inactive", fullDate);
    calendarElements.push(li);
  }

  // Update the current date display
  currdate.innerText = `${months[month]} ${year}`;

  // clear the calendar container
  // Append all created <li> elements to the calendar container
  calendarElements.forEach((li) => calendarDates.appendChild(li));

  // Attach event listeners to the date elements
  attach_date_listeners();
};

manipulate();
getInputFromLocalStorage();

// Attach a click event listener to each icon
prenexIcons.forEach((icon) => {
  // When an icon is clicked
  icon.addEventListener("click", () => {
    // Check if the icon is "calendar-prev"
    // or "calendar-next"
    month = icon.id === "calendar-prev" ? month - 1 : month + 1;

    // Check if the month is out of range
    if (month < 0 || month > 11) {
      // Set the date to the first day of the
      // month with the new year
      date = new Date(year, month, new Date().getDate());

      // Set the year to the new year
      year = date.getFullYear();

      // Set the month to the new month
      month = date.getMonth();
    } else {
      // Set the date to the current date
      date = new Date();
    }

    // Call the manipulate function to
    // update the calendar display
    manipulate();
  });
});

// Attach a click event listener to the "Today" icon
const todayIcon = document.querySelector("#calendar-today");
todayIcon.addEventListener("click", () => {
  date = new Date();
  year = date.getFullYear();
  month = date.getMonth();
  manipulate();
});

// * GAME LOGIC * //

var ceValues = [];

var rowCount;
var colCount = 7;
var period = 500;
var size = 1;
var currentPos = [0, -1];
var todayIndex = calendarElements.findIndex((el) => el.id === "today");
var fruitPos = [Math.floor(todayIndex / colCount), todayIndex % colCount];
var isGameOver = false;
var keyDirectionQueue = [];
var keyDirection = 0;
var direction = [0, 1];
var isTerminated = false;
var tail = document.querySelector(".tail");

const directionMap = {
  0: [0, 1],
  1: [0, -1],
  2: [-1, 0],
  3: [1, 0],
};

const keyDirectionMap = {
  ArrowRight: 0,
  ArrowLeft: 1,
  ArrowUp: 2,
  ArrowDown: 3,
};

const oppositeKeyDirection = {
  ArrowLeft: 0,
  ArrowRight: 1,
  ArrowDown: 2,
  ArrowUp: 3,
};
// Define a function that removes the event listeners from all dates and icons
const initializeDates = () => {
  for (let i = 0; i < calendarElements.length; i++) {
    calendarElements[i].classList = "inactive";
    calendarElements[i].id = "";
    ceValues.push(0);
  }
};
// define a function that updates the dates
const updateDates = () => {
  // calculate the index of the position
  var posIndex = currentPos[0] * colCount + currentPos[1];
  var fruitPosIndex = fruitPos[0] * colCount + fruitPos[1];
  if (!isGameOver) {
    if (ceValues[posIndex] > 0) {
      isGameOver = true;
      currdate.innerText = "💀 Game Over 💀";
      // store a game_end event with the score
      gtag("event", "game_end", {
        event_category: "game",
        event_label: "loss",
        value: size,
      });
      period = 50;
    }
    ceValues[posIndex] = size + 1;
  }

  for (let i = 0; i < calendarElements.length; i++) {
    if (ceValues[i] > 0) {
      calendarElements[i].classList = "selected";
      calendarElements[i].id = "snake";
      ceValues[i] -= 1;
    } else {
      calendarElements[i].classList = "inactive";
      calendarElements[i].id = "";
    }
  }
  calendarElements[posIndex].id = "head";

  if (currentPos[0] === fruitPos[0] && currentPos[1] === fruitPos[1]) {
    while (calendarElements[fruitPosIndex].classList.contains("selected")) {
      fruitPos[0] = Math.floor(Math.random() * rowCount);
      fruitPos[1] = Math.floor(Math.random() * colCount);
      fruitPosIndex = fruitPos[0] * colCount + fruitPos[1];
    }
    currdate.innerText = `Score: ${size}`;
    size += 1;
  }
  calendarElements[fruitPosIndex].id = "fruit";
};

document.addEventListener("keydown", (event) => {
  if (event.key in keyDirectionMap) {
    // if the queue is empty
    if (
      keyDirectionQueue.length === 0 &&
      keyDirection !== oppositeKeyDirection[event.key]
    ) {
      keyDirectionQueue.push(keyDirectionMap[event.key]);
    } else if (
      keyDirectionQueue.length === 1 &&
      keyDirectionQueue[0] !== keyDirectionMap[event.key] &&
      keyDirectionQueue[0] !== oppositeKeyDirection[event.key]
    ) {
      keyDirectionQueue.push(keyDirectionMap[event.key]);
    }
  }
});

const checkWinLoseCondition = () => {
  // explicit check
  var inactiveCount = 0;
  for (let i = 0; i < ceValues.length; i++) {
    if (ceValues[i] === 0) {
      inactiveCount += 1;
    }
  }
  if (inactiveCount <= 1) {
    isGameOver = true;
    currdate.innerText = "🎉 You Win 🎉";
    // store a game_end event with the score
    gtag("event", "game_end", {
      event_category: "game",
      event_label: "win",
      value: size,
    });
    period = 50;
    isTerminated = true;
  }
  var selectedCount = 0;
  for (let i = 0; i < ceValues.length; i++) {
    if (ceValues[i] > 0) {
      selectedCount += 1;
    }
  }
  if (isGameOver && selectedCount <= 0) {
    isTerminated = true;
    initializeDates();
  }
  if (isTerminated) {
    setTimeout(() => {
      tail.classList.toggle("move-right");
    });
  }
};

var gameTimeout;
// Define a function that updates the game state
const update = () => {
  if (!isGameOver) {
    // update the direction
    if (keyDirectionQueue.length > 0) {
      keyDirection = keyDirectionQueue.shift();
      direction = directionMap[keyDirection];
    }
    // update the current position
    currentPos[0] += direction[0];
    currentPos[1] += direction[1];
    if (currentPos[0] < 0) {
      currentPos[0] = rowCount - 1;
    } else if (currentPos[0] >= rowCount) {
      currentPos[0] = 0;
    }
    if (currentPos[1] < 0) {
      currentPos[1] = colCount - 1;
    } else if (currentPos[1] >= colCount) {
      currentPos[1] = 0;
    }
    period -= 1;
    period = Math.max(period, 200);
  }
  updateDates(currentPos, fruitPos, size);
  checkWinLoseCondition();

  if (!isTerminated) {
    gameTimeout = setTimeout(update, period);
  }
};

// Add a click event listener
tail.addEventListener("click", () => {
  tail.classList.toggle("move-right");
});

// Define a function that starts the game
const startGame = () => {
  console.log("Game started!");

  rowCount = Math.floor(calendarElements.length / 7);
  colCount = 7;
  currentPos = [0, -1];
  fruitPos = [Math.floor(todayIndex / colCount), todayIndex % colCount];
  isGameOver = false;
  keyDirectionQueue = [];
  keyDirection = 0;
  direction = [0, 1];
  isTerminated = false;
  size = 1;
  period = 500;
  ceValues = [];
  currdate.innerText = "Score: 0";

  // if the timeout is not null, clear it
  if (gameTimeout) {
    clearTimeout(gameTimeout);
  }

  isCalendarActive = false;
  initializeDates();
  updateSendButtonState();

  // call the update function every 1 second
  update();
};
