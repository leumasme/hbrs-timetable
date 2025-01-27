import { saveSelectedEvents } from "./classpicker.js";

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

    for (let event of events) {
        // HACK: fix some broken data parsing
        // "Digital-Start-ups (Sem. Unterricht)" gets parsed as types:
        // ['Seminar', 'e', 'm', '.', ' ', 'U', 'n', 't', 'e', 'r', 'r', 'i', 'c', 'h', 't']
        event.type = event.type.filter(t => t.length > 1).map(t => t.replaceAll(/ +/g, ""));
    }

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

function fillEmptySpaces(grid, gridMap, rowCounts) {
    for (let row = 0; row < gridMap.length; row++) {
        for (let col = 0; col < gridMap[row].length; col++) {
            if (!gridMap[row][col]) {
                const emptySpace = document.createElement("div");

                const [dayStartRow, dayEndRow] = findStartEndDayRowForRow(row, rowCounts);
                if (row == dayStartRow) {
                    emptySpace.classList.add("top-of-day")
                }
                if (row == dayEndRow - 1) {
                    emptySpace.classList.add("bottom-of-day")
                }

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

    const eventHues = assignEventHues(timetableData);

    for (let timetableEvent of timetableData) {
        // Find the row where the events day starts
        let row = findStartRowForDay(timetableEvent.weekday, rowCounts);
        const [dayStartRow, dayEndRow] = findStartEndDayRowForRow(row, rowCounts);

        let startCol = calculateTimeGridDistance(minStartTime, timetableEvent.startTime.split(":").map(Number));
        let endCol = calculateTimeGridDistance(minStartTime, timetableEvent.endTime.split(":").map(Number));

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
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById("event-template")
        /** @type {HTMLDivElement} */
        const eventElement = template.content.cloneNode(true).querySelector(".calendar-event")

        eventElement.querySelector(".event-title").innerText = timetableEvent.title
        eventElement.querySelector(".event-type").innerText = timetableEvent.type.map(t => t[0]).join(" ")
        eventElement.querySelector(".event-detail").innerText = `${timetableEvent.room}, ${timetableEvent.parsedDate.info}, ${timetableEvent.lecturer}`
        if (timetableEvent.group) {
            eventElement.querySelector(".event-detail").innerText += ", Gr." + timetableEvent.group;
        }
        eventElement.eventData = timetableEvent;

        for (let type of timetableEvent.type) {
            eventElement.classList.add("calendar-event-type-" + type.toLowerCase())
        }

        if (row == dayStartRow) {
            eventElement.classList.add("top-of-day")
        }
        if (row == dayEndRow - 1) {
            eventElement.classList.add("bottom-of-day")
        }

        const hue = eventHues.get(timetableEvent.cleanTitle)
        eventElement.style.setProperty("--event-color", `60% 0.15 ${hue}`)

        // Hovering over one event should highlight all events which belong to the same course
        eventElement.addEventListener("mouseenter", (event) => {
            const allEvents = Array.from(document.querySelectorAll(".calendar-event"));
            // document.querySelectorAll(".calendar-event").forEach(e => e.classList.remove("hovered"))
            const sameEvents = allEvents.filter(e => e.eventData.cleanTitle == eventElement.eventData.cleanTitle);
            for (let e of sameEvents) {
                e.classList.add("hovered")
            }

        })
        eventElement.addEventListener("mouseleave", (event) => {
            const allEvents = Array.from(document.querySelectorAll(".calendar-event.hovered"));
            for (let e of allEvents) {
                e.classList.remove("hovered")
            }
        })
        // Middle Mouse Click - auxclick doesn't work for some reason
        eventElement.addEventListener("mousedown", (clickEvent) => {
            console.log(clickEvent)
            if (clickEvent.button != 1) return;
            clickEvent.preventDefault();
            onMiddleClick(timetableData, timetableEvent)
        }, { capture: true })

        putGridElement(grid, row + 2, startCol + 2, endCol - startCol, 1, eventElement)
    }

    fillEmptySpaces(grid, gridMap, rowCounts)
}

// Cache the event hues so that colors don't change when events are deleted
let savedEventHues = null;
function assignEventHues(timetableData) {
    if (savedEventHues) return savedEventHues;
    let baseEvents = Array.from(new Set(timetableData.map(e => e.cleanTitle)))
    let hueDistance = 360 / baseEvents.length;
    let eventHues = new Map(baseEvents.map((e, i) => [e, i * hueDistance]))
    savedEventHues = eventHues;
    return eventHues;
}

function onMiddleClick(timetableData, clickedTimetableEvent) {
    const newTimetableData = timetableData.filter(e => e.dataHash != clickedTimetableEvent.dataHash);
    saveSelectedEvents(newTimetableData);
    // Clear calendar table
    document.getElementById("calendar-table").innerHTML = "";
    writeTimetableGrid(newTimetableData);
}

/* Given a weekday and the row counts for each day, find the row where the day starts */
function findStartRowForDay(day, rowCounts) {
    let row = 0;
    for (let d of days) {
        if (d == day) break;
        row += rowCounts[d];
    }
    return row;
}

/* Given a row and the row counts for each day, find the row where the day starts and ends */
function findStartEndDayRowForRow(row, rowCounts) {
    let dayStartRow = 0;
    let dayEndRow = 0;
    let day = 0;
    while (day < days.length) {
        dayEndRow += rowCounts[days[day]];
        if (row >= dayStartRow && row < dayEndRow) {
            break;
        }
        dayStartRow = dayEndRow;
        day++;
    }
    return [dayStartRow, dayEndRow];
}
