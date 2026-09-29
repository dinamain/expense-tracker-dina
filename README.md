# Expense Tracker

A responsive expense tracker built with vanilla HTML, CSS, and JavaScript. All data is saved in the browser's Local Storage, so it stays after a page refresh.

**Live demo:** https://dinamain.github.io/expense-tracker-dina/

## Features

- Add income or expense transactions with amount, category, date, and description
- Edit and delete transactions (with confirmation before deleting)
- Total income, total expenses, and current balance (balance turns red when negative)
- Filter transactions by type, category, and month (filters can be combined)
- Data persists in browser Local Storage across refreshes
- Responsive layout for desktop, tablet, and mobile

### Bonus features

- **Monthly summary:** income, expenses, and net for each month
- **Category-wise expense chart:** bar chart built with plain HTML/CSS, follows the month filter
- **Validation:** inline error messages for empty fields, invalid or non-positive amounts, more than 2 decimal places, and future dates

## How to run

1. Clone the repository:

```
   git clone https://github.com/dinamain/expense-tracker-dina.git
```

2. Open `index.html` in any modern browser (Chrome, Edge, or Firefox).

No installation, build step, or server is needed. You can also use the live demo link above.

## Project structure

```
index.html   - page structure
style.css    - styling and responsive layout
script.js    - app logic (state, validation, rendering, Local Storage)
```

## Implementation notes

- **Single render function:** all UI is redrawn from the `transactions` array after every change, so the display always matches the data.
- **Event delegation:** one click listener on the list handles every Edit and Delete button, including rows added later.
- **XSS protection:** user-entered text is escaped before being inserted into the page.
- **Local dates:** today's date is calculated in local time, avoiding the UTC offset bug with `toISOString()`.
- **Safe storage:** corrupted or missing Local Storage data falls back to an empty list instead of crashing.
- **Multi-tab sync:** changes made in one browser tab appear in other open tabs automatically.

## Tech used

HTML5, CSS3 (Grid, Flexbox, custom properties, media queries), and vanilla JavaScript (ES6+). No frameworks or libraries.