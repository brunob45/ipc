
function getFloat(name) {
    return parseFloat(document.getElementById(name).value);
}

function getBool(name) {
    return document.getElementById(name).value != 0;
}

function compute() {
    let FOUR_STROKE = 0
    let TWO_STROKE = 1

    // let IGN_MODE_WASTED = 0
    // let IGN_MODE_SINGLE = 1
    // let IGN_MODE_WASTEDCOP = 2
    // let IGN_MODE_SEQUENTIAL = 3
    // let IGN_MODE_ROTARY = 4

    let INJ_PAIRED = 0
    let INJ_SEMISEQUENTIAL = 1
    let INJ_BANKED = 2
    let INJ_SEQUENTIAL = 3

    let INJ_CHANNELS = 4
    let IGN_CHANNELS = 4

    let reqFuel = getFloat("reqFuel");
    // let openTime = getFloat("openTime");

    let injLayout = getFloat("paired");
    let nCylinders = getFloat("nCylinders");
    let divider = Math.floor(nCylinders / getFloat("nSquirts"));
    let strokes = getBool("strokes");
    let injTiming = getBool("alternate");

    let req_fuel_uS = reqFuel * 100;
    //let inj_opentime_uS = openTime;

    if (strokes == FOUR_STROKE)
    {
        //Default is 1 squirt per revolution, so we halve the given req-fuel figure (Which would be over 2 revolutions)
        req_fuel_uS = Math.floor(req_fuel_uS / 2); //The req_fuel calculation above gives the total required fuel (At VE 100%) in the full cycle. If we're doing more than 1 squirt per cycle then we need to split the amount accordingly. (Note that in a non-sequential 4-stroke setup you cannot have less than 2 squirts as you cannot determine the stroke to make the single squirt on)
    }

    let nSquirts = Math.floor(nCylinders / divider); //The number of squirts being requested. This is manaully overriden below for sequential setups (Due to TS req_fuel calc limitations)
    if(nSquirts == 0) { nSquirts = 1; } //Safety check. Should never happen as TS will give an error, but leave incase tune is manually altered etc. 


    //Calculate the number of degrees between cylinders
    //Swet some default values. These will be updated below if required. 
    let CRANK_ANGLE_MAX = 720;
    let CRANK_ANGLE_MAX_INJ = 360;
    let CRANK_ANGLE_MAX_IGN = 360;
    let channel1InjEnabled = true;
    let channel2InjEnabled = false;
    let channel3InjEnabled = false;
    let channel4InjEnabled = false;
    let channel5InjEnabled = false;
    let channel6InjEnabled = false;
    let channel7InjEnabled = false;
    let channel8InjEnabled = false;

    let channel1InjDegrees = 0;
    let channel2InjDegrees = 0;
    let channel3InjDegrees = 0;
    let channel4InjDegrees = 0;
    let channel5InjDegrees = 0;
    let channel6InjDegrees = 0;
    let channel7InjDegrees = 0;
    let channel8InjDegrees = 0;

    if(strokes == FOUR_STROKE) { CRANK_ANGLE_MAX_INJ = Math.floor(720 / nSquirts); }
    else { CRANK_ANGLE_MAX_INJ = Math.floor(360 / nSquirts); }

    switch (nCylinders) {
    case 1:
        channel1InjDegrees = 0;

        if ( (injLayout == INJ_SEQUENTIAL) && (strokes == FOUR_STROKE) )
        {
            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }

        channel1InjEnabled = true;
        break;

    case 2:
        channel1InjDegrees = 0;

        if ( (injLayout == INJ_SEQUENTIAL) && (strokes == FOUR_STROKE) )
        {
            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }
        //The below are true regardless of whether this is running sequential or not
        if (engineType == EVEN_FIRE ) { channel2InjDegrees = 180; }
        else { channel2InjDegrees = oddfire2; }
        if (!injTiming) 
        { 
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0; 
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;

        break;

    case 3:
        //For alternating injection, the squirt occurs at different times for each channel
        if( (injLayout == INJ_SEMISEQUENTIAL) || (injLayout == INJ_PAIRED) || (strokes == TWO_STROKE) )
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 120;
            channel3InjDegrees = 240;

            //Adjust the injection angles based on the number of squirts
            if (nSquirts > 2)
            {
            channel2InjDegrees = Math.floor((channel2InjDegrees * 2) / nSquirts);
            channel3InjDegrees = Math.floor((channel3InjDegrees * 2) / nSquirts);
            }

            if (!injTiming) 
            { 
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0; 
            } 
        }
        else if (injLayout == INJ_SEQUENTIAL)
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 240;
            channel3InjDegrees = 480;
            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        break;
    case 4:
        //For alternating injection, the squirt occurs at different times for each channel
        if( (injLayout == INJ_SEMISEQUENTIAL) || (injLayout == INJ_PAIRED) || (strokes == TWO_STROKE) )
        {
            channel2InjDegrees = 180;

            if (!injTiming) 
            { 
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0; 
            }
            else if (nSquirts > 2)
            {
            //Adjust the injection angles based on the number of squirts
            channel2InjDegrees = Math.floor((channel2InjDegrees * 2) / nSquirts);
            }
        }
        else if (injLayout == INJ_SEQUENTIAL)
        {
            channel2InjDegrees = 180;
            channel3InjDegrees = 360;
            channel4InjDegrees = 540;

            channel3InjEnabled = true;
            channel4InjEnabled = true;

            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        break;
    case 5:
        //For alternating injection, the squirt occurs at different times for each channel
        if( (injLayout == INJ_SEMISEQUENTIAL) || (injLayout == INJ_PAIRED) || (strokes == TWO_STROKE) )
        {
            if (!injTiming) 
            { 
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0;
            channel4InjDegrees = 0;
            channel5InjDegrees = 0; 
            }
            else
            {
            channel1InjDegrees = 0;
            channel2InjDegrees = 72;
            channel3InjDegrees = 144;
            channel4InjDegrees = 216;
            channel5InjDegrees = 288;

            //Divide by nSquirts ?
            }
        }
    // #if INJ_CHANNELS >= 5
        else if (injLayout == INJ_SEQUENTIAL && INJ_CHANNELS >= 5)
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 144;
            channel3InjDegrees = 288;
            channel4InjDegrees = 432;
            channel5InjDegrees = 576;

            channel5InjEnabled = true;

            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }
    // #endif

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        channel4InjEnabled = true;
        break;
    case 6:
        //For alternating injection, the squirt occurs at different times for each channel
        if( (injLayout == INJ_SEMISEQUENTIAL) || (injLayout == INJ_PAIRED) )
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 120;
            channel3InjDegrees = 240;
            if (!injTiming)
            {
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0;
            }
            else if (nSquirts > 2)
            {
            //Adjust the injection angles based on the number of squirts
            channel2InjDegrees = Math.floor((channel2InjDegrees * 2) / nSquirts);
            channel3InjDegrees = Math.floor((channel3InjDegrees * 2) / nSquirts);
            }
        }

    // #if INJ_CHANNELS >= 6
        else if (injLayout == INJ_SEQUENTIAL && INJ_CHANNELS >= 6)
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 120;
            channel3InjDegrees = 240;
            channel4InjDegrees = 360;
            channel5InjDegrees = 480;
            channel6InjDegrees = 600;

            channel4InjEnabled = true;
            channel5InjEnabled = true;
            channel6InjEnabled = true;

            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }
    // #endif

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        break;
    case 8:

        //For alternating injection, the squirt occurs at different times for each channel
        if( (injLayout == INJ_SEMISEQUENTIAL) || (injLayout == INJ_PAIRED) )
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 90;
            channel3InjDegrees = 180;
            channel4InjDegrees = 270;

            if (!injTiming)
            {
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0;
            channel4InjDegrees = 0;
            }
            else if (nSquirts > 2)
            {
            //Adjust the injection angles based on the number of squirts
            channel2InjDegrees = Math.floor((channel2InjDegrees * 2) / nSquirts);
            channel3InjDegrees = Math.floor((channel3InjDegrees * 2) / nSquirts);
            channel4InjDegrees = Math.floor((channel4InjDegrees * 2) / nSquirts);
            }
        }

    // #if INJ_CHANNELS >= 8
        else if (injLayout == INJ_SEQUENTIAL && INJ_CHANNELS >= 8)
        {
            channel1InjDegrees = 0;
            channel2InjDegrees = 90;
            channel3InjDegrees = 180;
            channel4InjDegrees = 270;
            channel5InjDegrees = 360;
            channel6InjDegrees = 450;
            channel7InjDegrees = 540;
            channel8InjDegrees = 630;

            channel5InjEnabled = true;
            channel6InjEnabled = true;
            channel7InjEnabled = true;
            channel8InjEnabled = true;

            CRANK_ANGLE_MAX_INJ = 720;
            nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
        }
    // #endif

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        channel4InjEnabled = true;
        break;
    default: //Handle this better!!!
        channel1InjDegrees = 0;
        channel2InjDegrees = 180;
        break;
    }

    if(CRANK_ANGLE_MAX_IGN == CRANK_ANGLE_MAX_INJ) { CRANK_ANGLE_MAX = CRANK_ANGLE_MAX_IGN; } //If both the injector max and ignition max angles are the same, make the overall system max this value
    else if (CRANK_ANGLE_MAX_IGN > CRANK_ANGLE_MAX_INJ) { CRANK_ANGLE_MAX = CRANK_ANGLE_MAX_IGN; }
    else { CRANK_ANGLE_MAX = CRANK_ANGLE_MAX_INJ; }
    
    //Special case:
    //3 or 5 squirts per cycle MUST be tracked over 720 degrees. This is because the angles for them (Eg 720/3=240) are not evenly divisible into 360
    //This is ONLY the case on 4 stroke systems
    if( (nSquirts == 3) || (nSquirts == 5) )
    {
        if(strokes == FOUR_STROKE) { CRANK_ANGLE_MAX = 720; }
    }

    if  (injLayout == INJ_SEMISEQUENTIAL)
    {
        //Semi-Sequential injection. Currently possible with 4, 6 and 8 cylinders. 5 cylinder is a special case
        if( nCylinders == 4 )
        {
            channel3InjDegrees = channel2InjDegrees;
            channel4InjDegrees = channel1InjDegrees;

            channel3InjEnabled = true;
            channel4InjEnabled = true;
        }
        else if( nCylinders == 5 ) //This is similar to the paired injection but uses five injector outputs instead of four
        {
          channel3InjDegrees = channel5InjDegrees;
          channel3InjEnabled = true;
        }
        else if( nCylinders == 6 )
        {
            channel4InjDegrees = channel1InjDegrees;
            channel5InjDegrees = channel2InjDegrees;
            channel6InjDegrees = channel3InjDegrees;

            channel4InjEnabled = true;
            channel5InjEnabled = true;
            channel6InjEnabled = true;
        }
        else if( nCylinders == 8 )
        {
            channel5InjDegrees = channel1InjDegrees;
            channel6InjDegrees = channel2InjDegrees;
            channel7InjDegrees = channel3InjDegrees;
            channel8InjDegrees = channel4InjDegrees;

            channel5InjEnabled = true;
            channel6InjEnabled = true;
            channel7InjEnabled = true;
            channel8InjEnabled = true;
        }
        else
        {
            //Fall back to paired injection
        }
    }

    document.getElementById("PW").innerText = req_fuel_uS / 100; // + openTime;
    document.getElementById("cycle").innerText = CRANK_ANGLE_MAX; //gap * nCylinders;
    document.getElementById("inj1").innerText = channel1InjEnabled ? channel1InjDegrees : "Disabled";
    document.getElementById("inj2").innerText = channel2InjEnabled ? channel2InjDegrees : "Disabled";
    document.getElementById("inj3").innerText = channel3InjEnabled ? channel3InjDegrees : "Disabled";
    document.getElementById("inj4").innerText = channel4InjEnabled ? channel4InjDegrees : "Disabled";
    document.getElementById("inj5").innerText = channel5InjEnabled ? channel5InjDegrees : "Disabled";
    document.getElementById("inj6").innerText = channel6InjEnabled ? channel6InjDegrees : "Disabled";
    document.getElementById("inj7").innerText = channel7InjEnabled ? channel7InjDegrees : "Disabled";
    document.getElementById("inj8").innerText = channel8InjEnabled ? channel8InjDegrees : "Disabled";
}

function disablePaired(nCyl) {
    // if (nCyl > 5) {
    //     document.getElementById("paired").value = 1;
    //     document.getElementById("paired").disabled = true;
    // }
    // else {
    //     document.getElementById("paired").disabled = false;
    // }
    document.getElementById("paired").disabled = false;
}
