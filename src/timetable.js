/** @typedef {"Mo" | "Di" | "Mi" | "Do" | "Fr" | "Sa" | "So"} Weekday */

/** @typedef {{
  cleanTitle: string,
  date: string,
  endTime: string,
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
  title: string,
  type: Array<string> | null,
  weekday: Weekday
}} CalendarEvent */

/** @returns {Promise<Array<CalendarEvent>>} */
export async function getTimetableData() {
    return await fetch("https://eva2.olotl.net/").then(r => r.json());
}

/** @returns {boolean} */
function isTimeWithin(time, start, end) {
    // Start inclusive, end exclusive
    if (time == start) return true;
    // Time is between end and start
    return isTimeAfter(time, start) && isTimeAfter(end, time);
}

// Is a after b?
function isTimeAfter(a, b) {
    let [hourA, minuteA] = a.split(":").map(Number)
    let [hourB, minuteB] = b.split(":").map(Number)
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

    let startTimes = events.map(e => e.startTime);
    let maxOverlap = 0;
    for (let time of startTimes) {
        let count = events.filter(e => isTimeWithin(time, e.startTime, e.endTime)).length
        maxOverlap = Math.max(maxOverlap, count);
    }
    return maxOverlap;
}