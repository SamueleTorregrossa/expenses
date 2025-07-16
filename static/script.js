// Theme Management
function initializeTheme() {
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('theme') || 'dark';
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  
  const themeIcon = document.getElementById('theme-icon');
  if (!themeIcon) {
    console.error('Theme icon element not found');
    return;
  }
  
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeIcon.textContent = 'light_mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeIcon.textContent = 'dark_mode';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const themeIcon = document.getElementById('theme-icon');
  
  if (!themeIcon) {
    console.error('Theme icon element not found');
    return;
  }
  
  if (currentTheme === 'light') {
    // Switch to dark mode
    document.documentElement.removeAttribute('data-theme');
    themeIcon.textContent = 'dark_mode';
    try {
      localStorage.setItem('theme', 'dark');
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  } else {
    // Switch to light mode
    document.documentElement.setAttribute('data-theme', 'light');
    themeIcon.textContent = 'light_mode';
    try {
      localStorage.setItem('theme', 'light');
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', initializeTheme);

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const calendarDates = document.querySelector(".calendar-dates");

const currdate = document.querySelector(".calendar-current-date");

const prenexIcons = document.querySelectorAll(".calendar-navigation span");

var gameTitle = document.getElementsByClassName("gameTitle");

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

  // Add load office days button
  addLoadOfficeDaysButton();
});

// Function to add upload office days button
function addLoadOfficeDaysButton() {
  const calendarHeader = document.querySelector(".calendar-header");
  if (calendarHeader && !document.querySelector("#upload-office-days-btn")) {
    // Create file input (hidden)
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    fileInput.id = "office-days-file-input";

    // Create upload button
    const uploadButton = document.createElement("button");
    uploadButton.id = "upload-office-days-btn";
    uploadButton.textContent = "📁";
    uploadButton.style.cssText = `
      margin-left: 10px;
      padding: 5px 10px;
      background:rgb(101, 101, 101);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;

    // Handle file upload
    fileInput.addEventListener("change", async (event) => {
      if (!isCalendarActive) return;

      const file = event.target.files[0];
      if (!file) return;

      uploadButton.textContent = "Processing...";

      try {
        const text = await file.text();
        const officeDays = JSON.parse(text);

        if (Array.isArray(officeDays) && officeDays.length > 0) {
          const monthAnalysis = analyzeOfficeDaysMonths(officeDays);

          // Check for mixed month datasets
          if (monthAnalysis.isMixed) {
            uploadButton.textContent = "❌ Mixed months detected";
            setTimeout(() => {
              uploadButton.textContent = "📁";
            }, 3000);

            alert(
              `❌ Mixed Month Data Detected\n\nThe uploaded file contains dates from multiple months:\n• ${monthAnalysis.monthsFound.join(
                "\n• "
              )}\n\nPlease upload office days for only one month at a time.`
            );
            return;
          }

          // Check if we have valid data for a single month
          if (!monthAnalysis.singleMonth) {
            uploadButton.textContent = "❌ No valid dates found";
            setTimeout(() => {
              uploadButton.textContent = "📁";
            }, 3000);
            return;
          }

          // Auto-navigate to the correct month
          const targetMonth = monthAnalysis.singleMonth.month;
          const targetYear = monthAnalysis.singleMonth.year;

          if (month !== targetMonth || year !== targetYear) {
            // Update global month/year variables
            month = targetMonth;
            year = targetYear;
            date = new Date(year, month, 1);

            // Regenerate calendar for the correct month
            manipulate();

            uploadButton.textContent = `📅 Moved to ${monthAnalysis.singleMonth.monthYear}`;
            setTimeout(() => {
              uploadButton.textContent = "📁";
            }, 2000);

            // Wait a moment for calendar to render, then select dates
            setTimeout(() => {
              document
                .querySelectorAll(".calendar-dates .selected")
                .forEach((el) => {
                  el.classList.remove("selected");
                });

              const result = autoSelectOfficeDays(officeDays);
              console.log(
                `Auto-navigated to ${monthAnalysis.singleMonth.monthYear} and selected ${result.selectedCount} office days`
              );
            }, 100);
          } else {
            // Already on correct month, just select the dates
            document
              .querySelectorAll(".calendar-dates .selected")
              .forEach((el) => {
                el.classList.remove("selected");
              });

            const result = autoSelectOfficeDays(officeDays);
            uploadButton.textContent = `✅ ${result.selectedCount} selected`;

            setTimeout(() => {
              uploadButton.textContent = "📁";
            }, 2000);
          }

          // No persistence - office days only exist until page reload
        } else {
          uploadButton.textContent = "❌ Invalid file format";
          setTimeout(() => {
            uploadButton.textContent = "📁";
          }, 2000);
        }
      } catch (error) {
        console.error("Error parsing office days file:", error);
        uploadButton.textContent = "❌ Error reading file";
        setTimeout(() => {
          uploadButton.textContent = "📁";
        }, 2000);
      }

      // Clear file input
      fileInput.value = "";
    });

    // Button click opens file dialog
    uploadButton.addEventListener("click", () => {
      if (!isCalendarActive) return;
      fileInput.click();
    });

    calendarHeader.appendChild(fileInput);
    calendarHeader.appendChild(uploadButton);
  }
}

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

// Function to load office days from server files only (not used for auto-loading)
async function loadOfficeDays() {
  const monthYear = `${months[month]}_${year}`;

  try {
    const response = await fetch(`office_days/${monthYear}/office_days.json`);

    if (response.ok) {
      const officeDays = await response.json();
      return officeDays || [];
    }
  } catch (error) {
    console.log("No office days file found on server for this month");
  }

  return [];
}

// Function to analyze which months are in the office days
function analyzeOfficeDaysMonths(officeDays) {
  const monthsFound = new Set();
  const monthYearData = [];

  officeDays.forEach((dateStr) => {
    try {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const monthNum = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        if (monthNum >= 1 && monthNum <= 12 && year > 1900) {
          const monthYear = `${months[monthNum - 1]} ${year}`;
          monthsFound.add(monthYear);
          monthYearData.push({ month: monthNum - 1, year: year, monthYear });
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

// Function to auto-select office days in calendar
function autoSelectOfficeDays(officeDays) {
  let selectedCount = 0;
  let totalDates = officeDays.length;

  officeDays.forEach((dateStr) => {
    // Find the calendar element with matching date
    const dateElements = document.querySelectorAll(
      `.calendar-dates li[data-date="${dateStr}"]`
    );
    dateElements.forEach((element) => {
      if (!element.classList.contains("inactive")) {
        element.classList.add("selected");
        selectedCount++;
      }
    });
  });

  // Update send button state after auto-selecting
  updateSendButtonState();

  const monthAnalysis = analyzeOfficeDaysMonths(officeDays);
  return { selectedCount, totalDates, monthAnalysis };
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

  // Generate the PDF file
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
};

// Function to generate PDF
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

  // Calculate values beforehand (no formulas)
  const distanceKm = Math.ceil(parseFloat(userDistance));
  const ratePerKm = parseFloat(userRate);
  const dailyDistance = distanceKm * 2; // Round trip
  const dailyAmount = dailyDistance * ratePerKm;
  const totalDays = datesOutput.length;
  const totalDistance = dailyDistance * totalDays;
  const totalAmount = dailyAmount * totalDays;

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

  // Populate data rows with precalculated values instead of formulas
  datesOutput.forEach((date) => {
    const description = `2 x ${distanceKm} km traveled`;
    worksheet.addRow([
      date,
      description,
      dailyDistance,
      ratePerKm,
      dailyAmount, // Precalculated instead of formula
    ]);
  });

  // Add totals with precalculated values instead of SUM formulas
  worksheet.addRow([
    null,
    null,
    totalDistance, // Precalculated instead of SUM formula
    null,
    totalAmount, // Precalculated instead of SUM formula
  ]);
  worksheet.addRow([null, null, null, null, null]); // Empty row for spacing
  worksheet.addRow([
    null,
    null,
    "Total amount",
    null,
    totalAmount, // Precalculated instead of SUM formula
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

  // Generate PDF file
  try {
    // Create PDF using jsPDF with autoTable for better formatting
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Expense claim form", 105, 25, { align: "center" });

    // Personal information
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const leftMargin = 20;
    const rightMargin = 105;
    let yPos = 45;

    // Name and IBAN row
    doc.setFont("helvetica", "bold");
    doc.text("Name:", leftMargin, yPos);
    doc.text("IBAN:", rightMargin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(userName, leftMargin + 25, yPos);
    doc.text(userIban || "N/A", rightMargin + 25, yPos);

    yPos += 15;

    // Address row
    doc.setFont("helvetica", "bold");
    doc.text("Address:", leftMargin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${userStreet}, ${userZip}, ${userCity}`, leftMargin + 30, yPos);

    yPos += 15;

    // Period row
    doc.setFont("helvetica", "bold");
    doc.text("Period/month:", leftMargin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${month + 1}/${year}`, leftMargin + 45, yPos);

    yPos += 25;

    // Prepare table data
    const tableData = [
      ["Date", "Description", "# km's", "Rate per km", "Amount"],
    ];

    // Add data rows
    datesOutput.forEach((date) => {
      const description = `2 x ${distanceKm} km traveled`;
      tableData.push([
        date,
        description,
        dailyDistance.toString(),
        `€${ratePerKm.toFixed(2)}`,
        `€${dailyAmount.toFixed(2)}`,
      ]);
    });

    // Add total row
    tableData.push([
      "",
      "TOTAL:",
      totalDistance.toString(),
      "",
      `€${totalAmount.toFixed(2)}`,
    ]);

    // Draw table using autoTable
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
    doc.text(`Total amount: €${totalAmount.toFixed(2)}`, leftMargin, finalY);

    // Save the PDF
    const fileName = `expenses_${months[month]}_${year}.pdf`;
    doc.save(fileName);

    console.log(`PDF generated successfully: ${fileName}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
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

  // No auto-loading - office days only selected when explicitly uploaded
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
    window.ConfettiPage.play();
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

  // add .move-up to gameTitle
  for (let i = 0; i < gameTitle.length; i++) {
    setTimeout(() => {
      if (!gameTitle[i].classList.contains("move-up")) {
        gameTitle[i].classList.add("move-up");
      }
    }, i * 100);
  }

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
