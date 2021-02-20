
let GOING_LOW = 0;
let GOING_HIGH = 1;

let FOUR_STROKE = 0;
let TWO_STROKE = 1;

let EVEN_FIRE = 0;
let ODD_FIRE = 1;

let INJ_CHANNELS = 4;
let IGN_CHANNELS = 4;

let IGN_MODE_WASTED = 0;
let IGN_MODE_SINGLE = 1;
let IGN_MODE_WASTEDCOP = 2;
let IGN_MODE_SEQUENTIAL = 3;
let IGN_MODE_ROTARY = 4;

let INJ_PAIRED = 0;
let INJ_SEMISEQUENTIAL = 1;
let INJ_BANKED = 2;
let INJ_SEQUENTIAL = 3;

var CRANK_ANGLE_MAX = 720;
var CRANK_ANGLE_MAX_IGN = 360;
var CRANK_ANGLE_MAX_INJ = 360;
var channel1InjEnabled = false;
var channel2InjEnabled = false;
var channel3InjEnabled = false;
var channel4InjEnabled = false;
var channel5InjEnabled = false;
var channel6InjEnabled = false;
var channel7InjEnabled = false;
var channel8InjEnabled = false;

var channel1InjDegrees = 0;
var channel2InjDegrees = 0;
var channel3InjDegrees = 0;
var channel4InjDegrees = 0;
var channel5InjDegrees = 0;
var channel6InjDegrees = 0;
var channel7InjDegrees = 0;
var channel8InjDegrees = 0;

var configPage2 = class page2 {}
var configPage4 = class page4 {}
var configPage10 = class page10 {}
var currentStatus = class cs {}
var req_fuel_uS = 0;

var scatterChart = null;

function init()
{
  scatterChart = new Chart(document.getElementById('myChart'), {
    type: 'scatter',
    data: { datasets: [] },
    options: {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom',
                scaleLabel: {
                    display: true,
                    labelString: 'degrees'
                },
                ticks: {
                    suggestedMin: -360,
                    suggestedMax: 360,
                    stepSize:90
                }
            }],
            yAxes: [{
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 8
                }
            }]
        },
        elements: {
            point: {
                radius:0
            }
        }
    }
  });
}

function getFloat(name) {
  if (document.getElementById(name) != null)
  {
    return parseFloat(document.getElementById(name).value);
  }
  else
  {
    console.log("Cannot get value of input: " + name)
    return 0;
  }
}

function getBool(name) {
  if (document.getElementById(name) != null)
  {
    return document.getElementById(name).value != 0;
  }
  else
  {
    console.log("Cannot get value of input: " + name)
    return false;
  }
}

function speeduino_calc() {

    req_fuel_uS = configPage2.reqFuel * 100; //Convert to uS and an int. This is the only variable to be used in calculations

    if(configPage2.strokes == FOUR_STROKE)
    {
      //Default is 1 squirt per revolution, so we halve the given req-fuel figure (Which would be over 2 revolutions)
      req_fuel_uS = req_fuel_uS / 2; //The req_fuel calculation above gives the total required fuel (At VE 100%) in the full cycle. If we're doing more than 1 squirt per cycle then we need to split the amount accordingly. (Note that in a non-sequential 4-stroke setup you cannot have less than 2 squirts as you cannot determine the stroke to make the single squirt on)
    }

    // //Initial values for loop times
    // previousLoopTime = 0;
    // currentLoopTime = micros_safe();
    // mainLoopCount = 0;

    currentStatus.nSquirts = configPage2.nCylinders / configPage2.divider; //The number of squirts being requested. This is manaully overriden below for sequential setups (Due to TS req_fuel calc limitations)
    if(currentStatus.nSquirts == 0) { currentStatus.nSquirts = 1; } //Safety check. Should never happen as TS will give an error, but leave incase tune is manually altered etc. 

    //Calculate the number of degrees between cylinders
    //Swet some default values. These will be updated below if required. 
    CRANK_ANGLE_MAX = 720;
    CRANK_ANGLE_MAX_IGN = 360;
    CRANK_ANGLE_MAX_INJ = 360;
    channel1InjEnabled = true;
    channel2InjEnabled = false;
    channel3InjEnabled = false;
    channel4InjEnabled = false;
    channel5InjEnabled = false;
    channel6InjEnabled = false;
    channel7InjEnabled = false;
    channel8InjEnabled = false;

    if(configPage2.strokes == FOUR_STROKE) { CRANK_ANGLE_MAX_INJ = 720 / currentStatus.nSquirts; }
    else { CRANK_ANGLE_MAX_INJ = 360 / currentStatus.nSquirts; }

    switch (configPage2.nCylinders) {
    case 1:
        channel1IgnDegrees = 0;
        channel1InjDegrees = 0;
        maxIgnOutputs = 1;

        //Sequential ignition works identically on a 1 cylinder whether it's odd or even fire. 
        if( (configPage4.sparkMode == IGN_MODE_SEQUENTIAL) && (configPage2.strokes == FOUR_STROKE) ) { CRANK_ANGLE_MAX_IGN = 720; }

        if ( (configPage2.injLayout == INJ_SEQUENTIAL) && (configPage2.strokes == FOUR_STROKE) )
        {
          CRANK_ANGLE_MAX_INJ = 720;
          currentStatus.nSquirts = 1;
          req_fuel_uS = req_fuel_uS * 2;
        }

        channel1InjEnabled = true;

        //Check if injector staging is enabled
        if(configPage10.stagingEnabled == true)
        {
          channel3InjEnabled = true;
          channel3InjDegrees = channel1InjDegrees;
        }
        break;

    case 2:
        channel1IgnDegrees = 0;
        channel1InjDegrees = 0;
        maxIgnOutputs = 2;
        if (configPage2.engineType == EVEN_FIRE ) { channel2IgnDegrees = 180; }
        else { channel2IgnDegrees = configPage2.oddfire2; }

        //Sequential ignition works identically on a 2 cylinder whether it's odd or even fire (With the default being a 180 degree second cylinder). 
        if( (configPage4.sparkMode == IGN_MODE_SEQUENTIAL) && (configPage2.strokes == FOUR_STROKE) ) { CRANK_ANGLE_MAX_IGN = 720; }

        if ( (configPage2.injLayout == INJ_SEQUENTIAL) && (configPage2.strokes == FOUR_STROKE) )
        {
          CRANK_ANGLE_MAX_INJ = 720;
          currentStatus.nSquirts = 1;
          req_fuel_uS = req_fuel_uS * 2;
        }
        //The below are true regardless of whether this is running sequential or not
        if (configPage2.engineType == EVEN_FIRE ) { channel2InjDegrees = 180; }
        else { channel2InjDegrees = configPage2.oddfire2; }
        if (!configPage2.injTiming) 
        { 
          //For simultaneous, all squirts happen at the same time
          channel1InjDegrees = 0;
          channel2InjDegrees = 0; 
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;

        //Check if injector staging is enabled
        if(configPage10.stagingEnabled == true)
        {
          channel3InjEnabled = true;
          channel4InjEnabled = true;

          channel3InjDegrees = channel1InjDegrees;
          channel4InjDegrees = channel2InjDegrees;
        }

        break;

    case 3:
        channel1IgnDegrees = 0;
        maxIgnOutputs = 3;
        if (configPage2.engineType == EVEN_FIRE )
        {
        //Sequential and Single channel modes both run over 720 crank degrees, but only on 4 stroke engines. 
        if( ( (configPage4.sparkMode == IGN_MODE_SEQUENTIAL) || (configPage4.sparkMode == IGN_MODE_SINGLE) ) && (configPage2.strokes == FOUR_STROKE) )
        {
          channel2IgnDegrees = 240;
          channel3IgnDegrees = 480;

          CRANK_ANGLE_MAX_IGN = 720;
        }
        else
        {
          channel2IgnDegrees = 120;
          channel3IgnDegrees = 240;
        }
        }
        else
        {
        channel2IgnDegrees = configPage2.oddfire2;
        channel3IgnDegrees = configPage2.oddfire3;
        }

        //For alternating injection, the squirt occurs at different times for each channel
        if( (configPage2.injLayout == INJ_SEMISEQUENTIAL) || (configPage2.injLayout == INJ_PAIRED) || (configPage2.strokes == TWO_STROKE) )
        {
          channel1InjDegrees = 0;
          channel2InjDegrees = 120;
          channel3InjDegrees = 240;

          //Adjust the injection angles based on the number of squirts
          if (currentStatus.nSquirts > 2)
          {
            channel2InjDegrees = (channel2InjDegrees * 2) / currentStatus.nSquirts;
            channel3InjDegrees = (channel3InjDegrees * 2) / currentStatus.nSquirts;
          }

          if (!configPage2.injTiming) 
          { 
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0; 
          } 
        }
        else if (configPage2.injLayout == INJ_SEQUENTIAL)
        {
          channel1InjDegrees = 0;
          channel2InjDegrees = 240;
          channel3InjDegrees = 480;
          CRANK_ANGLE_MAX_INJ = 720;
          currentStatus.nSquirts = 1;
          req_fuel_uS = req_fuel_uS * 2;
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        break;
    case 4:
        channel1IgnDegrees = 0;
        channel1InjDegrees = 0;
        maxIgnOutputs = 2; //Default value for 4 cylinder, may be changed below
        if (configPage2.engineType == EVEN_FIRE )
        {
          channel2IgnDegrees = 180;

          if( (configPage4.sparkMode == IGN_MODE_SEQUENTIAL) && (configPage2.strokes == FOUR_STROKE) )
          {
            channel3IgnDegrees = 360;
            channel4IgnDegrees = 540;

            CRANK_ANGLE_MAX_IGN = 720;
            maxIgnOutputs = 4;
          }
          else if(configPage4.sparkMode == IGN_MODE_ROTARY)
          {
            //Rotary uses the ign 3 and 4 schedules for the trailing spark. They are offset from the ign 1 and 2 channels respectively and so use the same degrees as them
            channel3IgnDegrees = 0;
            channel4IgnDegrees = 180;
            maxIgnOutputs = 4;

            configPage4.IgInv = GOING_LOW; //Force Going Low ignition mode (Going high is never used for rotary)
          }
        }
        else
        {
          channel2IgnDegrees = configPage2.oddfire2;
          channel3IgnDegrees = configPage2.oddfire3;
          channel4IgnDegrees = configPage2.oddfire4;
          maxIgnOutputs = 4;
        }

        //For alternating injection, the squirt occurs at different times for each channel
        if( (configPage2.injLayout == INJ_SEMISEQUENTIAL) || (configPage2.injLayout == INJ_PAIRED) || (configPage2.strokes == TWO_STROKE) )
        {
          channel2InjDegrees = 180;

          if (!configPage2.injTiming) 
          { 
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0; 
          }
          else if (currentStatus.nSquirts > 2)
          {
            //Adjust the injection angles based on the number of squirts
            channel2InjDegrees = (channel2InjDegrees * 2) / currentStatus.nSquirts;
          }
        }
        else if (configPage2.injLayout == INJ_SEQUENTIAL)
        {
          channel2InjDegrees = 180;
          channel3InjDegrees = 360;
          channel4InjDegrees = 540;

          channel3InjEnabled = true;
          channel4InjEnabled = true;

          CRANK_ANGLE_MAX_INJ = 720;
          currentStatus.nSquirts = 1;
          req_fuel_uS = req_fuel_uS * 2;
        }

        //Check if injector staging is enabled
        if(configPage10.stagingEnabled == true)
        {
          channel3InjEnabled = true;
          channel4InjEnabled = true;

          channel3InjDegrees = channel1InjDegrees;
          channel4InjDegrees = channel2InjDegrees;
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        break;
    case 5:
        channel1IgnDegrees = 0;
        channel2IgnDegrees = 72;
        channel3IgnDegrees = 144;
        channel4IgnDegrees = 216;
        channel5IgnDegrees = 288;
        maxIgnOutputs = 5; //Only 4 actual outputs, so that's all that can be cut

        if(configPage4.sparkMode == IGN_MODE_SEQUENTIAL)
        {
          channel2IgnDegrees = 144;
          channel3IgnDegrees = 288;
          channel4IgnDegrees = 432;
          channel5IgnDegrees = 576;

          CRANK_ANGLE_MAX_IGN = 720;
        }

        //For alternating injection, the squirt occurs at different times for each channel
        if( (configPage2.injLayout == INJ_SEMISEQUENTIAL) || (configPage2.injLayout == INJ_PAIRED) || (configPage2.strokes == TWO_STROKE) )
        {
          if (!configPage2.injTiming) 
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

            //Divide by currentStatus.nSquirts ?
          }
        }
        else if (INJ_CHANNELS >= 5) {
            if (configPage2.injLayout == INJ_SEQUENTIAL)
            {
            channel1InjDegrees = 0;
            channel2InjDegrees = 144;
            channel3InjDegrees = 288;
            channel4InjDegrees = 432;
            channel5InjDegrees = 576;

            channel5InjEnabled = true;

            CRANK_ANGLE_MAX_INJ = 720;
            currentStatus.nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
            }
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        channel4InjEnabled = true;
        break;
    case 6:
        channel1IgnDegrees = 0;
        channel2IgnDegrees = 120;
        channel3IgnDegrees = 240;
        maxIgnOutputs = 3;

        if (IGN_CHANNELS >= 6) {
            if( (configPage4.sparkMode == IGN_MODE_SEQUENTIAL))
            {
            channel4IgnDegrees = 360;
            channel5IgnDegrees = 480;
            channel6IgnDegrees = 600;
            CRANK_ANGLE_MAX_IGN = 720;
            maxIgnOutputs = 6;
            }
        }

        //For alternating injection, the squirt occurs at different times for each channel
        if( (configPage2.injLayout == INJ_SEMISEQUENTIAL) || (configPage2.injLayout == INJ_PAIRED) )
        {
          channel1InjDegrees = 0;
          channel2InjDegrees = 120;
          channel3InjDegrees = 240;
          if (!configPage2.injTiming)
          {
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0;
          }
          else if (currentStatus.nSquirts > 2)
          {
            //Adjust the injection angles based on the number of squirts
            channel2InjDegrees = (channel2InjDegrees * 2) / currentStatus.nSquirts;
            channel3InjDegrees = (channel3InjDegrees * 2) / currentStatus.nSquirts;
          }
        }

        else if (INJ_CHANNELS >= 6) {
            if (configPage2.injLayout == INJ_SEQUENTIAL)
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
            currentStatus.nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
            }
        }

        channel1InjEnabled = true;
        channel2InjEnabled = true;
        channel3InjEnabled = true;
        break;
    case 8:
        channel1IgnDegrees = 0;
        channel2IgnDegrees = 90;
        channel3IgnDegrees = 180;
        channel4IgnDegrees = 270;
        maxIgnOutputs = 4;

        if (IGN_CHANNELS >= 1) {
            if( (configPage4.sparkMode == IGN_MODE_SINGLE))
            {
            maxIgnOutputs = 1;
            CRANK_ANGLE_MAX_IGN = 90;
            }
        }

        if (IGN_CHANNELS >= 8) {
            if( (configPage4.sparkMode == IGN_MODE_SEQUENTIAL))
            {
            channel5IgnDegrees = 360;
            channel6IgnDegrees = 450;
            channel7IgnDegrees = 540;
            channel8IgnDegrees = 630;
            maxIgnOutputs = 8;
            CRANK_ANGLE_MAX_IGN = 720;
            }
        }

        //For alternating injection, the squirt occurs at different times for each channel
        if( (configPage2.injLayout == INJ_SEMISEQUENTIAL) || (configPage2.injLayout == INJ_PAIRED) )
        {
          channel1InjDegrees = 0;
          channel2InjDegrees = 90;
          channel3InjDegrees = 180;
          channel4InjDegrees = 270;

          if (!configPage2.injTiming)
          {
            //For simultaneous, all squirts happen at the same time
            channel1InjDegrees = 0;
            channel2InjDegrees = 0;
            channel3InjDegrees = 0;
            channel4InjDegrees = 0;
          }
          else if (currentStatus.nSquirts > 2)
          {
            //Adjust the injection angles based on the number of squirts
            channel2InjDegrees = (channel2InjDegrees * 2) / currentStatus.nSquirts;
            channel3InjDegrees = (channel3InjDegrees * 2) / currentStatus.nSquirts;
            channel4InjDegrees = (channel4InjDegrees * 2) / currentStatus.nSquirts;
          }
        }

        else if (INJ_CHANNELS >= 8) {
            if (configPage2.injLayout == INJ_SEQUENTIAL)
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
            currentStatus.nSquirts = 1;
            req_fuel_uS = req_fuel_uS * 2;
            }
        }

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
    // currentStatus.status3 = currentStatus.nSquirts << BIT_STATUS3_NSQUIRTS1; //Top 3 bits of the status3 variable are the number of squirts. This must be done after the above section due to nSquirts being forced to 1 for sequential
    
    //Special case:
    //3 or 5 squirts per cycle MUST be tracked over 720 degrees. This is because the angles for them (Eg 720/3=240) are not evenly divisible into 360
    //This is ONLY the case on 4 stroke systems
    if( (currentStatus.nSquirts == 3) || (currentStatus.nSquirts == 5) )
    {
      if(configPage2.strokes == FOUR_STROKE) { CRANK_ANGLE_MAX = 720; }
    }
}

function compute() {

    INJ_CHANNELS = getFloat("INJ_CHANNELS");
    IGN_CHANNELS = 4;

    configPage2.injLayout = getFloat("paired");
    configPage2.nCylinders = getFloat("nCylinders");
    configPage2.divider = Math.floor(configPage2.nCylinders / getFloat("nSquirts"));
    configPage2.strokes = getFloat("strokes");
    configPage2.injTiming = getBool("alternate");
    configPage2.engineType = getFloat("engine_type");

    if (configPage2.injTiming)
      configPage2.reqFuel = Math.floor(getFloat("reqFuel") / getFloat("nSquirts") * 20)/10;
    else
      configPage2.reqFuel = Math.floor(getFloat("reqFuel") / getFloat("nSquirts") * 10)/10;

    configPage4.sparkMode = IGN_MODE_WASTED;
    configPage4.IgInv = GOING_HIGH;
    configPage10.stagingEnabled = false;

    if (document.getElementById("actualms") != null)
      document.getElementById("actualms").value = configPage2.reqFuel;

    CRANK_ANGLE_MAX = 720;
    CRANK_ANGLE_MAX_IGN = 360;
    CRANK_ANGLE_MAX_INJ = 360;
    channel1InjEnabled = false;
    channel2InjEnabled = false;
    channel3InjEnabled = false;
    channel4InjEnabled = false;
    channel5InjEnabled = false;
    channel6InjEnabled = false;
    channel7InjEnabled = false;
    channel8InjEnabled = false;

    channel1InjDegrees = 0;
    channel2InjDegrees = 0;
    channel3InjDegrees = 0;
    channel4InjDegrees = 0;
    channel5InjDegrees = 0;
    channel6InjDegrees = 0;
    channel7InjDegrees = 0;
    channel8InjDegrees = 0;


    speeduino_calc();

    if  (configPage2.injLayout == INJ_SEMISEQUENTIAL)
    {
        //Semi-Sequential injection. Currently possible with 4, 6 and 8 cylinders. 5 cylinder is a special case
        if( configPage2.nCylinders == 4 )
        {
            channel3InjDegrees = channel2InjDegrees;
            channel4InjDegrees = channel1InjDegrees;

            channel3InjEnabled = true;
            channel4InjEnabled = true;
        }
        else if( configPage2.nCylinders == 5 ) //This is similar to the paired injection but uses five injector outputs instead of four
        {
          channel5InjDegrees = channel3InjDegrees;
          channel3InjEnabled = true;
          channel5InjEnabled = true;
        }
        else if( configPage2.nCylinders == 6 )
        {
            channel4InjDegrees = channel1InjDegrees;
            channel5InjDegrees = channel2InjDegrees;
            channel6InjDegrees = channel3InjDegrees;

            channel4InjEnabled = true;
            channel5InjEnabled = true;
            channel6InjEnabled = true;
        }
        else if( configPage2.nCylinders == 8 )
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

    let angle_max = 720;
    if (configPage2.strokes == TWO_STROKE) angle_max = 360;

    let dcPercent = getFloat("dcPercent");
    let timing = getFloat("injTiming")+(angle_max/2);
    let channelInfo = [
        {"open":timing + channel1InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel1InjDegrees, "enabled":channel1InjEnabled},
        {"open":timing + channel2InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel2InjDegrees, "enabled":channel2InjEnabled},
        {"open":timing + channel3InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel3InjDegrees, "enabled":channel3InjEnabled},
        {"open":timing + channel4InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel4InjDegrees, "enabled":channel4InjEnabled},
        {"open":timing + channel5InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel5InjDegrees, "enabled":channel5InjEnabled},
        {"open":timing + channel6InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel6InjDegrees, "enabled":channel6InjEnabled},
        {"open":timing + channel7InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel7InjDegrees, "enabled":channel7InjEnabled},
        {"open":timing + channel8InjDegrees - (dcPercent * req_fuel_uS)/100, "close":timing + channel8InjDegrees, "enabled":channel8InjEnabled}
    ];

    var results = [[],[],[],[],[],[],[],[]];

    let i=0, j=0;
    for (i = 0; i <= angle_max; i++)
    {
        for (j = 0; j < 8; j++)
        {
            let injecting = channelInfo[j]["enabled"];

            let start = channelInfo[j]["open"] % CRANK_ANGLE_MAX_INJ;
            let stop = channelInfo[j]["close"];
            while(start < 0)
            {
              start += CRANK_ANGLE_MAX_INJ;
              stop += CRANK_ANGLE_MAX_INJ;
            }
            stop %= CRANK_ANGLE_MAX_INJ;
            let deg = i % CRANK_ANGLE_MAX_INJ;

            if (start < stop)
            {
                injecting &= ((deg > start) && (deg < stop));
            }
            else
            {
                injecting &= ((deg > start) || (deg < stop));
            }

            if (injecting)
            {
                results[j].push({x:i-(angle_max/2), y:1+j});
            }
            else
            {
                results[j].push({x:i-(angle_max/2), y:0+j});
            }
        }
    }

    if (scatterChart == null)
    {
      init();
    }

    let colors = [
        'rgb(255, 0, 0)',
        'rgb(0, 255, 0)',
        'rgb(0, 0, 255)',
        'rgb(255, 255, 0)',
        'rgb(255, 0, 255)',
        'rgb(0, 255, 255)',
        'rgb(255, 255, 255)',
        'rgb(0, 0, 0)',
    ];
    scatterChart.data.datasets = [];
    i = 0;
    for (i = 0; i < 8; i++)
    {
        if (channelInfo[i]["enabled"])
        {
            scatterChart.data.datasets.push(
                {
                    label: 'Channel ' + (i+1).toString(),
                    backgroundColor: colors[i],
                    borderColor: colors[i],
                    fill: false,
                    tension: 0.2,
                    showLine: true,
                    data: results[i]
                }
            );
        }
    }
    scatterChart.update();
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
