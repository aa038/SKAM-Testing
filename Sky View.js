/// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);  // (FOV, Aspect Ratio, Near clipping plane, Far clipping plane)

// Initialising the renderer
const renderer = new THREE.WebGLRenderer();

// Setting up the renderer size
const sceneContainer = document.getElementById('scene-container');
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
//renderer.setClearColor(0x000000); // Set background color to black
sceneContainer.appendChild(renderer.domElement);

// Assuming your camera is already created and positioned
camera.position.set(25, 0, 0); // Move the camera so it's looking straight along the x axis
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Make the camera look at the center of the scene


/*************************   ROTATION MATRIX   *************************/
// Function to convert an angle in degrees to radians
function deg2rad(x) {
    return x * Math.PI / 180;
}

let rotMatrix = new THREE.Matrix3();
let rotMatrix4 = new THREE.Matrix4();

function rotationMatrix(){
    let alpha = Number(document.getElementById('alphaSlider').value);
    let beta = Number(document.getElementById('betaSlider').value);

    alpha = deg2rad(alpha);
    beta = deg2rad(beta);

    
    rotMatrix.set(
    Math.cos(beta) * Math.cos(alpha), -Math.sin(alpha), Math.sin(beta) * Math.cos(alpha),
    Math.cos(beta) * Math.sin(alpha),  Math.cos(alpha), Math.sin(beta) * Math.sin(alpha),
    -Math.sin(beta)                 ,                0, Math.cos(beta)
    );

    rotMatrix4.set(
    rotMatrix.elements[0], rotMatrix.elements[1], rotMatrix.elements[2], 0,
    rotMatrix.elements[3], rotMatrix.elements[4], rotMatrix.elements[5], 0,
    rotMatrix.elements[6], rotMatrix.elements[7], rotMatrix.elements[8], 0,
    0, 0, 0, 1
    );
}

/***********************************************************************/

/*************************   BACKGROUND QSO  *************************/
// Defining the background QSO
const QSOGeometry = new THREE.SphereGeometry(0.3, 32, 32); // Adjust size as needed
const QSOMaterial = new THREE.MeshPhongMaterial({
    color: "#0027ff",
    emissive: "#ffffff",
    emissiveIntensity: 80,
    depthTest: false,
    depthWrite: false
});
const QSO = new THREE.Mesh(QSOGeometry, QSOMaterial);
const QSOx = 0
QSO.position.set(QSOx, 0, 0); // Adjust coordinates as needed


// Adding a glow onto the QSO
const textureLoader = new THREE.TextureLoader();
const glowTexture = textureLoader.load('QSO Glow.png'); // Make sure to provide the correct path

const spriteMaterial = new THREE.SpriteMaterial({ 
    map: glowTexture,
    color: '#ffffff', // This color can be adjusted to fit your scene
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false, // Disable depth test
    depthWrite: false // Disable depth write
});
const haloSprite = new THREE.Sprite(spriteMaterial);

haloSprite.scale.set(6, 6, 1); // Adjust scale based on the size of your QSO and desired halo effect
QSO.add(haloSprite); // Adding the sprite as a child of the QSO mesh
scene.add(QSO);

function updateQSOPosition() {
    const gamma = THREE.MathUtils.degToRad(Number(document.getElementById('gammaInput').value));
    const R = Number(document.getElementById('rSlider').value);

    // Calculate new coordinates
    const x = QSOx; // Given in the requirement
    const y = R * Math.cos(gamma); // Rcos(gamma)
    const z = R * Math.sin(gamma); // Rsin(gamma)

    // Create a vector for the new position relative to the primary frame
    let newPosition = new THREE.Vector3(x, y/10, z/10);

    // Update QSO position
    QSO.position.copy(newPosition);
}

document.getElementById('gammaSlider').addEventListener('input', function() {
    document.getElementById('gammaInput').value = this.value;
    updateQSOPosition();
});

document.getElementById('gammaInput').addEventListener('input', function() {
    document.getElementById('gammaSlider').value = this.value;
    updateQSOPosition();
});

document.getElementById('rSlider').addEventListener('input', function() {
    document.getElementById('rInput').value = this.value;
    updateQSOPosition();
});

document.getElementById('rInput').addEventListener('input', function() {
    document.getElementById('rSlider').value = this.value;
    updateQSOPosition();
});

updateQSOPosition();

/********************************************************************/


/***********************   GALAXY PARAMETERS   **********************/
let R_vir, galaxyHaloRadius;

// Building the galaxy
function calculateGalaxyParameters() {

    // Fetch values from inputs
    const overdensity = Number(document.getElementById('overdensitySlider').value);
    const concentrationC = Number(document.getElementById('concentrationSlider').value);
    const circVelocity = Number(document.getElementById('velocitySlider').value) * 1e3;
    const etaH = Number(document.getElementById('etaSlider').value);

    // Constants
    const criticalDensity = 1e-26;  // (in kg / m^3)
    const xi = 2.16258;             // (constant to convert scale radius to the radius of max v_{circ})
    const A_xi = 1.83519;
    const A_C = Math.log(1 + concentrationC) - concentrationC / (1 + concentrationC);
    const gravConstG = 6.67e-11;      // in SI Units

    // Calculate R_vir and Galaxy Halo Radius
    R_vir = Math.sqrt(3 / (4 * Math.PI * gravConstG) * (xi / concentrationC) / (overdensity * criticalDensity) * A_C / A_xi * circVelocity ** 2);
    R_vir = R_vir / (10 * (3.0857e19));  // Adjusting the scale so the plot does not get huge, and converting to kpc
    galaxyHaloRadius = R_vir * etaH;

    console.log(galaxyHaloRadius)

    return galaxyHaloRadius;
}

calculateGalaxyParameters()
/********************************************************************/

/***********************   SETTING UP THE HALO   **********************/
let halo;

function updateHaloGeometry() {
    galaxyHaloRadius = calculateGalaxyParameters(); // Get the calculated radius
    console.log('Galaxy Halo Radius:', galaxyHaloRadius)

    // If creating the halo for the first time or updating
    const haloGeometry = new THREE.SphereGeometry(galaxyHaloRadius, 32, 32);
    const haloMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        emissive: 0xffffff,
        emissiveIntensity: 2,
        depthWrite: false,
    });
    if(halo) {
        scene.remove(halo); // Remove the old halo from the scene if it exists
    }
    halo = new THREE.Mesh(haloGeometry, haloMaterial);

    // Load and add the glow texture
    const haloTextureLoader = new THREE.TextureLoader();
    haloTextureLoader.load('Halo Glow.png', function(texture) {
        const haloGlowMaterial = new THREE.SpriteMaterial({
            map: texture,
            color: 0xffffff, // Optional: tint the glow with a color
            transparent: true,
            blending: THREE.AdditiveBlending, // Creates a glow effect by adding colors
        });

        const haloGlowSprite = new THREE.Sprite(haloGlowMaterial);
        haloGlowSprite.scale.set(6*galaxyHaloRadius, 6*galaxyHaloRadius, 1); // Adjust the scale to cover your object adequately
        halo.add(haloGlowSprite); // This now works because 'halo' is defined

        // Position the glowSprite at the same location as your object
        haloGlowSprite.position.set(0, 0, 0); // halo's position is already (0, 0, 0) by default
    });

    // Add the halo to the scene
    scene.add(halo);

    const isHaloHidden = document.getElementById('hideHaloCheckbox').checked;
    if (isHaloHidden) {
        halo.visible = false; // Keep the halo hidden if the checkbox is checked
    }
}

// Halo Parameters
document.getElementById('overdensitySlider').addEventListener('input', function() {
    document.getElementById('overdensityInput').value = this.value;
    updateHaloGeometry(); // Update the halo geometry based on the new parameters
});

document.getElementById('overdensityInput').addEventListener('input', function() {
    document.getElementById('overdensitySlider').value = this.value;
    updateHaloGeometry(); // Update the halo geometry based on the new parameters
});

document.getElementById('concentrationSlider').addEventListener('input', function() {
    document.getElementById('concentrationInput').value = this.value;
    updateHaloGeometry();
});

document.getElementById('concentrationInput').addEventListener('input', function() {
    document.getElementById('concentrationSlider').value = this.value;
    updateHaloGeometry();
});

document.getElementById('velocitySlider').addEventListener('input', function() {
    document.getElementById('velocityInput').value = this.value;
    updateHaloGeometry();
});

document.getElementById('velocityInput').addEventListener('input', function() {
    document.getElementById('velocitySlider').value = this.value;
    updateHaloGeometry();
});

document.getElementById('etaSlider').addEventListener('input', function() {
    document.getElementById('etaInput').value = this.value;
    updateHaloGeometry();
});

document.getElementById('etaInput').addEventListener('input', function() {
    document.getElementById('etaSlider').value = this.value;
    updateHaloGeometry();
});

// Event listener for the "Hide Halo" checkbox
document.getElementById('hideHaloCheckbox').addEventListener('change', function() {
    if(halo) { // Ensure the halo exists before trying to change its visibility
        halo.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});

// Call updateHaloGeometry at an appropriate time, for example, after setting up the scene
updateHaloGeometry();
/**********************************************************************/

/***********************   SETTING UP THE WIND   **********************/
let hyperboloidMesh; // Declare this globally to access it for updates

function updateWindGeometry() {
    // Fetch values from the inputs
    const skirtRadius = parseFloat(document.getElementById('skirtRadiusInput').value);
    const openingAngleDegrees = parseFloat(document.getElementById('openingAngleInput').value);
    const etaW = parseFloat(document.getElementById('etaWInput').value);

    const openingAngleRadians = THREE.MathUtils.degToRad(openingAngleDegrees);
    const tanOpeningAngle = Math.tan(openingAngleRadians);

    // Define the parametric equation for the hyperboloid
    const hyperboloidFunction = (u, v, target) => {
        const phi = u * 2 * Math.PI; // Map u to [0, 2PI] for full rotation
        let z = (2 * v - 1) * R_vir; // Map v to [-etaW * R_vir, etaW * R_vir]

        // Ensure z does not exceed its bounds (should technically not be necessary with correct v mapping)
        z = Math.max(Math.min(z, etaW * R_vir), -etaW * R_vir);

        const radius = Math.sqrt(skirtRadius ** 2 / (100) + z ** 2 * tanOpeningAngle ** 2);
        const x = radius * Math.cos(phi);
        const y = radius * Math.sin(phi);

        let vector = new THREE.Vector3(x, y, z);

        rotationMatrix();
        vector.applyMatrix3(rotMatrix);
    
        target.set(vector.x, vector.y, vector.z);
    };

    // Fill the wind hyperboloid with gas particles
    createGasParticles();

    // Create the geometry
    const segmentsU = 20; // Increase for better resolution
    const segmentsV = 20; // Increase for better resolution
    const hyperboloidGeometry = new THREE.ParametricGeometry(hyperboloidFunction, segmentsU, segmentsV);

    // Create material
    const hyperboloidMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

    // Remove the previous mesh from the scene if it exists
    if (hyperboloidMesh) scene.remove(hyperboloidMesh);

    // Create mesh
    hyperboloidMesh = new THREE.Mesh(hyperboloidGeometry, hyperboloidMaterial);
    scene.add(hyperboloidMesh);

    const isWindHidden = document.getElementById('hideWindCheckbox').checked;
    if (isWindHidden) {
        hyperboloidMesh.visible = false; // Keep the halo hidden if the checkbox is checked
    }
}


// Function to fill the wind hyperboloid with particles

let particleSystem; // Declare this globally

function createGasParticles() {
    // Fetch values from the inputs
    const skirtRadius = parseFloat(document.getElementById('skirtRadiusInput').value);
    const openingAngleDegrees = parseFloat(document.getElementById('openingAngleInput').value);
    const etaW = parseFloat(document.getElementById('etaWInput').value);    

    const openingAngleRadians = THREE.MathUtils.degToRad(openingAngleDegrees);

    const particleCount = 1000; // Number of particles, adjust based on desired density
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff0000, // Red, adjust as needed
        size: 0.2, // Size of each particle, adjust as needed
        transparent: true,
        sizeAttenuation: false,
        opacity: 0.5, // Transparency of particles, adjust as needed
    });

    for (let i = 0; i < particleCount; i++) {
        // Randomly generate phi and z within the hyperboloid's bounds
        const phi = Math.random() * 2 * Math.PI;
        const z = (Math.random() * 2 - 1) * etaW * R_vir; // Adjust to match hyperboloid's height
        const radius = Math.sqrt(skirtRadius ** 2 / (100) + z ** 2 * Math.tan(openingAngleRadians) ** 2);
        
        const x = Math.random() * radius * Math.cos(phi);
        const y = Math.random() * radius * Math.sin(phi);

        const vector = new THREE.Vector3(x, y, z);
        vector.applyMatrix3(rotMatrix);
    
        positions.push(vector.x, vector.y, vector.z);

    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (particleSystem) scene.remove(particleSystem); // Remove old system
    particleSystem = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particleSystem);

    const isWindParticleHidden = document.getElementById('hideWindParticlesCheckbox').checked;
    if (isWindParticleHidden) {
        particleSystem.visible = false; // Keep the halo hidden if the checkbox is checked
    }
}

// Debounce function to add a lag between user input and geometry updates
// Improves performance

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const debouncedUpdateWindGeometry = debounce(updateWindGeometry, 0.1);

// Bi-Polar wind parameters
document.getElementById('skirtRadiusSlider').addEventListener('input', function() {
    document.getElementById('skirtRadiusInput').value = this.value;
    debouncedUpdateWindGeometry(); // Call the debounced function
});

document.getElementById('skirtRadiusInput').addEventListener('input', function() {
    document.getElementById('skirtRadiusSlider').value = this.value;
    debouncedUpdateWindGeometry(); // Call the debounced function
});

document.getElementById('openingAngleSlider').addEventListener('input', function() {
    document.getElementById('openingAngleInput').value = this.value;
    debouncedUpdateWindGeometry(); // Call the debounced function
});

document.getElementById('openingAngleInput').addEventListener('input', function() {
    document.getElementById('openingAngleSlider').value = this.value;
    debouncedUpdateWindGeometry(); // Call the debounced function
});

document.getElementById('etaWSlider').addEventListener('input', function() {
    document.getElementById('etaWInput').value = this.value;
    debouncedUpdateWindGeometry(); // Call the debounced function
});

document.getElementById('etaWInput').addEventListener('input', function() {
    document.getElementById('etaWSlider').value = this.value;
    debouncedUpdateWindGeometry(); // Call the debounced function
});

// Event listener for the "Hide Wind" checkbox
document.getElementById('hideWindCheckbox').addEventListener('change', function() {
    if(hyperboloidMesh) { // Ensure the halo exists before trying to change its visibility
        hyperboloidMesh.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});

// Event listener for the "Hide Wind Particles" checkbox
document.getElementById('hideWindParticlesCheckbox').addEventListener('change', function() {
    if(particleSystem) { // Ensure the halo exists before trying to change its visibility
        particleSystem.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});

debouncedUpdateWindGeometry();
/**********************************************************************/

/***********************   SETTING UP THE DISK   **********************/

// Assuming scene is already defined
let cylinderMesh; // Global variable for the cylinder mesh
let starsGroup; // Global variable for stars

function updateCylinderGeometry() {
    // Fetch values from the input elements
    const diskRadius = parseFloat(document.getElementById('diskRadiusInput').value) / 10;
    const diskHeight = parseFloat(document.getElementById('diskHeightInput').value) / 10;

    // Remove existing cylinder mesh and particles
    if (cylinderMesh) scene.remove(cylinderMesh);
    // Remove existing stars group
    if (starsGroup) {
        scene.remove(starsGroup);
        starsGroup = null; // Clear the reference
    }

    // Cylinder material with adjusted emissive properties
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    // Create the cylinder mesh
    const geometry = new THREE.CylinderGeometry(diskRadius, diskRadius, diskHeight, 30);
    cylinderMesh = new THREE.Mesh(geometry, material);
    cylinderMesh.rotation.x = Math.PI / 2; // Aligning along the z-axis

    // Fetch rotation angles from the sliders (assume sliders are already set up in the HTML)
    let alpha = parseFloat(document.getElementById('alphaInput').value); // Rotation around z-axis
    let beta = parseFloat(document.getElementById('betaInput').value);  // Rotation around y-axis

    alpha = deg2rad(alpha);
    beta = deg2rad(beta);

    // Apply rotations using Euler angles
    cylinderMesh.rotation.set(Math.PI / 2, beta, alpha, 'ZYX'); // Adjust the order as needed

    // Add the cylinder mesh to the scene
    scene.add(cylinderMesh);

    const isDiskHidden = document.getElementById('hideDiskCheckbox').checked;
    if (isDiskHidden) {
        cylinderMesh.visible = false; // Keep the halo hidden if the checkbox is checked
    }

    // Add particles to simulate stars
    addStarWithGlow(diskRadius, diskHeight);
}

function addStarWithGlow(diskRadius, diskHeight) {
    // Initialize or clear the stars group
    if (!starsGroup) {
        starsGroup = new THREE.Group();
    } else {
        while (starsGroup.children.length) {
            starsGroup.remove(starsGroup.children[0]);
        }
    }

    const starCount = 500; // Adjust based on performance and visual effect

    // Load the glow texture outside the loop to avoid reloading it for each star
    const textureLoader = new THREE.TextureLoader();
    const glowTexture = textureLoader.load('QSO Glow.png'); // Make sure this path is correct

    for (let i = 0; i < starCount; i++) {
        const sizeBias = Math.random();
        const starSize = 0.01 + (0.05 - 0.01) * Math.cbrt(1 - sizeBias);
        const starColor = getStarColorEnhanced(sizeBias);

        // Create the star as a Mesh
        const starGeometry = new THREE.SphereGeometry(starSize, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({ color: starColor });
        const starMesh = new THREE.Mesh(starGeometry, starMaterial);

        // Adjusted random positions within the cylinder for density gradient
        const theta = Math.random() * 2 * Math.PI;
        // Skew radial distribution towards the center for more central density
        const r = diskRadius * Math.pow(Math.random(), 2);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = (Math.random() * diskHeight - diskHeight / 2) * (r / diskRadius); // Optionally, make height distribution follow radial density
        
        const vector = new THREE.Vector3(x, y, z);
        rotationMatrix();
        vector.applyMatrix3(rotMatrix);

        starMesh.position.set(vector.x, vector.y, vector.z);

        starsGroup.add(starMesh);

        // Create a sprite for the glow effect
        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: starColor, // Tint the glow to match the star color
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false, // Disable depth test
            depthWrite: false // Disable depth write
        });
        const glowSprite = new THREE.Sprite(glowMaterial);

        // Scale the glow effect based on the star size
        const glowScale = starSize * 10; // Adjust this value to get the desired glow size
        glowSprite.scale.set(glowScale, glowScale, 1);

        // Position the glow sprite at the center of the star
        glowSprite.position.copy(starMesh.position);

        starsGroup.add(glowSprite);
    }

    scene.add(starsGroup);

    const isStarHidden = document.getElementById('hideStarsCheckbox').checked;
    if (isStarHidden) {
        starsGroup.visible = false; // Keep the halo hidden if the checkbox is checked
    }
}

function getStarColorEnhanced(sizeBias) {
    // Enhanced color selection for more variety in blue and white, with some orange and red
    if (sizeBias > 0.95) return 0xffffff; // White
    else if (sizeBias > 0.75) return 0xd4f1f9; // Light blue
    else if (sizeBias > 0.60) return 0xadd8e6; // Slightly deeper blue
    else if (sizeBias > 0.50) return 0x87ceeb; // Sky blue
    else if (sizeBias > 0.40) return 0x4682b4; // Steel blue
    else if (sizeBias > 0.30) return 0xffd27d; // Orange
    else return 0xff3333; // Red
}

// Debounce function to add a lag between user input and geometry updates
// Improves performance

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const debouncedUpdateCylinderGeometry = debounce(updateCylinderGeometry, 0.1);

// Event listener for the disk radius slider
document.getElementById('diskRadiusSlider').addEventListener('input', function() {
    document.getElementById('diskRadiusInput').value = this.value;
    debouncedUpdateCylinderGeometry(); // Call the debounced function
});

// Event listener for the disk radius input box
document.getElementById('diskRadiusInput').addEventListener('input', function() {
    document.getElementById('diskRadiusSlider').value = this.value;
    debouncedUpdateCylinderGeometry(); // Call the debounced function
});

// Event listener for the disk height slider
document.getElementById('diskHeightSlider').addEventListener('input', function() {
    document.getElementById('diskHeightInput').value = this.value;
    debouncedUpdateCylinderGeometry(); // Call the debounced function
});

// Event listener for the disk height input box
document.getElementById('diskHeightInput').addEventListener('input', function() {
    document.getElementById('diskHeightSlider').value = this.value;
    debouncedUpdateCylinderGeometry(); // Call the debounced function
});

debouncedUpdateCylinderGeometry();

// Event listener for the "Hide Wind" checkbox
document.getElementById('hideDiskCheckbox').addEventListener('change', function() {
    if(cylinderMesh) { // Ensure the halo exists before trying to change its visibility
        cylinderMesh.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});

// Event listener for the "Hide Wind Particles" checkbox
document.getElementById('hideStarsCheckbox').addEventListener('change', function() {
    if(starsGroup) { // Ensure the halo exists before trying to change its visibility
        starsGroup.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});
/**********************************************************************/

/***********************   SETTING UP ACCRETION   **********************/
// ACCRETION DISK
let accretionHyperboloidMesh; // Declare this globally to access it for updates

// Function to update the accretion disk geometry based on user input
function updateAccretionDiscGeometry() {
    // Fetch values from the inputs
    const accretionRadius = parseFloat(document.getElementById('accretionRadiusInput').value);
    const flareAngleDegrees = parseFloat(document.getElementById('flareAngleInput').value);
    const etaA = parseFloat(document.getElementById('etaAInput').value);

    const flareAngleRadians = THREE.MathUtils.degToRad(flareAngleDegrees);
    const cotFlareAngle = 1 / Math.tan(flareAngleRadians);


    // Fill the accretion disk with particles
    createAccretionDiscParticles();
}


// Function to get a random number between min and max
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// Function to fill the accretion disk with gas particles
let accretionParticleSystem; // Declare this globally

function createAccretionDiscParticles() {
    // Fetch values from the inputs
    const accretionRadius = parseFloat(document.getElementById('accretionRadiusInput').value);
    const flareAngleDegrees = parseFloat(document.getElementById('flareAngleInput').value);
    const etaA = parseFloat(document.getElementById('etaAInput').value);   

    const flareAngleRadians = THREE.MathUtils.degToRad(flareAngleDegrees);

    const particleCount = 1000000; // Number of particles, adjust based on desired density
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x0000ff, // Light green, adjust as needed
        size: 0.2, // Size of each particle, adjust as needed
        transparent: true,
        sizeAttenuation: false,
        opacity: 0.5, // Transparency of particles, adjust as needed
    });

    for (let i = 0; i < particleCount; i++) {
        // Randomly generate phi and z within the hyperboloid's bounds
        const phi = Math.random() * 2 * Math.PI;
        const z = (Math.random() * 2 - 1) * R_vir; // Adjust to match hyperboloid's height
        const radius = Math.sqrt(accretionRadius ** 2 / (100) + z ** 2 * (1/Math.tan(flareAngleRadians)) ** 2);
        
        const x = getRandomArbitrary(1, galaxyHaloRadius) * radius * Math.cos(phi);
        const y = getRandomArbitrary(1, galaxyHaloRadius) * radius * Math.sin(phi);

        if (x**2 + y**2 + z**2 < (etaA*galaxyHaloRadius)**2) {
            const vector = new THREE.Vector3(x, y, z);
            rotationMatrix();
            vector.applyMatrix3(rotMatrix);

            positions.push(vector.x, vector.y, vector.z);
        }

    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (accretionParticleSystem) scene.remove(accretionParticleSystem); // Remove old system
    accretionParticleSystem = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(accretionParticleSystem);

    const isAccretionParticleHidden = document.getElementById('hideAccretionParticlesCheckbox').checked;
    if (isAccretionParticleHidden) {
        accretionParticleSystem.visible = false; // Keep the halo hidden if the checkbox is checked
    }
}

// Debounce function to add a lag between user input and geometry updates
// Improves performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const debouncedAccretionDiscGeometry = debounce(updateAccretionDiscGeometry, 2);

// Accretion disk parameters
document.getElementById('accretionRadiusSlider').addEventListener('input', function() {
    document.getElementById('accretionRadiusInput').value = this.value;
    debouncedAccretionDiscGeometry(); // Call the debounced function
});

document.getElementById('accretionRadiusInput').addEventListener('input', function() {
    document.getElementById('accretionRadiusSlider').value = this.value;
    debouncedAccretionDiscGeometry(); // Call the debounced function
});

document.getElementById('flareAngleSlider').addEventListener('input', function() {
    document.getElementById('flareAngleInput').value = this.value;
    debouncedAccretionDiscGeometry(); // Call the debounced function
});

document.getElementById('flareAngleInput').addEventListener('input', function() {
    document.getElementById('flareAngleSlider').value = this.value;
    debouncedAccretionDiscGeometry(); // Call the debounced function
});

document.getElementById('etaASlider').addEventListener('input', function() {
    document.getElementById('etaAInput').value = this.value;
    debouncedAccretionDiscGeometry(); // Call the debounced function
});

document.getElementById('etaAInput').addEventListener('input', function() {
    document.getElementById('etaASlider').value = this.value;
    debouncedAccretionDiscGeometry(); // Call the debounced function
});

// Event listener for the "Hide Wind" checkbox
document.getElementById('hideAccretionCheckbox').addEventListener('change', function() {
    if(accretionHyperboloidMesh) { // Ensure the halo exists before trying to change its visibility
        accretionHyperboloidMesh.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});

// Event listener for the "Hide Wind Particles" checkbox
document.getElementById('hideAccretionParticlesCheckbox').addEventListener('change', function() {
    if(accretionParticleSystem) { // Ensure the halo exists before trying to change its visibility
        accretionParticleSystem.visible = !this.checked; // Toggle visibility based on the checkbox
    }
});

debouncedAccretionDiscGeometry();

/***********************************************************************/

document.getElementById('alphaSlider').addEventListener('input', function() {
    document.getElementById('alphaInput').value = this.value;
    debouncedUpdateWindGeometry();
    debouncedUpdateCylinderGeometry();
    debouncedAccretionDiscGeometry()
});

document.getElementById('alphaInput').addEventListener('input', function() {
    document.getElementById('alphaSlider').value = this.value;
    debouncedUpdateWindGeometry();
    debouncedUpdateCylinderGeometry();
    debouncedAccretionDiscGeometry()
});

document.getElementById('betaSlider').addEventListener('input', function() {
    document.getElementById('betaInput').value = this.value;
    debouncedUpdateWindGeometry();
    debouncedUpdateCylinderGeometry();
    debouncedAccretionDiscGeometry()
});

document.getElementById('betaInput').addEventListener('input', function() {
    document.getElementById('betaSlider').value = this.value;
    debouncedUpdateWindGeometry();
    debouncedUpdateCylinderGeometry();
    debouncedAccretionDiscGeometry()
});



// Animation loop
function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}

animate();