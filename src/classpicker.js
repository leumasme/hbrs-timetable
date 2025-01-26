
/**
 * @param {import('./timetable').CalendarEvent[]} timetableData
 * @returns {Promise<import('./timetable').CalendarEvent[]>}
 */
export function waitForPickedClasses(timetableData) {
    const classpicker = document.getElementById("classpicker-options");

    const eventByHash = new Map(timetableData.map(e => [e.dataHash, e]))

    const eventsBySemester = Object.groupBy(timetableData, e => e.semesterName);
    for (const [semesterName, events] of Object.entries(eventsBySemester)) {

        let semesterElement = document.createElement("tri-state-item");
        semesterElement.setAttribute("label", semesterName);

        /** @type {Record<string, import('./timetable').CalendarEvent[]>} */
        const eventsByRelated = Object.groupBy(events, e => e.cleanTitle)
        const sortedRelatedEvents = Object.entries(eventsByRelated).sort(([a], [b]) => a.localeCompare(b))
        for (const [cleanTitle, events] of sortedRelatedEvents) {

            let relatedElement = document.createElement("tri-state-item");
            relatedElement.setAttribute("label", cleanTitle);

            for (const event of events) {
                let eventElement = document.createElement("tri-state-item");
                eventElement.setAttribute("label", `${event.title} (${event.lecturer}, ${event.weekday} ${event.startTime})`);
                eventElement.eventId = event.dataHash;
                relatedElement.appendChild(eventElement);
            }
            semesterElement.appendChild(relatedElement);
        }
        classpicker.appendChild(semesterElement);
    }

    loadPreviouslySelectedEvents();

    const finishbutton = document.getElementById("classpicker-finish");
    return new Promise((resolve, reject) => {
        finishbutton.addEventListener("click", () => {
            const pickedEvents = new Set();
            const checkboxes = classpicker.querySelectorAll("tri-state-item");
            for (const triStateCheckbox of checkboxes) {
                if (triStateCheckbox.checked && triStateCheckbox.eventId != undefined) {
                    pickedEvents.add(eventByHash.get(triStateCheckbox.eventId));
                }
            }
            console.log("Picked events:", pickedEvents)
            const pickedEventsArr = Array.from(pickedEvents.values());
            saveSelectedEvents(pickedEventsArr);
            resolve(pickedEventsArr);
        })
    })
}

function loadPreviouslySelectedEvents() {
    const lastSelected = localStorage.getItem("selectedEvents");
    if (!lastSelected) return;
    const hashes = new Set(lastSelected.split(","));
    console.log("Loading", hashes.size, "previously selected events:", hashes)
    for (const triStateCheckbox of document.querySelectorAll("tri-state-item")) {
        if (triStateCheckbox.eventId != undefined && hashes.has(triStateCheckbox.eventId)) {
            triStateCheckbox.checked = true;
            triStateCheckbox.handleCheckboxClick();
        }
    }
}

function saveSelectedEvents(pickedEvents) {
    const hashes = pickedEvents.map(e => e.dataHash).join(",");
    localStorage.setItem("selectedEvents", hashes);
    console.log("Saved", pickedEvents.length, "selected events:", hashes)
}

export { }