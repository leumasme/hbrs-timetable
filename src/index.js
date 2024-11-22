import { calculateMaxDayOverlap, getTimetableData } from "./timetable.js"

try {
    var timetableData = await getTimetableData();
} catch {
    document.getElementById("errortext").innerText = "Laden Fehlgeschlagen!"
    throw new Error("Fail");
}

document.getElementById("loadingoverlay").style.display = "none"
document.getElementById("content").classList.remove("hidden")

timetableData = timetableData.filter(e => e.semesterName == "BI 5")

const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const rowCounts = {}
for (let day of days) {
    console.log("Am tag", day, "gibt es gleichzeitig bis zu", calculateMaxDayOverlap(timetableData, day), "veranstaltungen")
    rowCounts[day] = calculateMaxDayOverlap(timetableData, day);
}
const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0)
const table = document.getElementById("calendar-table");
table.style.gridTemplateRows = `repeat(${totalRows + 1}, 1fr)`;
table.style.gridTemplateColumns = `repeat(${46}, 1fr)`; // TODO: Calculate

// Insert day labels at the left side
// Starts at 1, skip 1 for header
let currRow = 2;
for (let [day, height] of Object.entries(rowCounts)) {
    console.log(day, height)
    if (height == 0) continue;
    const dayLabel = document.createElement("div");
    dayLabel.innerText = day;
    dayLabel.classList.add("day-label")
    dayLabel.style.gridRow = `${currRow} / span ${height}`
    currRow += height;
    table.appendChild(dayLabel)
}

// TODO: Calculate column counts based on start/end time
// TODO: Insert events