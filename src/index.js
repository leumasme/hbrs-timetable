import { getTimetableData, writeTimetableGrid } from "./timetable.js"

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

writeTimetableGrid(timetableData)

// TODO: Check if part of manually finding correct row can be automated via labeled grid areas?
// TODO: Make it look nice
// TODO: Add new UI to allow users to pick which events to display