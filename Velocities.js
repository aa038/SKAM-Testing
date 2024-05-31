// Observer Position - Azimuthal angle, polar angle
let alpha, beta;

// QSO Position - Angle with the observer y axis (counterclockwise), impact parameter
let gamma, R;

// Galaxy Properties - Overdensity factor, Concentration parameter, Max circular velocity
let overDensity, concentrationC, circVelocity;
let RVir;

// Halo Properties - eta
let etaH;

// Bipolar Wind Properties - Skirt Radius, opening angle, eta
let skirtRad, openingAngle, etaW;

// Disk Properties
let diskHeight, diskRadius;

// Planar Accretion Properties - Accretion Radius, Flare Angle, eta
let accretionRad, flareAngle, etaA;

// LOS variables 
let t, x, y, z, rho, r;

// Direction cosines
let sigx, sigy, sigz;

// Projection functions
let pz, pr, pPhi, pRho, pTheta;

// Halo - Stalling Outflow
let etaStall = 0.9, deltaEtaStall = 0.01, S, v_r, vHalo_outflow;

// Galaxy Disk Velocities
let vDisk, Hv = 7, vDiskLOS;

// Accretion Disk Velocities
let e, h, vAccRho, vAccPhi, rhoAcc1, rhoAcc2, a, vAccLOS;

// BiPolar Wind Velocities
let vWind, gammaWind, vWindLOS;

let myChart = null; 

// Function to convert an angle in degrees to radians
function deg2rad(x) {
    return x * Math.PI / 180;
}

document.addEventListener('DOMContentLoaded', function() {
    const sliders = document.querySelectorAll('input[type="range"], input[type="number"]');

    // This function will be called to process the slider values
    const processValues = () => {
        alpha = Number(document.getElementById('alphaSlider').value);
        beta = Number(document.getElementById('betaSlider').value);
        gamma = Number(document.getElementById('gammaSlider').value);
        R = Number(document.getElementById('rSlider').value);
        overDensity = Number(document.getElementById('overdensitySlider').value);
        concentrationC = Number(document.getElementById('concentrationSlider').value);
        circVelocity = Number(document.getElementById('velocitySlider').value);
        etaH = Number(document.getElementById('etaSlider').value);
        skirtRad = Number(document.getElementById('skirtRadiusSlider').value);
        openingAngle = Number(document.getElementById('openingAngleSlider').value);
        etaW = Number(document.getElementById('etaWSlider').value);
        diskRadius = Number(document.getElementById('diskRadiusSlider').value);
        diskHeight = Number(document.getElementById('diskHeightSlider').value);
        accretionRad = Number(document.getElementById('accretionRadiusSlider').value);
        flareAngle = Number(document.getElementById('flareAngleSlider').value);
        etaA = Number(document.getElementById('etaASlider').value);

        // Convert angles from degrees to radians
        alpha = deg2rad(alpha);
        beta = deg2rad(beta);
        gamma = deg2rad(gamma);
        openingAngle = deg2rad(openingAngle);

        // Calculate the virial radius of the galaxy in kpc
        calculateVirialRadius();

        // Calculate the radius of the halo
        calculateHaloRadius();

        // Define the LOS
        LOS();

        // Compute the direction cosines
        dirCosines();

        // Compute the projection functions
        projectionFunctions();

        // Compute the LOS velocity in the disk
        diskVelocity();

        // Compute the LOS velocity in the accretion disk
        accretionVelocity();

        // Compute the LOS velocity in the Bi-Polar Wind
        windVelocity();

        // Plot the data
        plotData();
    };

    // Call processValues once initially to handle the initial slider values
    processValues();

    // Add event listeners to each slider to process values on change
    sliders.forEach(slider => slider.addEventListener('input', processValues));
});

// Function to compute the virial radius
function calculateVirialRadius() {
    // Constants
    const criticalDensity = 1e-26;  // (in kg / m^3)
    const xi = 2.16258;             // (constant to convert scale radius to the radius of max v_{circ})
    const A_xi = 1.83519;
    const A_C = Math.log(1 + concentrationC) - concentrationC / (1 + concentrationC);
    const gravConstG = 6.67e-11;      // in SI Units

    circVelocity = circVelocity * 1e3;
    console.log(circVelocity)

    // Calculate R_vir
    RVir = Math.sqrt(3 / (4 * Math.PI * gravConstG) * (xi / concentrationC) / (overDensity * criticalDensity) * A_C / A_xi * circVelocity ** 2);

    // Convert to kpc
    RVir = RVir / (3.0857e19);
}

// Function to compute the radius of the halo
function calculateHaloRadius() {
    RHalo = RVir * etaH;
}

// equivalent of linspace on Python
function linspace(startValue, endValue, numPoints) {
    const arr = [];
    const step = (endValue - startValue) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}

// Functio to calculate the LOS components
function LOS() {
    // Define the LOS using the t parameter
    t = linspace(-RHalo, RHalo, 1000);
 
    // Define x(t), y(t), z(t)
    x = t.map(element => R * (Math.cos(gamma) * Math.cos(beta) * Math.sin(alpha) - Math.sin(gamma) * Math.sin(beta)) - element * Math.cos(beta) * Math.cos(alpha));
    y = t.map(element => R * Math.cos(gamma) * Math.cos(alpha) + element * Math.sin(alpha));
    z = t.map(element => R * (Math.cos(gamma) * Math.sin(beta) * Math.sin(alpha) + Math.sin(gamma) * Math.cos(beta)) - element * Math.sin(beta) * Math.cos(alpha));
    
    // Define r(t), rho(t)
    r = t.map(element => Math.sqrt(R**2 + element**2));
    rho = x.map((ele, index) => Math.sqrt(ele**2 + y[index]**2));
}

function dirCosines() {
    sigx = -Math.cos(beta) * Math.cos(alpha);
    sigy = Math.sin(alpha);
    sigz = -Math.sin(beta) * Math.cos(alpha);
}

function projectionFunctions() {
    pz = sigz;
    pr = x.map((ele, i) => sigx * (ele / r[i]) + sigy * (y[i] / r[i]) + sigz * (z[i] / r[i]));
    pPhi = x.map((ele, i) => sigy * (ele / rho[i]) - sigx * (y[i] / rho[i]));
    pRho = x.map((ele, i) => sigx * (ele / rho[i]) + sigy * (y[i] / rho[i]));
    pTheta = z.map((ele, i) => (ele / r[i]) * pRho[i] + sigz[i] * Math.sqrt(1 - ele / r[i]))

}

function stall() {
    return r.map(ele => (1 + Math.exp(-etaStall * RHalo / deltaEtaStall)) / (1 + Math.exp((ele - etaStall * RHalo) / deltaEtaStall)));

}

function stallingOutflow() {

    S = stall();
    v_r = circVelocity ** 0.5;

    vHalo_outflow = pr.map((ele, i) => v_r * ele * S[i]);
}

function diskVelocity() {

    vDisk = z.map(ele => circVelocity * Math.exp(-Math.abs(ele) / Hv));
    vDiskLOS = vDisk.map((ele, i) => ele * pPhi[i]);

}

function accretionVelocity() {
    // Defining rho1 and rho2
    rhoAcc1 = Number(accretionRad);
    rhoAcc2 = etaA * RHalo;

    // Define e and a
    a = 0.5 * (rhoAcc1 + rhoAcc2);
    e = (rhoAcc2 - rhoAcc1) / (2 * a);

    h = rhoAcc1 * circVelocity;

    // Phi component of the accretion velocity
    vAccPhi = rho.map(ele => h / ele);

    // Rho component of the accretion velocity
    vAccRho = rho.map(ele => circVelocity / (1 + e) * Math.sqrt(e**2 - (1 - (e + 1) * rhoAcc1 / ele)**2));

    vAccLOS = vAccPhi.map((ele, i) => vAccRho[i] * pRho[i] + ele * pPhi[i]);

}


function windVelocity()
{
    skirtRad = Number(skirtRad);

    gammaWind = z.map((ele, i) => Math.abs(ele) * rho[i] * Math.tan(openingAngle)**2 / (skirtRad**2 + ele**2 * Math.tan(openingAngle)**2));

    vWind = circVelocity**0.8;

    vWindLOS = gammaWind.map((ele, i) => vWind * (ele * pRho[i] + Math.sign(z[i]) * pz) / (Math.sqrt(1 + ele**2)));   
}

function plotData() {

    const trace1 = {
        x: t,
        y: vDiskLOS,
        type: "scatter",
        mode: "lines+marker",
        marker: {color: "red"},
        name: "Disk"

    }

    const trace2 = {
        x: t,
        y: vAccLOS,
        type: "scatter",
        mode: "lines+marker",
        marker: {color: "blue"},
        name: "Accretion"

    }

    const trace3 = {
        x: t,
        y: vWindLOS,
        type: "scatter",
        mode: "lines+marker",
        marker: {color: "orange"},
        name: "Wind"

    }

    const data = [trace1, trace2, trace3];

    const layout = {
        xaxis: {
            title: "t",
            showgrid: "false",
            zeroline: "false"
        },
        yaxis: {
            title: "LOS Velocity (m/s)",
            showgrid: "false",
            zeroline: "false",
            range: [-circVelocity, circVelocity]
        }
    }

    Plotly.newPlot('plotly-div', data, layout);

}