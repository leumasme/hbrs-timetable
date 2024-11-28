import { calculateMaxDayOverlap, getTimetableData } from "./timetable.js"

try {
    var timetableData = await getTimetableData();
} catch {
    document.getElementById("errortext").innerText = "Laden Fehlgeschlagen!"
    throw new Error("Fail");
}

document.getElementById("loadingoverlay").style.display = "none"
document.getElementById("content").classList.remove("hidden")

// Ever wanted to see what all events of all semesters look like at once? Comment out this line.
timetableData = timetableData.filter(e => e.semesterName == "BI 5")

// --- calculate column count / start+end time
let startTimeH = Infinity;
let startTimeMin = Infinity;
let endTimeH = 0;
let endTimeMin = 0;
for (let event of timetableData) {
    let [evStartTimeH, evStartTimeMin] = event.startTime.split(":").map(Number)
    if (evStartTimeH < startTimeH || (evStartTimeH == startTimeH && evStartTimeMin < startTimeMin)) {
        startTimeH = evStartTimeH;
        startTimeMin = evStartTimeMin;
    }

    let [evEndTimeH, evEndTimeMin] = event.endTime.split(":").map(Number)
    if (evEndTimeH > endTimeH || (evEndTimeH == endTimeH && evEndTimeMin > endTimeMin)) {
        endTimeH = evEndTimeH;
        endTimeMin = evEndTimeMin;
    }
}

console.log("Days go from", startTimeH, ":", startTimeMin, "to", endTimeH, ":", endTimeMin)

console.assert(startTimeMin % 15 == 0, "Start time minutes must be a multiple of 15")
console.assert(endTimeMin % 15 == 0, "End time minutes must be a multiple of 15")

let timeColumns = []
let colStartTimeH = startTimeH;
let colStartTimeMin = startTimeMin;
while (colStartTimeH != endTimeH || colStartTimeMin != endTimeMin) {
    timeColumns.push(`${colStartTimeH}:${colStartTimeMin.toString().padStart(2, "0")}`)
    colStartTimeMin += 15;
    if (colStartTimeMin == 60) {
        colStartTimeMin = 0;
        colStartTimeH += 1;
    }
}
console.log(timeColumns)
// ---

const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const rowCounts = {}
for (let day of days) {
    console.log("Am tag", day, "gibt es gleichzeitig bis zu", calculateMaxDayOverlap(timetableData, day), "veranstaltungen")
    rowCounts[day] = calculateMaxDayOverlap(timetableData, day);
}
const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0)
const table = document.getElementById("calendar-table");
table.style.gridTemplateRows = `repeat(${totalRows + 1}, 25px)`;
table.style.gridTemplateColumns = `repeat(${timeColumns.length + 1}, 1fr)`; // TODO: Calculate

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

// Insert time labels at the top
let currColumn = 2;
for (let time of timeColumns) {
    const timeLabel = document.createElement("div");
    timeLabel.innerText = time;
    timeLabel.classList.add("time-label")
    timeLabel.style.gridColumn = `${currColumn}`
    currColumn += 1;
    table.appendChild(timeLabel)
}

function calculateTimeGridDistance([startH, startMin], [endH, endMin]) {
    let minutes = (endH - startH) * 60 + endMin - startMin;
    return minutes / 15;
}

console.log(timetableData)

// Sort Events which should be at the top of the day first
// Lectures first, then other, then exercises
// Secondarily, longer things first
timetableData.sort((eventA, eventB) => {
    let aIsLecture = eventA.type.includes("Vorlesung");
    let bIsLecture = eventB.type.includes("Vorlesung");
    if (aIsLecture && !bIsLecture) return 1;
    if (!aIsLecture && bIsLecture) return -1;
    let aIsExercise = eventA.type.includes("Übung");
    let bIsExercise = eventB.type.includes("Übung");
    if (aIsExercise && !bIsExercise) return -1;
    if (!aIsExercise && bIsExercise) return 1;
    return calculateTimeGridDistance(eventA.startTime.split(":").map(Number), eventA.endTime.split(":").map(Number))
        - calculateTimeGridDistance(eventB.startTime.split(":").map(Number), eventB.endTime.split(":").map(Number))
})

// 2d array of grid cells occupancy. First rows, then columns
let gridMap = new Array(totalRows).fill(0).map(() => new Array(timeColumns.length).fill(false));

for (let event of timetableData) {
    // Find the row where the events day starts
    let initialRow = 0;
    for (let day of days) {
        if (day == event.weekday) break;
        initialRow += rowCounts[day];
    }

    let startCol = calculateTimeGridDistance([startTimeH, startTimeMin], event.startTime.split(":").map(Number));
    let endCol = calculateTimeGridDistance([startTimeH, startTimeMin], event.endTime.split(":").map(Number));

    // Skip rows until we find a free one
    do {
        var occupied = false;
        for (let i = startCol; i < endCol; i++) {
            if (gridMap[initialRow][i]) occupied = true;
        }
        if (occupied) initialRow++;
    } while (occupied)

    // Mark spots as occupied
    for (let i = startCol; i < endCol; i++) {
        gridMap[initialRow][i] = true;
    }

    // Insert event into DOM
    const eventElement = document.createElement("div");
    eventElement.innerText = event.title;
    eventElement.classList.add("calendar-event")
    eventElement.style.gridRow = `${initialRow + 2} / span 1`;
    eventElement.style.gridColumn = `${startCol + 2} / ${endCol + 2}`;
    table.appendChild(eventElement)
}

// TODO: Refactor into multiple files & functions
// TODO: Check if part of manually finding correct row can be automated via labeled grid areas?
// TODO: Make it look nice
// TODO: Add new UI to allow users to pick which events to display