let paletteGenerated = false;

let typescaleData = {
    size: {},
    "line-height": {}
};

const colorRolesTemplate = {
    "Primary": "Primary 40",
    "On Primary": "Primary 100",
    "Primary Container": "Primary 90",
    "On Primary Container": "Primary 10",
    "Primary Fixed": "Primary 90",
    "On Primary Fixed": "Primary 10",
    "Primary Fixed Dim": "Primary 80",
    "On Primary Fixed Variant": "Primary 30",
    
    "Secondary": "Secondary 40",
    "On Secondary": "Secondary 100",
    "Secondary Container": "Secondary 90",
    "On Secondary Container": "Secondary 10",
    "Secondary Fixed": "Secondary 90",
    "On Secondary Fixed": "Secondary 10",
    "Secondary Fixed Dim": "Secondary 80",
    "On Secondary Fixed Variant": "Secondary 30",
    
    "Tertiary": "Tertiary 40",
    "On Tertiary": "Tertiary 100",
    "Tertiary Container": "Tertiary 90",
    "On Tertiary Container": "Tertiary 10",
    "Tertiary Fixed": "Tertiary 90",
    "On Tertiary Fixed": "Tertiary 10",
    "Tertiary Fixed Dim": "Tertiary 80",
    "On Tertiary Fixed Variant": "Tertiary 30",
    
    "Error": "Error 40",
    "On Error": "Error 100",
    "Error Container": "Error 90",
    "On Error Container": "Error 10",
    
    "Background": "Neutral 98",
    "On Background": "Neutral 10",
    "Surface": "Neutral 98",
    "On Surface": "Neutral 10",
    "Surface Variant": "Neutral Variant 90",
    "On Surface Variant": "Neutral Variant 30",
    
    "Surface Container Highest": "Neutral 90",
    "Surface Container High": "Neutral 92",
    "Surface Container": "Neutral 94",
    "Surface Container Low": "Neutral 96",
    "Surface Container Lowest": "Neutral 100",
    
    "Surface Bright": "Neutral 98",
    "Surface Dim": "Neutral 87",
    
    "Outline": "Neutral Variant 50",
    "Outline Variant": "Neutral Variant 80",
    "Shadow": "Primary 0 45%",
    "Scrim": "Neutral 0 32%",
    
    "Inverse Surface": "Neutral 20",
    "Inverse On Surface": "Neutral 95",
    "Inverse Primary": "Primary 80",
    "Inverse Secondary": "Secondary 80",
    "Inverse Tertiary": "Tertiary 80",
    "Inverse Error": "Error 80",

    "state-layer/Enabled": "Primary 40 0%",
    "state-layer/Disabled": "Neutral 10 12%",
    "state-layer/Hovered": "Primary 40 8%",
    "state-layer/Focused": "Primary 40 10%",
    "state-layer/Pressed": "Primary 40 10%",
    "state-layer/Dragged": "Primary 40 10%"
};

// Include the defaultScaleData constant
const defaultScaleData = {
    "scaffold": {
        "margin": { "$type": "number", "$value": 16 },
        "gap": { "$type": "number", "$value": 24 },
        "no-padding": { "$type": "number", "$value": 0 }
    },
    "component": {
        "margin": { "$type": "number", "$value": 16 },
        "gap": { "$type": "number", "$value": 12 },
        "padding": { "$type": "number", "$value": 16 },
        "grid": { "$type": "number", "$value": 24 }
    },
    "icon-small": { "$type": "number", "$value": 14 },
    "icon-big": { "$type": "number", "$value": 24 },
    "calendar": {
        "padding": { "$type": "number", "$value": 93 },
        "gap": { "$type": "number", "$value": 55 }
    },
    "corner": {
        "None": { "$type": "number", "$value": 0 },
        "Extra-small": { "$type": "number", "$value": 4 },
        "Small": { "$type": "number", "$value": 8 },
        "Medium": { "$type": "number", "$value": 12 },
        "Large": { "$type": "number", "$value": 16 },
        "Extra-large": { "$type": "number", "$value": 28 },
        "Full": { "$type": "number", "$value": 999 }
    },
    "element": {
        "margin": { "$type": "number", "$value": 16 },
        "padding": { "$type": "number", "$value": 16 },
        "grid": { "$type": "number", "$value": 24 },
        "gap": { "$type": "number", "$value": 20 }
    },
    "atom": {
        "margin": { "$type": "number", "$value": 16 },
        "padding": { "$type": "number", "$value": 16 },
        "grid": { "$type": "number", "$value": 8 },
        "gap": { "$type": "number", "$value": 4 }
    },
    "card": {
        "margin": { "$type": "number", "$value": 32 },
        "padding": { "$type": "number", "$value": 16 }
    }
};

// Constants and default values
const defaultColors = {
    "Primary": "#6750A4",
    "Secondary": "#4A4459",
    "Tertiary": "#7E5260",
    "Error": "#A53A36",
    "Neutral": "#606062",
    "Neutral Variant": "#6D786E"
};

const lastColors = {};

const steps = [100, 99, 98, 96, 95, 94, 92, 90, 87, 80, 70, 60, 50, 40, 30, 20, 10, 0];

// Updated font lists
const displayFonts = [
    'Playfair Display', 'Abril Fatface', 'Lobster', 'Dancing Script', 'Great Vibes',
    'Pacifico', 'Fredoka One', 'Amatic SC', 'Courgette', 'Satisfy'
    ];

const sansSerifFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
    'Raleway', 'PT Sans', 'Poppins', 'Noto Sans', 'Ubuntu', 'Mukta',
    'Nunito', 'Work Sans', 'Quicksand', 'Inter'
    ];


const fontWeights = [
    { name: 'Thin', value: '100' },
    { name: 'Extra Light', value: '200' },
    { name: 'Light', value: '300' },
    { name: 'Regular', value: '400' },
    { name: 'Medium', value: '500' },
    { name: 'Semi Bold', value: '600' },
    { name: 'Bold', value: '700' },
    { name: 'Extra Bold', value: '800' },
    { name: 'Black', value: '900' }
    ];


// Color conversion functions
function hexToRgb(hex) {
    return hex.replace(/^#/, '').match(/.{2}/g).map(val => parseInt(val, 16));
}

function rgbToHex([r, g, b]) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if(max === min){
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        h = {
            [r]: (g - b) / d + (g < b ? 6 : 0),
            [g]: (b - r) / d + 2,
            [b]: (r - g) / d + 4
        }[max];
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb([h, s, l]) {
    h /= 360; s /= 100; l /= 100;
    if(s === 0){
        const val = l * 255;
        return [val, val, val];
    }
    const hue2rgb = (p, q, t) => {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3) * 255;
    const g = hue2rgb(p, q, h) * 255;
    const b = hue2rgb(p, q, h - 1/3) * 255;
    return [Math.round(r), Math.round(g), Math.round(b)];
}

// WRONG Function to create the palette
// function createPalette(colors) {
//     const jsonOutput = {
//         "palettes": {},
//         "scale": defaultScaleData,
//         "typescale": {
//             "size": {},
//             "line-height": {},
//             "tracking": {}
//         },
//         "typeface": {
//             "Display": { "$type": "text", "$value": "Nunito Sans" },
//             "Text": { "$type": "text", "$value": "Nunito Sans" }
//         }
//     };

//     colors.forEach(({ name, hex }) => {
//         const startRgb = hexToRgb(hex);
//         const startHsl = rgbToHsl(startRgb);

//         steps.forEach(step => {
//             const lightness = step;
//             const rgb = hslToRgb([startHsl[0], startHsl[1], lightness]);
//             const colorHex = rgbToHex(rgb);
//             jsonOutput["palettes"][`${name} ${step}`] = { "$type": "color", "$value": colorHex };
//         });

//         // Add additional color variations
//         [0, 5, 8, 10, 12, 38].forEach(opacity => {
//             jsonOutput["palettes"][`${name} ${steps[0]} ${opacity}%`] = { "$type": "color", "$value": hex + Math.round(opacity * 2.55).toString(16).padStart(2, '0') };
//         });
//     });

//     // Add color roles
//     Object.keys(colorRolesTemplate).forEach(role => {
//         const paletteReference = colorRolesTemplate[role];
//         jsonOutput[role] = { "$type": "color", "$value": `{palettes.${paletteReference}}` };
//     });

//     // Add typescale data
//     Object.keys(typescaleData.size).forEach(key => {
//         jsonOutput.typescale.size[key] = { "$type": "number", "$value": typescaleData.size[key] };
//         jsonOutput.typescale["line-height"][key] = { "$type": "number", "$value": typescaleData["line-height"][key] };
//         jsonOutput.typescale.tracking[key] = { "$type": "number", "$value": 0 }; // Default tracking value
//     });

//     // Add state layers
//     jsonOutput["state-layer"] = {
//         "Enabled": { "$type": "color", "$value": "{palettes.Primary 40 0%}" },
//         "Disabled": { "$type": "color", "$value": "{palettes.Neutral 10 12%}" },
//         "Hovered": { "$type": "color", "$value": "{palettes.Primary 40 8%}" },
//         "Focused": { "$type": "color", "$value": "{palettes.Primary 40 10%}" },
//         "Pressed": { "$type": "color", "$value": "{palettes.Primary 40 10%}" },
//         "Dragged": { "$type": "color", "$value": "{palettes.Primary 40 10%}" }
//     };

//     return jsonOutput;
// }

// Update the generatePalette function to use the new structure
// function generatePalette() {
//     const colors = [...document.querySelectorAll('.color-input-row')].map(row => ({
//         name: row.querySelector('input[type="text"]:first-child').value,
//         hex: row.querySelector('input[type="text"]:nth-child(2)').value
//     })).filter(c => c.name && /^#[0-9A-F]{6}$/i.test(c.hex));

//     if (colors.length) {
//         const jsonOutput = createPalette(colors);

//         // Include typography settings
//         jsonOutput.typography = {
//             baseFontSize: document.getElementById('baseFontSizeInput').value,
//             baseLineHeight: document.getElementById('baseLineHeightInput').value,
//             baseFontFamily: document.getElementById('baseFontSelector').value,
//             baseFontWeight: document.getElementById('baseFontWeightSelector').value,
//             headerFontFamily: document.getElementById('headerFontSelector').value,
//             headerFontWeight: document.getElementById('headerFontWeightSelector').value,
//             displayFontFamily: document.getElementById('displayFontSelector').value,
//             displayFontWeight: document.getElementById('displayFontWeightSelector').value
//         };

//         // Update JSON output
//         let jsonOutputElem = document.getElementById('jsonOutput');
//         if (!jsonOutputElem) {
//             jsonOutputElem = document.createElement('pre');
//             jsonOutputElem.id = 'jsonOutput';
//             jsonOutputElem.className = 'json-output';
//             jsonOutputElem.style.display = 'none';
//             document.body.appendChild(jsonOutputElem);
//         }
//         const fullJsonString = JSON.stringify(jsonOutput, null, 2);
//         jsonOutputElem.textContent = fullJsonString;
//         jsonOutputElem.dataset.fullJson = fullJsonString;
//     } else {
//         alert('Please enter all color names and valid hex codes');
//     }

//     paletteGenerated = true;
// }


function createPalette(colors) {
    const palette = document.getElementById('palette');
    palette.innerHTML = '';

    // Create header row with degrees
    const headerRow = document.createElement('div');
    headerRow.className = 'color-row header-row';

    const emptyCell = document.createElement('div');
    emptyCell.className = 'color-label';
    headerRow.appendChild(emptyCell);

    steps.forEach(step => {
        const degreeCell = document.createElement('div');
        degreeCell.className = 'color-degree';
        degreeCell.textContent = step;
        headerRow.appendChild(degreeCell);
    });

    palette.appendChild(headerRow);

    const jsonOutput = {
        "palettes": {}
    };

    colors.forEach(({ name, hex }) => {
        const startRgb = hexToRgb(hex);
        const startHsl = rgbToHsl(startRgb);

        const colorPalette = steps.map(step => {
            const lightness = step;
            const rgb = hslToRgb([startHsl[0], startHsl[1], lightness]);
            return rgbToHex(rgb);
        });

        // Create the visual palette rows
        const colorRow = document.createElement('div');
        colorRow.className = 'color-row';

        const label = document.createElement('div');
        label.className = 'color-label';
        label.textContent = name;
        colorRow.appendChild(label);

        colorPalette.forEach((colorHex, index) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = colorHex;
            colorBox.title = `${name} ${steps[index]}`;
            colorRow.appendChild(colorBox);
        });
        palette.appendChild(colorRow);

        // Add each calculated color to the palette in the JSON output
        colorPalette.forEach((colorHex, index) => {
            jsonOutput["palettes"][`${name} ${steps[index]}`] = { "$type": "color", "$value": colorHex };
        });
    });

    return jsonOutput;
}

function positionLegends() {
  const sample = document.querySelector('.sample');
  const legendItems = document.querySelectorAll('.typography-name');
  
  sample.querySelectorAll('*').forEach((element, index) => {
    if (index < legendItems.length) {
      const rect = element.getBoundingClientRect();
      const sampleRect = sample.getBoundingClientRect();
      legendItems[index].style.top = `${rect.top - sampleRect.top}px`;
  }
});
}

// Function to generate the palette
function generatePalette() {
    const colors = [...document.querySelectorAll('.color-input-row')].map(row => ({
        name: row.querySelector('input[type="text"]:first-child').value,
        hex: row.querySelector('input[type="text"]:nth-child(2)').value
    })).filter(c => c.name && /^#[0-9A-F]{6}$/i.test(c.hex));

    if (colors.length) {
        const jsonOutput = createPalette(colors);

        // Assign roles to reference colors from the palettes using the correct format
        Object.keys(colorRolesTemplate).forEach(role => {
            const paletteReference = colorRolesTemplate[role];
            jsonOutput[role] = { "$type": "color", "$value": `{palettes.${paletteReference}}` };
        });

        // Include typography settings
        jsonOutput['typography'] = {
            baseFontSize: document.getElementById('baseFontSizeInput').value,
            baseLineHeight: document.getElementById('baseLineHeightInput').value,
            baseFontFamily: document.getElementById('baseFontSelector').value,
            baseFontWeight: document.getElementById('baseFontWeightSelector').value,
            headerFontFamily: document.getElementById('headerFontSelector').value,
            headerFontWeight: document.getElementById('headerFontWeightSelector').value,
            displayFontFamily: document.getElementById('displayFontSelector').value,
            displayFontWeight: document.getElementById('displayFontWeightSelector').value
        };

        // Ensure JSON output element exists and update it
        let jsonOutputElem = document.getElementById('jsonOutput');
        if (!jsonOutputElem) {
            jsonOutputElem = document.createElement('pre');
            jsonOutputElem.id = 'jsonOutput';
            jsonOutputElem.className = 'json-output';
            jsonOutputElem.style.display = 'none';
            document.body.appendChild(jsonOutputElem);
        }
        const fullJsonString = JSON.stringify(jsonOutput, null, 2);
        jsonOutputElem.textContent = fullJsonString;
        jsonOutputElem.dataset.fullJson = fullJsonString;

    } else {
        alert('Please enter all color names and valid hex codes');
    }

    paletteGenerated = true;
}

// Function to initialize color inputs
function initializeColorInputs() {
    const colorInputsContainer = document.getElementById('colorInputs');
    colorInputsContainer.innerHTML = ''; // Clear any existing inputs

    Object.entries(defaultColors).forEach(([name, hex], i) => {
        const colorRow = document.createElement('div');
        colorRow.className = 'color-input-row';

        const colorNameInput = createInput('text', name, true);
        colorNameInput.classList.add('read-only');
        const hexInput = createInput('text', hex, false, `hexInput${i + 1}`);
        const colorPicker = createInput('color', hex, false);

        hexInput.addEventListener('input', () => {
            // Sanitize and correct hex input before further processing
            const sanitizedHex = sanitizeHexInput(hexInput.value);
            hexInput.value = sanitizedHex;

            if (sanitizedHex) {
                syncColorInput(hexInput, colorPicker);
            }
        });

        colorPicker.addEventListener('input', () => syncColorInput(colorPicker, hexInput));

        const defaultButton = createIconButton('fas fa-redo', 'default-button', () => resetToDefaultColor(hexInput, colorPicker, name));
        const randomButton = createIconButton('fas fa-random', 'random-button', () => randomizeColor(hexInput, colorPicker, name));
        const lastColorButton = createIconButton('fas fa-arrow-left', 'last-button', () => revertToLastColor(hexInput, colorPicker, name));

        colorRow.append(colorNameInput, hexInput, colorPicker, defaultButton, randomButton, lastColorButton);
        colorInputsContainer.appendChild(colorRow);
    });
}

// Function to create input fields
function createInput(type, value, readOnly = false, id = '') {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.readOnly = readOnly;
    if (id) input.id = id;
    input.className = 'form-control';
    if (type === 'text' && readOnly) {
        input.style.width = '140px'; // Increased width for long names
    } else {
        input.style.width = '100px';
    }
    if (type === 'color') {
        input.style.cursor = 'default'; // Skip changing cursor on color picker
    }
    return input;
}

// Function to create icon-based buttons
function createIconButton(iconClass, className, onClick) {
    const button = document.createElement('button');
    const icon = document.createElement('i');
    icon.className = iconClass;
    button.appendChild(icon);
    button.className = className;
    button.addEventListener('click', onClick);
    // Set fixed dimensions
    button.style.width = '40px';
    button.style.height = '40px';
    button.style.borderRadius = '50%';
    return button;
}

// Sync color inputs
function syncColorInput(source, target) {
    let color = source.value;
    if (!color.startsWith('#')) color = '#' + color;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        target.value = color;
    }
}

// Randomize color
function randomizeColor(input, picker, name) {
    if (!lastColors[name]) lastColors[name] = [];
    lastColors[name].push(input.value);
    const randomHex = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()}`;
    input.value = randomHex;
    picker.value = randomHex;
}

// Reset to default color
function resetToDefaultColor(input, picker, name) {
    if (!lastColors[name]) lastColors[name] = [];
    lastColors[name].push(input.value);
    input.value = defaultColors[name];
    picker.value = defaultColors[name];
}

// Revert to last color
function revertToLastColor(input, picker, name) {
    if (lastColors[name] && lastColors[name].length > 0) {
        const lastColor = lastColors[name].pop();
        input.value = lastColor;
        picker.value = lastColor;
    }
}

// Sanitize hex input
function sanitizeHexInput(hexInput) {
    let sanitizedHex = hexInput.replace(/#/g, '');
    if (sanitizedHex.length === 6) {
        return `#${sanitizedHex}`;
    }
    if (sanitizedHex.length === 3) {
        return `#${sanitizedHex.split('').map(char => char + char).join('')}`;
    }
    return '';
}

// Open tabs
function openTab(tabId) {
    const tabContentElements = document.querySelectorAll('.tab-content');
    tabContentElements.forEach(element => {
        element.classList.remove('active');
    });

    const tabButtonElements = document.querySelectorAll('.tab-button');
    tabButtonElements.forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="openTab('${tabId}')"]`).classList.add('active');

    // Show or hide the Generate button based on the active tab
    const generateButton = document.getElementById('generateButton');
    if (tabId === 'colorTab') {
        generateButton.style.display = 'inline-flex';
    } else {
        generateButton.style.display = 'none';
    }
}


// Populate font selectors with font previews
function populateFontSelectors() {
    // For Display Text
    const displayFontSelector = document.getElementById('displayFontSelector');
    const displayFontWeightSelector = document.getElementById('displayFontWeightSelector');
    displayFonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        option.style.fontFamily = font;
        displayFontSelector.appendChild(option);
    });

    fontWeights.forEach(weight => {
        const option = document.createElement('option');
        option.value = weight.value;
        option.textContent = weight.name;
        displayFontWeightSelector.appendChild(option);
    });

    // For Header and Base Text
    ['headerFontSelector', 'baseFontSelector'].forEach(selectorId => {
        const fontSelector = document.getElementById(selectorId);
        sansSerifFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            fontSelector.appendChild(option);
        });
    });

    ['headerFontWeightSelector', 'baseFontWeightSelector'].forEach(selectorId => {
        const fontWeightSelector = document.getElementById(selectorId);
        fontWeights.forEach(weight => {
            const option = document.createElement('option');
            option.value = weight.value;
            option.textContent = weight.name;
            fontWeightSelector.appendChild(option);
        });
    });

    // Load fonts dynamically
    loadFontsDynamically();
}


// Load selected fonts dynamically
function loadFontsDynamically() {
    const allFonts = [...displayFonts, ...sansSerifFonts];
    const uniqueFonts = [...new Set(allFonts)].map(font => font.replace(' ', '+'));
    const fontWeightsValues = fontWeights.map(weight => weight.value);
    const fontLink = document.getElementById('dynamic-fonts');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(font => `${font}:wght@${fontWeightsValues.join(';')}`).join('&family=')}&display=swap`;
}


// Randomly select fonts for Display, Header, and Base text
function randomizeFonts() {
    // Randomly select a display font
    const randomDisplayFont = displayFonts[Math.floor(Math.random() * displayFonts.length)];
    document.getElementById('displayFontSelector').value = randomDisplayFont;

    // Randomly select header and base fonts (ensure they are different)
    const shuffledSansSerifFonts = sansSerifFonts.sort(() => 0.5 - Math.random());
    const [headerFont, baseFont] = shuffledSansSerifFonts.slice(0, 2);

    document.getElementById('headerFontSelector').value = headerFont;
    document.getElementById('baseFontSelector').value = baseFont;

    // Set default font weights
    document.getElementById('displayFontWeightSelector').value = '700';
    document.getElementById('headerFontWeightSelector').value = '600';
    document.getElementById('baseFontWeightSelector').value = '400';
}

// Function to get abbreviation
function getAbbreviation(type) {
    const abbreviations = {
        // T-shirt sizes (uppercase)
        '8xl': '8xl',
        '7xl': '7xl',
        '6xl': '6xl',
        '5xl': '5xl',
        '4xl': '4xl',
        '3xl': '3xl',
        '2xl': '2xl',
        'xl': 'xl',
        'lg': 'lg',
        'md': 'md',
        'sm': 'sm',
        // Paragraph variants (lowercase)
        'paragraph-regular': 'p',
        'paragraph-medium': 'pm',
        'paragraph-semibold': 'ps',
        'paragraph-bold': 'pb',
        'paragraph-italic': 'pi',
        // Small text variants
        'small-regular': 'small',
        'small-medium': 'sm',
        'small-semibold': 'ss',
        'small-bold': 'sb',
        'small-italic': 'si',
        // Code styles (lowercase)
        'code-regular': 'code',
        'code-bold': 'cb',
        'code-italic': 'ci',
        // Blockquote and links
        'blockquote': 'bq',
        'link': 'link',
        'link-hover': 'linkh',
        // HTML types (as is)
        'H1': 'H1',
        'H2': 'H2',
        'H3': 'H3',
        'H4': 'H4',
        'H5': 'H5',
        'H6': 'H6',
        'p': 'p',
        'small': 'small',
        'code': 'code',
        'a': 'a',
    };
    return abbreviations[type] || type;
}


// Function to get equivalent types
function getEquivalentTypes(type) {
    const equivalentsMap = {
        '8xl': ['H1'],
        '4xl': ['H2'],
        '3xl': ['H3'],
        '2xl': ['H4'],
        'xl': ['H5'],
        'lg': ['H6'],
        'md': ['p'],
        'sm': ['small'],
        // Add other mappings as needed
    };
    return equivalentsMap[type] || [];
}

// Function to create legend
function createLegend(usedTypes, typographyStyles) {
    const legendContainer = document.createElement('div');
    legendContainer.className = 'legend-container';

    const legendTitle = document.createElement('h4');
    legendTitle.textContent = 'Legend';
    legendContainer.appendChild(legendTitle);

    const legendList = document.createElement('ul');
    legendList.className = 'legend-list';

    usedTypes.forEach((value, type) => {
        const listItem = document.createElement('li');
        listItem.className = 'legend-item';

        // Create color boxes
        const colorBoxes = document.createElement('div');
        colorBoxes.className = 'legend-color-boxes';

        // Determine if it's a T-shirt size or HTML type
        const isTShirtSize = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'].includes(type);

        // Add color boxes for type and its equivalents
        const typeColorBox = document.createElement('span');
        typeColorBox.className = 'legend-color-box';
        typeColorBox.style.backgroundColor = isTShirtSize ? '#4CAF50' : '#FFA500';
        colorBoxes.appendChild(typeColorBox);

        value.equivalents.forEach(eqType => {
            const eqColorBox = document.createElement('span');
            eqColorBox.className = 'legend-color-box';
            const eqIsTShirtSize = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'].includes(eqType);
            eqColorBox.style.backgroundColor = eqIsTShirtSize ? '#4CAF50' : '#FFA500';
            colorBoxes.appendChild(eqColorBox);
        });

        // Create label with abbreviations
        const abbreviations = [type, ...value.equivalents].map(t => getAbbreviation(t)).join(' / ');

        const typeLabel = document.createElement('span');
        typeLabel.textContent = ` ${abbreviations}`;
        typeLabel.style.fontSize = `${value.fontSize}px`;
        typeLabel.style.fontWeight = 'normal'; // Consistent font weight
        typeLabel.style.fontStyle = 'normal'; // Consistent font style

        listItem.appendChild(colorBoxes);
        listItem.appendChild(typeLabel);
        legendList.appendChild(listItem);
    });

    legendContainer.appendChild(legendList);
    return legendContainer;
}



// Update typography in real-time
function updateTypography() {
    // Base Text Settings
    const baseFontFamily = document.getElementById('baseFontSelector').value;
    const baseFontWeight = document.getElementById('baseFontWeightSelector').value;
    const baseFontSize = parseFloat(document.getElementById('baseFontSizeInput').value);
    const baseLineHeight = parseFloat(document.getElementById('baseLineHeightInput').value) * baseFontSize;

    // Header Text Settings
    const headerFontFamily = document.getElementById('headerFontSelector').value;
    const headerFontWeight = document.getElementById('headerFontWeightSelector').value;

    // Display Text Settings
    const displayFontFamily = document.getElementById('displayFontSelector').value;
    const displayFontWeight = document.getElementById('displayFontWeightSelector').value;

    // Typography Scale Ratios
    const scaleRatios = {
        'sm': 0.875,
        'md': 1,      // Base size
        'lg': 1.25,
        'xl': 1.5,
        '2xl': 1.75,
        '3xl': 2,
        '4xl': 2.5,
        '5xl': 3,
        '6xl': 3.5,
        '7xl': 4,
        '8xl': 4.5
    };

    // Generate Typography Styles
    const typographyStyles = {};

    Object.keys(scaleRatios).forEach(sizeKey => {
        let fontSize = baseFontSize * scaleRatios[sizeKey];

        // Calculate line height based on the rules
        let lineHeight;

        if (fontSize > baseFontSize) {
            // For headers and display text
            lineHeight = Math.min(fontSize * 1.5, fontSize);
            lineHeight = Math.max(lineHeight, 24);
            // Round to nearest multiple of 4
            lineHeight = Math.ceil(lineHeight / 4) * 4;
        } else {
            // For base and smaller text
            lineHeight = baseLineHeight;
            lineHeight = Math.max(lineHeight, 24);
            lineHeight = Math.ceil(lineHeight / 4) * 4;
        }

        typographyStyles[sizeKey] = {
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeight}px`,
            fontFamily: baseFontFamily,
            fontWeight: baseFontWeight
        };
    });

    // Apply specific fonts for Header and Display Text
    ['lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl'].forEach(sizeKey => {
        typographyStyles[sizeKey].fontFamily = headerFontFamily;
        typographyStyles[sizeKey].fontWeight = headerFontWeight;
    });

    ['6xl', '7xl', '8xl'].forEach(sizeKey => {
        typographyStyles[sizeKey].fontFamily = displayFontFamily;
        typographyStyles[sizeKey].fontWeight = displayFontWeight;
    });

    // Additional styles
    // Paragraph variants
    ['paragraph-regular', 'paragraph-medium', 'paragraph-semibold', 'paragraph-bold', 'paragraph-italic'].forEach(style => {
        typographyStyles[style] = {
            ...typographyStyles['md'],
            fontWeight: style.includes('medium') ? '500' : style.includes('semibold') ? '600' : style.includes('bold') ? '700' : baseFontWeight,
            fontStyle: style.includes('italic') ? 'italic' : 'normal',
            textDecoration: style.includes('underline') ? 'underline' : 'none'
        };
    });

    // Small text variants
    ['small-regular', 'small-medium', 'small-semibold', 'small-bold', 'small-italic'].forEach(style => {
        typographyStyles[style] = {
            ...typographyStyles['sm'],
            fontWeight: style.includes('medium') ? '500' : style.includes('semibold') ? '600' : style.includes('bold') ? '700' : baseFontWeight,
            fontStyle: style.includes('italic') ? 'italic' : 'normal',
            textDecoration: style.includes('underline') ? 'underline' : 'none'
        };
    });

    // Code styles
    typographyStyles['code-regular'] = {
        ...typographyStyles['sm'],
        fontFamily: 'Courier New, monospace',
        fontWeight: '400'
    };
    typographyStyles['code-bold'] = {
        ...typographyStyles['sm'],
        fontFamily: 'Courier New, monospace',
        fontWeight: '700'
    };
    typographyStyles['code-italic'] = {
        ...typographyStyles['sm'],
        fontFamily: 'Courier New, monospace',
        fontStyle: 'italic'
    };

    // Blockquote
    typographyStyles['blockquote'] = {
        ...typographyStyles['lg'],
        fontStyle: 'italic'
    };

    // Link styles
    typographyStyles['link'] = {
        ...typographyStyles['md'],
        color: '#1a0dab',
        textDecoration: 'underline'
    };
    typographyStyles['link-hover'] = {
        ...typographyStyles['md'],
        color: '#c61a09',
        textDecoration: 'underline'
    };

    // Update Samples
    updateSample('desktopSample', typographyStyles, false);
    updateSample('mobileSample', typographyStyles, true);
}

// Function to update sample content
function updateSample(sampleId, typographyStyles, isMobile) {
    const sample = document.getElementById(sampleId);
    sample.innerHTML = getSampleContent();
    const elements = sample.querySelectorAll('[data-typography]');

    elements.forEach(element => {
        const type = element.getAttribute('data-typography');
        const style = typographyStyles[type];

        if (!style) return; // Skip if style not defined

        let fontSizeValue = parseFloat(style.fontSize);
        let lineHeightValue = parseFloat(style.lineHeight);

        if (isMobile) {
            fontSizeValue = Math.max(14, fontSizeValue * 0.875); // Reduce font size by 12.5%, minimum 14px
            lineHeightValue = lineHeightValue * 0.875;
        }

        element.style.fontSize = `${fontSizeValue}px`;
        element.style.lineHeight = `${lineHeightValue}px`;
        element.style.fontFamily = style.fontFamily;
        element.style.fontWeight = style.fontWeight || 'normal';
        element.style.fontStyle = style.fontStyle || 'normal';
        element.style.textDecoration = style.textDecoration || 'none';
        element.style.color = style.color || 'inherit';
        element.style.textAlign = 'left';

        // Add typography name badges inside the element
        if (!isMobile && !element.querySelector('.typography-name-container')) {
            const badgeContainer = document.createElement('span');
            badgeContainer.className = 'typography-name-container';

            // Get the abbreviations and determine if there are equivalents
            const abbreviation = getAbbreviation(type);
            const equivalents = getEquivalentTypes(type);
            const isEquivalent = equivalents.length > 0;

            // Create the primary badge
            const primaryBadge = document.createElement('span');
            primaryBadge.className = 'typography-name';
            primaryBadge.textContent = abbreviation;
            primaryBadge.style.backgroundColor = '#4CAF50'; // Green color

            badgeContainer.appendChild(primaryBadge);

            // If there are equivalents, create additional badges
            if (isEquivalent) {
                equivalents.forEach(eqType => {
                    const eqAbbreviation = getAbbreviation(eqType);
                    const eqBadge = document.createElement('span');
                    eqBadge.className = 'typography-name';
                    eqBadge.textContent = eqAbbreviation;
                    eqBadge.style.backgroundColor = '#FFA500'; // Orange color
                    badgeContainer.appendChild(eqBadge);
                });
            }

            element.appendChild(badgeContainer);
        }
    });
}

// Function to get sample content
function getSampleContent() {
    return `
    <h1 data-typography="8xl">Global Summit Insights Highlights</h1>
    <p data-typography="paragraph-regular">The annual global summit convened leaders from across the world to address pressing challenges facing our planet, fostering dialogue and collaboration. Attendees included heads of state, industry pioneers, influential policymakers, and thought leaders dedicated to creating impactful solutions.</p>
    <h2 data-typography="4xl">Leaders Unite for Change: Collaborative Efforts for a Sustainable Future</h2>
    <p data-typography="paragraph-regular">In a historic move, leaders pledged to collaborate on comprehensive initiatives that aim to foster sustainable growth, promote equitable resource distribution, and ensure long-term stability for communities worldwide.</p>
    <h3 data-typography="3xl">Key Discussions on Climate: Strategies and Solutions</h3>
    <p data-typography="paragraph-regular">Climate change dominated the summit's agenda, with a strong consensus on the urgent need for immediate action to significantly reduce greenhouse gas emissions, invest in renewable energy sources, and implement policies that support environmental sustainability.</p>
    <h4 data-typography="2xl">Innovations in Renewable Energy: Advancements and Applications</h4>
    <p data-typography="paragraph-regular">Breakthroughs in solar and wind technologies were showcased, highlighting the immense potential for cleaner, more efficient energy sources to effectively replace fossil fuels and drive the transition towards a more sustainable energy infrastructure.</p>
    <h5 data-typography="xl">Community Engagement: Grassroots Movements and Local Initiatives</h5>
    <p data-typography="paragraph-regular">Grassroots movements and community leaders emphasized the critical importance of local initiatives in driving global change, advocating for increased participation and empowering communities to take active roles in environmental conservation and sustainable development.</p>
    <h6 data-typography="lg">Future Plans: Roadmap for Sustainable Development</h6>
    <p data-typography="paragraph-regular">The summit concluded with a comprehensive roadmap outlining actionable steps for the coming decade, aimed at guiding nations and organizations towards sustainable development goals and measurable environmental improvements.</p>
    <p data-typography="paragraph-medium">Several working groups were established to diligently monitor progress and ensure accountability among participating nations, fostering a collaborative environment where commitments are tracked and objectives are consistently met.</p>
    <p data-typography="paragraph-semibold">The private sector committed significant investments towards ambitious sustainable infrastructure projects, aiming to support the development of eco-friendly facilities and technologies that align with the summit's environmental objectives.</p>
    <p data-typography="paragraph-bold">Comprehensive education and awareness campaigns will be launched to actively engage the public in environmental conservation efforts, promoting knowledge, and encouraging proactive participation in protecting our planet.</p>
    <p data-typography="paragraph-italic">"Our collective future depends on the actions we take today," stated the keynote speaker, emphasizing the urgent need for unified efforts to address environmental challenges and secure a sustainable legacy for future generations.</p>
    <blockquote data-typography="blockquote">"This is a pivotal moment for our planet," emphasized the UN Secretary-General, urging immediate and decisive action to combat climate change and preserve natural ecosystems for the well-being of all life forms.</blockquote>
    <p data-typography="paragraph-regular">Experts believe that these collaborative efforts could significantly mitigate the adverse effects of climate change, reducing environmental degradation and fostering resilience in ecosystems and communities worldwide.</p>
    <small data-typography="small-regular">Reported by Global News Network</small>
    <small data-typography="small-medium">In-depth Analysis by Industry Experts</small>
    <small data-typography="small-bold">Latest Breaking News Update</small>
    <code data-typography="code-regular">console.log('Sustainability is the future'); // Log the sustainability message</code>
    <p data-typography="paragraph-regular">For more information on the summit's outcomes and detailed reports, visit the official website to explore comprehensive insights and follow-up actions.</p>
    <a href="#" data-typography="link">Learn more about the summit and its key outcomes...</a>
    `;
}



// Function to adjust font size for Mobile
function adjustFontSize(fontSize) {
    const size = parseFloat(fontSize);
    const mobileFontSize = Math.max(14, size * 0.875); // Reduce by 12.5%, minimum 14px
    return `${mobileFontSize}px`;
}

function adjustLineHeight(fontSize, lineHeight) {
    const size = parseFloat(fontSize);
    const lh = parseFloat(lineHeight);
    return lh;
}

function populateAbbreviationFooter() {
    const footer = document.getElementById('abbreviationFooter');

    // Abbreviation matches
    const abbreviationMatches = {
        // T-shirt sizes and their HTML equivalents
        'H1' : '8xl',
        'H2' : '4xl',
        'H3' : '3xl',
        'H4' : '2xl',
        'H5' : 'xl',
        'H6' : 'lg',
        'p' : 'md',
        'small' : 'sm',
        // Add other matches if needed
    };

    // Create the content for the footer
    let footerContent = '<h4>Abbreviation Matches</h4><ul class="abbreviation-list">';

    for (const [abbr, match] of Object.entries(abbreviationMatches)) {
        // Use the exact letter case as defined in code
        footerContent += `<li><strong>${abbr}</strong> = ${match}</li>`;
    }

    footerContent += '</ul>';

    footer.innerHTML = footerContent;
}

// Download JSON file
function downloadJson() {
    const jsonOutputElem = document.getElementById('jsonOutput');
    if (jsonOutputElem && jsonOutputElem.dataset.fullJson) {
        const fullJson = jsonOutputElem.dataset.fullJson;
        const blob = new Blob([fullJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `palette.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        alert('Please generate a palette first.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeColorInputs();
    populateFontSelectors();

    document.getElementById('generateButton').addEventListener('click', generatePalette);
    document.getElementById('downloadButton').addEventListener('click', () => {
        if (!paletteGenerated) {
            generatePalette();
        }
        downloadJson();
    });

    // Trigger generatePalette when Enter key is pressed
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'BUTTON' || activeElement.tagName === 'SELECT') {
                activeElement.blur();
            }
            if (document.getElementById('colorTab').classList.contains('active')) {
                generatePalette();
            }
        }
    });

    // Update typography in real-time
    const typographyInputs = document.querySelectorAll('.typography-settings input, .typography-settings select');
    typographyInputs.forEach(input => {
        input.addEventListener('change', updateTypography);
        input.addEventListener('input', updateTypography);
    });

    // Initialize the tabs
    openTab('colorTab');

    // Randomly select fonts on page load
    randomizeFonts();

    // Initial typography update
    updateTypography();

    // Populate the abbreviation footer
    populateAbbreviationFooter();

    
    // Call this function after rendering the typography samples
    positionLegends();

    // Also call it on window resize
    window.addEventListener('resize', positionLegends);

});
