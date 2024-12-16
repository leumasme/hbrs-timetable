
/**
 * @param {import('./timetable').CalendarEvent[]} timetableData
 * @returns {Promise<import('./timetable').CalendarEvent[]>}
 */
export function waitForPickedClasses(timetableData) {
    const classpicker = document.getElementById("classpicker-options");

    for (const eventIndex in timetableData) {
        const eventElement = document.createElement("div");

        const event = timetableData[eventIndex];
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.eventIndex = eventIndex; // TODO: Actual Identifier
        checkbox.id = `classpicker-event-${eventIndex}`;
        eventElement.appendChild(checkbox);

        const label = document.createElement("label");
        label.innerText = event.title;
        label.htmlFor = `classpicker-event-${eventIndex}`;
        eventElement.appendChild(label);

        classpicker.appendChild(eventElement);
    }

    const finishbutton = document.getElementById("classpicker-finish");
    return new Promise((resolve, reject) => {
        finishbutton.addEventListener("click", () => {
            const pickedClasses = [];
            for (const eventElement of classpicker.children) {
                const checkbox = eventElement.querySelector("input");
                if (checkbox.checked) {
                    pickedClasses.push(timetableData[Number(checkbox.dataset.eventIndex)]);
                }
            }
            resolve(pickedClasses);
        })
    })
}

export { }