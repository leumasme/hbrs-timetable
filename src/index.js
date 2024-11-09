try {
    /** @type {Array<{
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
      weekday: string
    }>} */
    var timetableData = await fetch("https://eva2.olotl.net/").then(r => r.json());
} catch {
    document.getElementById("errortext").innerText = "Laden Fehlgeschlagen!"
    throw new Error("Fail");
}

document.getElementById("loadingoverlay").style.display = "none"
document.getElementById("content").classList.remove("hidden")

let klessEvents = timetableData.filter(x => x.lecturer == "Kless");

console.log(klessEvents);

document.getElementById("gesamtvorlesungen").innerText = `Herr Kless hält insgesamt ${klessEvents.length} Veranstaltungen`
let webengEvents = klessEvents.filter(e => e.title.includes("Web Engineering") && e.semesterName.startsWith("BWI"))

let weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
document.getElementById("termine").innerText = webengEvents.map(e => {
    let types = e.type?.join(" / ") ?? "?";
    // Mi -> Mittwoch
    let weekday = weekdays.find(day => day.startsWith(e.weekday));
    let time = e.startTime + "-" + e.endTime;
    return `${types}: ${weekday}, ${time}`;
}).join("\n")
