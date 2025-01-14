
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

        const eventsByRelated = Object.groupBy(events, e => e.cleanTitle)
        const sortedRelatedEvents = Object.entries(eventsByRelated).sort(([a], [b]) => a.localeCompare(b))
        for (const [cleanTitle, events] of sortedRelatedEvents) {
        
            let relatedElement = document.createElement("tri-state-item");
            relatedElement.setAttribute("label", cleanTitle);

            for (const event of events) {
                let eventElement = document.createElement("tri-state-item");
                eventElement.setAttribute("label", event.title);
                relatedElement.appendChild(eventElement);
            }
            semesterElement.appendChild(relatedElement);
        }
        classpicker.appendChild(semesterElement);
    }

    const finishbutton = document.getElementById("classpicker-finish");
    return new Promise((resolve, reject) => {
        finishbutton.addEventListener("click", () => {
            const pickedClasses = [];
            for (const eventElement of classpicker.children) {
                const checkbox = eventElement.querySelector("input");
                if (checkbox.checked) {
                    pickedClasses.push(eventByHash.get(checkbox.dataset.eventId));
                }
            }
            resolve(pickedClasses);
        })
    })
}

export { }