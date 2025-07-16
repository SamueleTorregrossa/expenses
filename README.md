# Travel Expenses Report Generator

https://samueletorregrossa.github.io/expenses

This is a web application that generates travel expense reports in PDF format based on user input and office day schedules.

## Features

### 📅 Manual Date Selection

- Interactive calendar interface for selecting travel dates
- Weekends are automatically excluded from selection
- Navigate between months using the calendar controls

### 📁 Office Days Upload
- Upload office days from a JSON file using the upload button (📁) in the calendar header
- Automatically navigates to the correct month and selects the appropriate dates
- Supports only single-month datasets (mixed months are detected and rejected)
- Office days are temporary and reset on page reload

### 📄 PDF Report Generation
- Generates professional PDF expense reports instead of Excel files
- Pre-calculated totals and amounts (no formulas required)
- Includes personal information, travel dates, distances, and calculated expenses

## Usage

1. **Fill in your details**: Name, Street, Zip, City, IBAN (optional), Distance, and Rate per km
2. **Select dates**: Either manually select dates from the calendar OR upload an office days JSON file
3. **Generate report**: Click "Generate Report" to download your PDF expense report

### Office Days File Format
Upload a JSON file containing an array of dates in "D/M/YYYY" format. Single-digit days and months can be written without leading zeros (e.g., `1/11/2024`), but leading zeros are also accepted (e.g., `01/11/2024`).
```json
["1/11/2024", "01/11/2024", "4/11/2024", "04/11/2024", "5/11/2024", "6/11/2024"]
```

## Data Security

- PDF generation is performed entirely in your browser - no data is sent to external servers
- Personal information is stored locally using browser cookies for convenience
- Office days from uploaded files are temporary and not persisted
- All data remains private and secure on your device

### Code Check:
[![CodeFactor](https://www.codefactor.io/repository/github/samueletorregrossa/expenses/badge)](https://www.codefactor.io/repository/github/samueletorregrossa/expenses)
