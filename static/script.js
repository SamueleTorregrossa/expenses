let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const day = document.querySelector(".calendar-dates");

const currdate = document.querySelector(".calendar-current-date");

const prenexIcons = document.querySelectorAll(".calendar-navigation span");

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
        // add class selected to the selected date
        if (dateIcon.classList.contains("selected")) {
          dateIcon.classList.remove("selected");
        } else {
          dateIcon.classList.add("selected");
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
  if (validateForm()) {
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
};

document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.querySelector("#send-button");
  sendButton.hidden = true;

  // Attach listeners for input fields and dates
  attachInputListeners();
});

const send = () => {
  // Save input values to cookies
  setCookie("name", document.getElementById("name").value, 365);
  setCookie("street", document.getElementById("street").value, 365);
  setCookie("zip", document.getElementById("zip").value, 365);
  setCookie("city", document.getElementById("city").value, 365);
  setCookie("iban", document.getElementById("iban").value, 365);
  setCookie("distance", document.getElementById("distance").value, 365);
  setCookie("rate", document.getElementById("rate").value, 365);

  const selectedDates = document.querySelectorAll(".selected");
  const userName = document.querySelector("#name").value;
  const userStreet = document.querySelector("#street").value;
  const userCity = document.querySelector("#city").value;
  const userZip = document.querySelector("#zip").value;
  const userIban = document.querySelector("#iban").value;
  const userDistance = document.querySelector("#distance").value;
  const userRate = document.querySelector("#rate").value;

  const datesOutput = [];
  selectedDates.forEach((date) => {
    datesOutput.push(date.dataset.date);
  });

  // Validate inputs
  if (
    userName === "" ||
    userStreet === "" ||
    userCity === "" ||
    userZip === "" ||
    userRate === "" ||
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
  // Get the first day of the month
  let dayone = new Date(year, month, 1).getDay() - 1;
  if (dayone === -1) {
    dayone = 6;
  }

  // Get the last date of the month
  let lastdate = new Date(year, month + 1, 0).getDate();

  // Get the day of the last date of the month
  let dayend = new Date(year, month, lastdate).getDay();

  // Get the last date of the previous month
  let monthlastdate = new Date(year, month, 0).getDate();

  // Variable to store the generated calendar HTML
  let lit = "";

  // Loop to add the last dates of the previous month
  for (let i = dayone; i > 0; i--) {
    monthDay = monthlastdate - i + 1;
    fullDate = `${monthDay}/${month}/${year}`;
    lit += `<li class="inactive" data-date="${fullDate}">${monthDay}</li>`;
  }

  // Loop to add the dates of the current month
  for (let i = 1; i <= lastdate; i++) {
    // Check if the current date is today
    let isToday =
      i === date.getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()
        ? "active"
        : "";
    monthDay = `${i}`;
    fullDate = `${monthDay}/${month + 1}/${year}`;
    weekday = new Date(year, month, i).getDay();
    // isWeekend = weekday === 0 || weekday === 6 ? "inactive" : "";
    isWeekend = weekday === 0 || weekday === 6 ? "inactive" : "";

    lit += `<li class="${isWeekend} ${isToday}" data-date="${fullDate}">${monthDay}</li>`;
  }

  // Loop to add the first dates of the next month
  for (let i = dayend; i < 7; i++) {
    monthDay = i - dayend + 1;
    fullDate = `${monthDay}/${month + 2}/${year}`;
    lit += `<li class="inactive" data-date="${fullDate}">${monthDay}</li>`;
  }

  // Update the text of the current date element
  // with the formatted current month and year
  currdate.innerText = `${months[month]} ${year}`;

  // update the HTML of the dates element
  // with the generated calendar
  day.innerHTML = lit;

  attach_date_listeners();
};

manipulate();
getInputCookies();

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

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function getInputCookies() {
  if (getCookie("name"))
    document.getElementById("name").value = getCookie("name");
  if (getCookie("street"))
    document.getElementById("street").value = getCookie("street");
  if (getCookie("zip")) document.getElementById("zip").value = getCookie("zip");
  if (getCookie("city"))
    document.getElementById("city").value = getCookie("city");
  if (getCookie("iban"))
    document.getElementById("iban").value = getCookie("iban");
  if (getCookie("distance"))
    document.getElementById("distance").value = getCookie("distance");
  if (getCookie("rate"))
    document.getElementById("rate").value = getCookie("rate");
}
