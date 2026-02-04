// Většinu kódu v tomhle souboru jsem exhumoval na Wayback machine. Není můj.
// Snad mi za to ten jejich seznamáckej pes neurafne koule.
// Někdy to přepíšu. Slibuju.

let _alphabet = "0ABCD2EFGH4IJKLMN6OPQRST8UVWXYZ-1abcd3efgh5ijklmn7opqrst9uvwxyz.";
function _serializeNumber(delta, orig) {
    var code = "";
    if (delta >= -1024 && delta < 1024) {
        code += _alphabet.charAt(delta + 1024 >> 6);
        code += _alphabet.charAt(delta + 1024 & 63)
    } else if (delta >= -32768 && delta < 32768) {
        var value = 131072 | delta + 32768;
        code += _alphabet.charAt(value >> 12 & 63);
        code += _alphabet.charAt(value >> 6 & 63);
        code += _alphabet.charAt(value & 63)
    } else {
        var value = 805306368 | orig & 268435455;
        code += _alphabet.charAt(value >> 24 & 63);
        code += _alphabet.charAt(value >> 18 & 63);
        code += _alphabet.charAt(value >> 12 & 63);
        code += _alphabet.charAt(value >> 6 & 63);
        code += _alphabet.charAt(value & 63)
    }
    return code
};

function coordsToString(arr) {
    var ox = 0;
    var oy = 0;
    var result = "";
    for (var i = 0; i < arr.length; i++) {
        var coords = [arr[i].x, arr[i].y];
        var x = Math.round((coords[0] + 180) * (1 << 28) / 360);
        var y = Math.round((coords[1] + 90) * (1 << 28) / 180);
        var dx = x - ox;
        var dy = y - oy;
        result += this._serializeNumber(dx, x);
        result += this._serializeNumber(dy, y);
        ox = x;
        oy = y
    }
    return result
};


class MapyCzRoute {
    constructor() {
        this._conf = {
            points: [[], []],
            params: [null, null],
            coords: [null, null]
        }

        this._url = "https://mapy.com/?planovani-trasy"
    }

    static getCoords(lonD, latD) {
        if (arguments.length == 1) {
            var pair = this._splitWGS84(arguments[0]);
            lonD = pair[0];
            latD = pair[1]
        }
        if (typeof lonD == "string") {
            lonD = this._fromWGS84str(lonD)
        }
        if (typeof latD == "string") {
            latD = this._fromWGS84str(latD)
        }
        return new this(lonD, latD)
    };


    /**
     * Přidání startu. Pokud již nějaký start existuje, smaže se a místo něj se přidá nový. Parametry určují, jak se bude plánovat z tohoto bodu k dalšímu.
     * @param {object} [coords] souřadnice SMap.Coords
     * @param {object} [options] volitelná konfigurace
     * @param {array}  [options.poi] pole o dvou prvcích, kde první představuje source a druhý id bodu [source, id]
     * @param {string} [options.type] určení druhu dopravy: "car" (default), "bike", "trial"
     * @param {boolean} [options.carTypeShort] pouze pokud je doprava "car" určuje, zda se pojede nejkratší cestou, jinak se naplánuje nejrychlejší (default: false)
     * @param {boolean} [options.carTypeNoToll] pouze pokud je doprava "car" určuje, zda se má vyhnout placeným úsekům, (default: false)
     * @param {boolean} [options.bikeRoad] pouze pokud je doprava "bike" určuje, zda se má plánovat po silnicích (default: false)
     * @param {boolean} [options.bikeTrials] pouze pokud je doprava "bike" určuje, zda se má plánovat po cyklotrasách (dafault: true)
     * @param {boolean} [options.bikeAvoidTraffic] pouze pokud je doprava "bike" určuje, zda se má plánování vyhnout silnicím 1. třídy (default: true)
     * @param {boolean} [options.trialTurist]  pouze pokud je doprava "trial" určuje, zda se mají při plánování preferovat turistické trasy (default: false)
     * @return {object} reference na daný objekt
     */
    addStart(coords, options) {
        this._conf.points.splice(0, 1);
        this._conf.params.splice(0, 1);
        this._conf.coords.splice(0, 1);

        this._addPoint(coords, options, 0);

        return this;
    }

    /**
     * Přidání cíle. Pokud již nějaký cíl existuje, smaže se a místo něj se přidá nový.
     * @param {object} [coords] souřadnice SMap.Coords
     * @param {object} [options] volitelná konfigurace
     * @param {array}  [options.poi] pole o dvou prvcích, kde první představuje source a druhý id bodu [source, id]
     * @return {object} reference na daný objekt
     */
    addDestination(coords, options) {
        this._conf.points.splice(this._conf.points.length - 1, 1);
        this._conf.params.splice(this._conf.params.length - 1, 1);
        this._conf.coords.splice(this._conf.coords.length - 1, 1);

        this._addPoint(coords, options, this._conf.points.length);

        return this;
    }

    /**
     * Přidání průjezdního bodu. Přidává se vždy před cílový bod. Parametry určují, jak se bude plánovat z tohoto bodu k dalšímu.
     * @param {object} [coords] souřadnice SMap.Coords
     * @param {object} [options] volitelná konfigurace
     * @param {array}  [options.poi] pole o dvou prvcích, kde první představuje source a druhý id bodu [source, id]
     * @param {string} [options.type] určení druhu dopravy: "car" (default), "bike", "trial"
     * @param {boolean} [options.carTypeShort] pouze pokud je doprava "car" určuje, zda se pojede nejkratší cestou, jinak se naplánuje nejrychlejší (default: false)
     * @param {boolean} [options.carTypeNoToll] pouze pokud je doprava "car" určuje, zda se má vyhnout placeným úsekům, (default: false)
     * @param {boolean} [options.bikeRoad] pouze pokud je doprava "bike" určuje, zda se má plánovat po silnicích (default: false)
     * @param {boolean} [options.bikeTrials] pouze pokud je doprava "bike" určuje, zda se má plánovat po cyklotrasách (dafault: true)
     * @param {boolean} [options.bikeAvoidTraffic] pouze pokud je doprava "bike" určuje, zda se má plánování vyhnout silnicím 1. třídy (default: true)
     * @param {boolean} [options.trialTurist]  pouze pokud je doprava "trial" určuje, zda se mají při plánování preferovat turistické trasy (default: false)
     * @return {object} reference na daný objekt
     */
    addWaypoint(coords, options) {
        this._addPoint(coords, options, this._conf.points.length - 1);

        return this;
    }

    /**
     * Získání url do plánovače na mapy.cz
     * @return {string} url na mapy.cz
     */
    toString() {
        var url = this._url;

        if (this._conf.points.length) {
            url += this._buildUrlParams();
        }

        return url;
    }

    /**
     * Přidání bodu podle indexu
     * @private
     * @param {object} [coords] souřadnice SMap.Coords
     * @param {object} [options] volitelná konfigurace
     * @param {integer} [index] index, na který se bod přidá
     */
    _addPoint(coords, options, index) {
        if (options && options.poi && options.poi.length == 2) {
            this._conf.points.splice(index, 0, { source: options.poi[0], id: options.poi[1] });
        }
        else {
            this._conf.points.splice(index, 0, { source: "coor", id: null });
        }
        this._conf.coords.splice(index, 0, coords);
        this._conf.params.splice(index, 0, this._getParams(options));
    }

    /**
     * Převod 
     * @private
     * @param  {object} params objekt s konfigurací parametrů trasy
     * @return {object} objekt s parametry do url
     * 
     */
    _getParams(params) {
        var p = {
            c: 111
        };

        if (params && params.type) {
            switch (params.type) {
                case "car":
                    if (params.carTypeShort) {
                        p.c = 114;

                        if (params.carTypeNoToll) {
                            p.c = 113;
                        }
                    }
                    if (params.carTypeNoToll) {
                        p.c = 112;
                    }
                    break;
                case "bike":
                    p.c = 121;
                    if (params.bikeRoad && !params.bikeTrials) {
                        p.c = 122;
                    }
                    break;
                case "trial":
                    p.c = 131;
                    if (params.trialTurist) {
                        p.c = 132;
                    }
                    break;
                case "water":
                    p.c = 143;
                    break;
                case "ski":
                    p.c = 141;
                    break;
                case "pubt":
                    p.c = 200;
                    break;
            }
        } else if (params && params.poi && params.poi[0]) {
            switch (params.poi[0]) {
                case "car":
                    if (params.carTypeShort) {
                        p.c = 114;

                        if (params.carTypeNoToll) {
                            p.c = 113;
                        }
                    }
                    if (params.carTypeNoToll) {
                        p.c = 112;
                    }
                    break;
                case "bike":
                    p.c = 121;
                    if (params.bikeRoad && !params.bikeTrials) {
                        p.c = 122;
                    }
                    break;
                case "trial":
                    p.c = 131;
                    if (params.trialTurist) {
                        p.c = 132;
                    }
                    break;
                case "water":
                    p.c = 143;
                    break;
                case "ski":
                    p.c = 141;
                    break;
                case "pubt":
                    p.c = 200;
                    break;
            }
        }

        return p;
    }

    /**
     * Vytvoření objektu parametru v url
     * @return {string} nastavení routovače
     */
    _buildUrlParams() {
        var url = "&";
        var coords = [];
        var rs = [];
        var ri = [];
        var mrp = [];

        for (var i = 0; i < this._conf.points.length; i++) {
            if (this._conf.coords[i]) { coords.push(this._conf.coords[i]); }
            rs.push(this._conf.points[i].source ? this._conf.points[i].source : "");
            ri.push(this._conf.points[i].id ? this._conf.points[i].id : "");
            mrp.push(this._conf.params[i] ? JSON.stringify(this._conf.params[i]) : "");
        }

        // coords
        url += "rc=" + coordsToString(coords)

        // sources
        for (var i = 0; i < rs.length; i++) {
            url += "&rs=" + rs[i];
        }

        // ids
        for (var i = 0; i < ri.length; i++) {
            url += "&ri=" + ri[i];
        }

        // params
        for (var i = 0; i < mrp.length; i++) {
            url += "&mrp=" + mrp[i];
        }

        return url;
    };
}

function parse(what, name) {
    let dp = new DOMParser();
    let gpx = dp.parseFromString(what, "text/xml");
    let waypoints = gpx.getElementsByTagName("rtept");

    if (waypoints.length) {
        let path = new MapyCzRoute();

        for (let i = 0; i < waypoints.length; i++) {
            let coord = {
                x: parseFloat(waypoints[i].getAttribute("lon")),
                y: parseFloat(waypoints[i].getAttribute("lat"))
            };

            if (i == 0) {
                path.addStart(coord)
            } else if (i == waypoints.length - 1) {
                path.addDestination(coord)
            } else {
                path.addWaypoint(coord)
            }
        }

        let a = document.createElement("a");
        a.href = path.toString();
        a.target = "_blank";
        a.innerText = name
        document.getElementById("links").appendChild(a)
    } else {
        alert("Zvolený soubor nejspíš není v správném formátu. Ujisti se, že tvůj GPX soubor není typu track (převést lze pouze typ waypoint)")
    }
}

document.getElementById("gpxsoubor").onchange = (e) => {
    let open = e.target.files[0];

    if (!open) {
        return;
    }

    if (!open.name.endsWith(".gpx")) {
        alert("Vyber prosím soubor .gpx.");
        return;
    }

    let read = new FileReader();

    read.onload = (e) => {
        let contents = e.target.result;
        let node = parse(contents, open.name);
    };

    read.readAsText(open);
}