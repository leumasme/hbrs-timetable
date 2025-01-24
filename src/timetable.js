/** @typedef {"Mo" | "Di" | "Mi" | "Do" | "Fr" | "Sa" | "So"} Weekday */

/** @typedef {{
  cleanTitle: string,
  date: string,
  group: string | null,
  lecturer: string,
  parsedDate: {
    start: string,
    end: string,
    info: string
  },
  room: string,
  semesterName: string,
  startTime: string,
  endTime: string,
  title: string,
  type: Array<string> | null,
  weekday: Weekday
  startTimeNum: Array<number>,
  endTimeNum: Array<number>,
  dataHash: string,
}} CalendarEvent */

/** @returns {Promise<Array<CalendarEvent>>} */
export async function getTimetableData() {
    let events = await fetch("https://eva2.olotl.net/").then(r => r.json());

    const textEncoder = new TextEncoder()
    const promises = [];
    for (let event of events) {
        event.startTimeNum = event.startTime.split(":").map(Number);
        event.endTimeNum = event.endTime.split(":").map(Number);

        // Hash the source event data to identify it later
        const idString = event.title + event.startTime + event.endTime + event.weekday + event.room + event.lecturer;
        const promise = window.crypto.subtle.digest("SHA-256", textEncoder.encode(idString)).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
            event.dataHash = hashHex;
        })
        promises.push(promise);
    }
    // Wait for all hashes to be calculated, may run in parallel
    await Promise.all(promises);

    return events;
}

/** 
 * @param {Array<number>} time
 * @param {Array<number>} start
 * @param {Array<number>} end
 * @returns {boolean}
 */
function isTimeWithin(time, start, end) {
    // Start inclusive, end exclusive
    if (time[0] == start[0] && time[1] == start[1]) return true;
    // Time is between end and start
    return isTimeAfter(time, start) && isTimeAfter(end, time);
}

function isTimeAfter([hourA, minuteA], [hourB, minuteB]) {
    if (hourA > hourB) return true;
    if (hourA == hourB && minuteA > minuteB) return true;
    return false;
}

/** 
 * Calculate minimum required rows to display the events of this day.
 * @param {Array<CalendarEvent>} events
 * @param {Weekday} weekday
 * @returns {number}
 */
export function calculateMaxDayOverlap(events, weekday) {
    // Only consider events of correct day
    events = events.filter(e => e.weekday == weekday);

    let startTimes = events.map(e => e.startTimeNum);
    let maxOverlap = 0;
    for (let time of startTimes) {
        let count = events.filter(e => isTimeWithin(time, e.startTimeNum, e.endTimeNum)).length
        maxOverlap = Math.max(maxOverlap, count);
    }
    return maxOverlap;
}

/**
 * @param {Array<CalendarEvent>} events
 * @returns {Record<Weekday, number>}
 */
export function calculateAllDayOverlaps(events) {
    let overlaps = {};
    for (let day of days) {
        console.log("Am tag", day, "gibt es gleichzeitig bis zu", calculateMaxDayOverlap(events, day), "veranstaltungen")
        overlaps[day] = calculateMaxDayOverlap(events, day);
    }
    return overlaps;
}

/** 
 * @description Calculate the earliest start time and latest end time of the given events.
 * @param {Array<CalendarEvent>} events
 */
export function calculateTimeBounds(events) {
    let startTimeH = Infinity;
    let startTimeMin = Infinity;
    let endTimeH = 0;
    let endTimeMin = 0;
    for (let event of events) {
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
    return [[startTimeH, startTimeMin], [endTimeH, endTimeMin]];
}

export function generateTimeColumnTexts(startTime, endTime) {
    let timeColumns = [];
    let [currentHour, currentMinute] = startTime;
    while (isTimeAfter(endTime, [currentHour, currentMinute])) {
        timeColumns.push(`${currentHour}:${currentMinute.toString().padStart(2, "0")}`);
        currentMinute += 15;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour += 1;
        }
    }
    return timeColumns;
}

function initializeGrid(grid, rowCounts, timeColumns) {
    // Insert day labels at the left side
    // Starts at 1, skip 1 for other header
    let currRow = 2;
    for (let [day, height] of Object.entries(rowCounts)) {
        console.log(day, height)
        if (height == 0) continue;
        const dayLabel = document.createElement("div");
        dayLabel.innerText = day;
        dayLabel.classList.add("day-label")
        dayLabel.style.gridRow = `${currRow} / span ${height}`
        currRow += height;
        grid.appendChild(dayLabel)
    }

    // Insert time labels at the top
    // Starts at 1, skip 1 for other header
    let currColumn = 2;
    for (let time of timeColumns) {
        const timeLabel = document.createElement("div");
        timeLabel.innerText = time;
        timeLabel.classList.add("time-label")
        timeLabel.style.gridColumn = `${currColumn}`
        currColumn += 1;
        grid.appendChild(timeLabel)
    }

}

function putGridElement(grid, row, col, width, height, element) {
    element.style.gridRow = `${row} / span ${height}`;
    element.style.gridColumn = `${col} / span ${width}`;
    grid.appendChild(element);
}

function fillEmptySpaces(grid, gridMap) {
    for (let row = 0; row < gridMap.length; row++) {
        for (let col = 0; col < gridMap[row].length; col++) {
            if (!gridMap[row][col]) {
                const emptySpace = document.createElement("div");
                emptySpace.classList.add("empty-space")

                putGridElement(grid, row + 2, col + 2, 1, 1, emptySpace)
            }
        }
    }
}

const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/**
 * @param {Array<CalendarEvent>} timetableData
 */
export function writeTimetableGrid(timetableData) {
    // --- calculate column count / start+end time
    let [minStartTime, maxEndTime] = calculateTimeBounds(timetableData)

    console.log("Days go from", minStartTime.join(":"), "to", maxEndTime.join(":"))

    console.assert(minStartTime[1] % 15 == 0, "Start time minutes must be a multiple of 15")
    console.assert(maxEndTime[1] % 15 == 0, "End time minutes must be a multiple of 15")

    let timeColumns = generateTimeColumnTexts(minStartTime, maxEndTime)
    console.log("Time Columns", timeColumns)
    // ---

    const rowCounts = calculateAllDayOverlaps(timetableData);

    const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0)

    const grid = document.getElementById("calendar-table");
    grid.style.setProperty("--event-rows", totalRows);
    grid.style.setProperty("--event-columns", timeColumns.length);

    initializeGrid(grid, rowCounts, timeColumns)

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
    }).reverse()

    // 2d array of grid cells occupancy. First rows, then columns
    let gridMap = new Array(totalRows).fill(0).map(() => new Array(timeColumns.length).fill(false));

    for (let event of timetableData) {
        // Find the row where the events day starts
        let row = 0;
        for (let day of days) {
            if (day == event.weekday) break;
            row += rowCounts[day];
        }

        let startCol = calculateTimeGridDistance(minStartTime, event.startTime.split(":").map(Number));
        let endCol = calculateTimeGridDistance(minStartTime, event.endTime.split(":").map(Number));

        // Skip rows until we find a free one
        do {
            var occupied = false;
            for (let i = startCol; i < endCol; i++) {
                if (gridMap[row][i]) occupied = true;
            }
            if (occupied) row++;
        } while (occupied)

        // Mark spots as occupied
        for (let i = startCol; i < endCol; i++) {
            gridMap[row][i] = true;
        }

        // Insert event into DOM
        const eventElement = document.createElement("div");
        eventElement.innerText = event.title;
        eventElement.classList.add("calendar-event")
        for (let type of event.type) {
            eventElement.classList.add("calendar-event-type-" + type.toLowerCase())
        }
        // TODO: Pick better colors for events, so they aren't too similar
        // eventElement.style.backgroundColor = "#" + intToRGB(hashCode(event.cleanTitle + "aaa")) + "77"
        const [r, g, b] = intToRGBParts(hashCode(event.cleanTitle + "aaa"))
        eventElement.style.setProperty("--event-color", `${r}, ${g}, ${b}`)

        putGridElement(grid, row + 2, startCol + 2, endCol - startCol, 1, eventElement)
    }

    fillEmptySpaces(grid, gridMap)
}

function hashCode(str) { // java String#hashCode
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i) {
    let c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

function intToRGBParts(i) {
    let r = (i & 0xFF0000) >> 16;
    let g = (i & 0x00FF00) >> 8;
    let b = i & 0x0000FF;
    return [r, g, b];
}