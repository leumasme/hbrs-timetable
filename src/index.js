import { waitForPickedClasses } from "./classpicker.js";
import { getTimetableData, writeTimetableGrid } from "./timetable.js"

try {
    var timetableData = await getTimetableData();
} catch (e) {
    document.getElementById("errortext").innerText = "Laden Fehlgeschlagen!"
    throw new Error("Failed to load timetable data", e);
}

document.getElementById("loadingoverlay").classList.add("hidden")
document.getElementById("classpicker").classList.remove("hidden")

// Pick classes to display in timetable
const pickedClasses = await waitForPickedClasses(timetableData);

document.getElementById("classpicker").classList.add("hidden")
document.getElementById("timetable").classList.remove("hidden")

writeTimetableGrid(pickedClasses)

// Make gap exactly 1 screen pixel, as otherwise it would be inconsistent between 1px and 2px when using display zoom >:(
document.body.style.setProperty("--device-pixel-ratio", window.devicePixelRatio)
