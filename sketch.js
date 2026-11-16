let categoryCounts = {
  "LANGUAGE PROFANITY": 0,
  "RELIGIOUS THEMES": 0,
  "DRUG OR ALCOHOL": 0,
  "VIOLENCE": 0,
  "LGBTQ+ THEMES": 0,
  "POLITICAL CONTENT": 0,
  "RACIAL THEMES": 0,
  "LEGAL COMPLIANCE": 0,
  "UNSPECIFIED": 0,
  "SEXUAL CONTENT": 0
};

let rawCSVText = "";
let selectedYear = 2026;

// Mappatura delle categorie del dataset
const categoryMapping = {
  "language_profanity": "LANGUAGE PROFANITY",
  "religious_objection": "RELIGIOUS THEMES",
  "drug_or_alcohol_content": "DRUG OR ALCOHOL",
  "violence": "VIOLENCE",
  "lgbtq_themes": "LGBTQ+ THEMES",
  "political_content": "POLITICAL CONTENT",
  "racial_themes": "RACIAL THEMES",
  "legal_compliance": "LEGAL COMPLIANCE",
  "unspecified": "UNSPECIFIED",
  "sexual_content": "SEXUAL CONTENT"
};

// Coordinate timeline
let yearNodes = [
  { year: 2026, x: 0, y: 0 },
  { year: 2025, x: 0, y: 0 }
];

function setup() {
  let canvas = createCanvas(1180, 680);
  canvas.parent('canvas-container');

  // Caricamento CSV
  fetch('assets/BANNED_INDEX.csv')
    .then(response => {
      if (!response.ok) throw new Error("CSV non trovato");
      return response.text();
    })
    .then(csvText => {
      rawCSVText = csvText;
      calculateCountsFromCSV(selectedYear);
    })
    .catch(err => {
      console.error("Errore caricamento CSV:", err);
    });
}


// PARSER CSV
// Gestisce virgolette, virgole e ritorni a capo

function parseCSV(text) {
  let rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    let char = text[i];

    if (char === '"') {

      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }

    } else if (char === ',' && !inQuotes) {

      row.push(cell);
      cell = "";

    } else if ((char === '\n' || char === '\r') && !inQuotes) {

      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }

      row.push(cell);
      rows.push(row);

      row = [];
      cell = "";

    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}


// CALCOLO LIBRI DISTINTI PER CATEGORIA

function calculateCountsFromCSV(targetYear) {

  if (!rawCSVText) return;

  // Azzeramento conteggi
  for (let key in categoryCounts) {
    categoryCounts[key] = 0;
  }

  let rows = parseCSV(rawCSVText);

  if (rows.length < 2) return;

  // Individuazione colonne
  let headers = rows[0].map(h =>
    h.trim().replace(/^\uFEFF/, '')
  );

  let bookColIndex = headers.indexOf("book_id");
  let dateColIndex = headers.indexOf("date_reported");
  let categoryColIndex = headers.indexOf("reason_categories");

  if (
    bookColIndex === -1 ||
    dateColIndex === -1 ||
    categoryColIndex === -1
  ) {
    console.error("Colonne necessarie non trovate");
    return;
  }

  // Set per evitare duplicati
  let booksByCategory = {};

  for (let category in categoryMapping) {
    booksByCategory[category] = new Set();
  }

  // Analisi delle righe CSV
  for (let i = 1; i < rows.length; i++) {

    let columns = rows[i];

    let bookId = columns[bookColIndex];
    let dateReported = columns[dateColIndex] || "";
    let catString = columns[categoryColIndex] || "";

    if (!bookId || !bookId.trim()) continue;

    // Estrazione date
    let dates = dateReported.match(
      /\d{4}-\d{2}-\d{2}/g
    ) || [];

    // Controllo anno cumulativo
    let validYear = dates.some(date => {
      let year = parseInt(date.substring(0, 4));
      return year <= targetYear;
    });

    if (!validYear) continue;

    // Separazione categorie
    let categories = catString
      .split(/[;\r\n]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    // Conteggio libri distinti
    categories.forEach(category => {

      if (booksByCategory[category]) {
        booksByCategory[category].add(bookId.trim());
      }

    });
  }

  // Trasferimento conteggi
  for (let category in categoryMapping) {

    let displayName = categoryMapping[category];

    categoryCounts[displayName] =
      booksByCategory[category].size;

  }

  console.log("Anno selezionato:", targetYear);
  console.table(categoryCounts);
}


// DISEGNO GRAFICO

function draw() {

  background(13, 26, 21);

  let startX = 30;
  let startY = 20;
  let totalWidth = 980;
  let totalHeight = 630;

  // Doppio bordo esterno
  stroke(229, 236, 233, 180);
  strokeWeight(1);
  noFill();

  rect(startX, startY, totalWidth, totalHeight);
  rect(startX + 3, startY + 3,
       totalWidth - 6, totalHeight - 6);

  let categories = Object.keys(categoryCounts);

  let rowHeight = (totalHeight - 10) / categories.length;

  // Scaffali orizzontali
  for (let i = 0; i < categories.length; i++) {

    let catName = categories[i];
    let count = categoryCounts[catName];

    let y = startY + 5 + i * rowHeight;

    // Una barra = 50 libri
    let booksToDraw = Math.floor(count / 50);

    // Linea orizzontale
    stroke(229, 236, 233, 120);
    strokeWeight(1);

    line(
      startX + 5,
      y + rowHeight,
      startX + totalWidth - 5,
      y + rowHeight
    );

    // Titolo categoria
    fill(229, 236, 233);
    noStroke();

    textSize(13);
    textFont('Courier New');
    textStyle(BOLD);
    textAlign(RIGHT, TOP);

    text(
      catName,
      startX + totalWidth - 15,
      y + 8
    );

    // Dorsi dei libri
    let bookWidth = 6;
    let bookGap = 3;

    let bookHeight = rowHeight - 16;
    let bookBaseY = y + rowHeight - 4;

    for (let b = 0; b < booksToDraw; b++) {

      let bookX =
        startX + 15 + b * (bookWidth + bookGap);

      stroke(13, 26, 21);
      strokeWeight(0.5);

      fill(235, 240, 235);

      rect(
        bookX,
        bookBaseY - bookHeight,
        bookWidth,
        bookHeight
      );
    }
  }

  // Timeline a destra
  drawTimeline(
    startX + totalWidth + 20,
    startY + totalHeight / 2
  );
}


// TIMELINE

function drawTimeline(centerX, centerY) {

  noFill();
  stroke(229, 236, 233, 100);
  strokeWeight(1.5);

  arc(
    centerX,
    centerY,
    140,
    320,
    -HALF_PI + 0.3,
    HALF_PI - 0.3
  );

  yearNodes[0].x = centerX + 60;
  yearNodes[0].y = centerY - 60;

  yearNodes[1].x = centerX + 60;
  yearNodes[1].y = centerY + 60;

  for (let i = 0; i < yearNodes.length; i++) {

    let node = yearNodes[i];

    let isSelected = node.year === selectedYear;

    if (isSelected) {

      fill(235, 240, 235);
      stroke(235, 240, 235);
      circle(node.x, node.y, 10);

    } else {

      noFill();
      stroke(229, 236, 233, 150);
      circle(node.x, node.y, 7);

    }

    fill(isSelected ? 255 : 180);
    noStroke();

    textSize(14);
    textFont('Courier New');
    textStyle(isSelected ? BOLD : NORMAL);
    textAlign(LEFT, CENTER);

    text(node.year, node.x + 15, node.y);
  }
}


// CAMBIO ANNO CON CLICK

function mousePressed() {

  for (let i = 0; i < yearNodes.length; i++) {

    let node = yearNodes[i];

    let d = dist(mouseX, mouseY, node.x, node.y);

    if (
      d < 25 ||
      (
        mouseX >= node.x &&
        mouseX <= node.x + 60 &&
        abs(mouseY - node.y) < 15
      )
    ) {

      selectedYear = node.year;

      calculateCountsFromCSV(selectedYear);

      break;
    }
  }
}