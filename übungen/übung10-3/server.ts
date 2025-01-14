type MarketData = { min: number, max: number, sum: number, avg: number };

let didLoad: (data: MarketData) => void;
const LoadingPromise = new Promise<MarketData>((resolve) => didLoad = resolve);

async function loadMarketData() {
    console.log("Fetching data...")
    const csv = await fetch("https://www.smard.de/nip-download-manager/nip/download/market-data", {
        body: JSON.stringify({
            "request_form": [{
                "format": "CSV",
                "moduleIds": [5000410, 5004387, 5004359],
                "region": "DE", "timestamp_from": 1733526000000, "timestamp_to": 1734476400000,
                "type": "discrete", "language": "de", "resolution": "quarterhour"
            }]
        }),
        method: "POST"
    }).then(res => res.text());
    console.log("Fetch finished!")

    const lines = csv.split("\n");
    const headers = lines[0].split(";");
    const columnIndex = headers.indexOf("Gesamt (Netzlast) [MWh] Originalauflösungen");
    if (columnIndex === -1) {
        console.log(headers)
        throw new Error("Could not find column");
    }

    const data = lines.slice(1).map(l => l.split(";")[columnIndex])
        .filter(s => s != undefined && s != "");;

    console.log(data)

    const mwh = data.map(s => s.replace(".", "").replace(",", "."));

    for (const number of mwh) {
        if (isNaN(Number(number))) console.error("Invalid number: " + number);
    }

    const mwhNumbers = mwh.map(Number).filter(n => !isNaN(n));

    let min: number = Number.POSITIVE_INFINITY;
    let max: number = Number.NEGATIVE_INFINITY;
    let sum: number = 0;
    console.log(mwhNumbers)

    for (const number of mwhNumbers) {

        min = Math.min(min, number);
        max = Math.max(max, number);
        sum += number;
    }


    didLoad({
        min, max, sum,
        avg: sum / mwhNumbers.length
    });
    console.log("Data loaded!")
}

loadMarketData();

Deno.serve(async (_) => {
    const data = await LoadingPromise;
    console.log(data)

    return new Response(JSON.stringify(data))
})
// {"min":10154.75,"max":18102.5,"sum":14871660.25,"avg":14410.523498062015}