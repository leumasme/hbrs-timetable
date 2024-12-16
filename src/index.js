import { waitForPickedClasses } from "./classpicker.js";
import { getTimetableData, writeTimetableGrid } from "./timetable.js"

try {
    var timetableData = await getTimetableData();
} catch {
    document.getElementById("errortext").innerText = "Laden Fehlgeschlagen!"
    throw new Error("Fail");
}

document.getElementById("loadingoverlay").classList.add("hidden")
document.getElementById("classpicker").classList.remove("hidden")

// Pick classes to display in timetable
const pickedClasses = await waitForPickedClasses(timetableData);

document.getElementById("classpicker").classList.add("hidden")
document.getElementById("timetable").classList.remove("hidden")

// Ever wanted to see what all events of all semesters look like at once? Comment out this line.
// timetableData = timetableData.filter(e => e.semesterName == "BI 5")

writeTimetableGrid(pickedClasses)

// Make gap exactly 1 screen pixel, as otherwise it would be inconsistent between 1px and 2px when using display zoom >:(
document.body.style.setProperty("--device-pixel-ratio", window.devicePixelRatio)

// TODO: Check if part of manually finding correct row can be automated via labeled grid areas?
// TODO: Make it look nice
// TODO: Add new UI to allow users to pick which events to display