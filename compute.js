
function getFloat(name) {
    return parseFloat(document.getElementById(name).value);
}

function getBool(name) {
    return document.getElementById(name).value != 0;
}

function compute() {
    let reqFuel = getFloat("reqFuel");
    let openTime = getFloat("openTime");

    let paired = getBool("paired");
    let nCylinders = getFloat("nCylinders");
    let nSquirts = getFloat("nSquirts");
    let nStrokes = 2 / (2-getFloat("nStrokes"));
    let alternate = getBool("alternate");

    if (paired) {
        nCylinders = Math.ceil(nCylinders / 2);
    }

    let inj1, inj2, inj3, inj4;
    let gap = 720 / (nStrokes * nSquirts * nCylinders);

    if (alternate) {
        inj1 = gap * 0 + '°';
        inj2 = gap * 1 + '°';
        inj3 = gap * 2 + '°';
        inj4 = gap * 3 + '°';
    }
    else {
        inj1 = 0 + '°';
        inj2 = 0 + '°';
        inj3 = 0 + '°';
        inj4 = 0 + '°';
    }
    if (nCylinders < 2) inj2 = "disabled";
    if (nCylinders < 3) inj3 = "disabled";
    if (nCylinders < 4) inj4 = "disabled";

    document.getElementById("PW").innerText = (reqFuel / nSquirts) + openTime;
    document.getElementById("cycle").innerText = gap * nCylinders;
    document.getElementById("inj1").innerText = inj1;
    document.getElementById("inj2").innerText = inj2;
    document.getElementById("inj3").innerText = inj3;
    document.getElementById("inj4").innerText = inj4;
}

function disablePaired(nCyl) {
    if (nCyl > 5) {
        document.getElementById("paired").value = 1;
        document.getElementById("paired").disabled = true;
    }
    else {
        document.getElementById("paired").disabled = false;
    }
}
