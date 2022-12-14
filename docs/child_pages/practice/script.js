var canvas = document.querySelector("#rfCanvas");
var actualInputCanvas = document.getElementById("actualInputCanvas");
var rfPolygonCanvas = document.getElementById("rfPolygonCanvas");
var groundTruthCanvasForMetricCalculationCanvas = document.getElementById("groundTruthCanvasForMetricCalculation");
var groundTruthCanvasForDisplayCanvas = document.getElementById("groundTruthCanvasForDisplay");

var context = canvas.getContext("2d");
var actualInputContext = actualInputCanvas.getContext("2d");
var rfPolygonContext = rfPolygonCanvas.getContext("2d");
var groundTruthCanvasForMetricCalculationContext = groundTruthCanvasForMetricCalculationCanvas.getContext("2d");
var groundTruthCanvasForDisplayContext = groundTruthCanvasForDisplayCanvas.getContext("2d");

const CANVAS_BORDER_WIDTH = 10;  // must be consistent with style.css

let rf_size = 25;
let canvasPos = canvas.getBoundingClientRect();
let canvasFactor = (canvasPos.width - 2 * CANVAS_BORDER_WIDTH) / rf_size;

let gtCanvasPos = groundTruthCanvasForDisplayCanvas.getBoundingClientRect();
let gtCanvasFactor = (gtCanvasPos.width - 2 * CANVAS_BORDER_WIDTH) / rf_size;

// Canvas dimension logic: (scaled to the neuron's RF size)
const update_rf_size = (new_size) => {
    rf_size = new_size;

    canvas.height = new_size;
    canvas.width = new_size;
    actualInputCanvas.height = new_size;
    actualInputCanvas.width = new_size;
    rfPolygonCanvas.height = new_size;
    rfPolygonCanvas.width = new_size;

    groundTruthCanvasForMetricCalculationCanvas.height = new_size;
    groundTruthCanvasForMetricCalculationCanvas.width = new_size;
    groundTruthCanvasForDisplayCanvas.height = new_size;
    groundTruthCanvasForDisplayCanvas.width = new_size;

    canvasPos = canvas.getBoundingClientRect();
    canvasFactor = (canvasPos.width - 2 * CANVAS_BORDER_WIDTH) / new_size;

    gtCanvasPos = groundTruthCanvasForDisplayCanvas.getBoundingClientRect();
    gtCanvasFactor = (gtCanvasPos.width - 2 * CANVAS_BORDER_WIDTH) / rf_size;

    bar.update();
};

// Get bar attributes DOM delements from index.html.
var rf_size_div = document.getElementById("rf_size_div");
var bar_color_div = document.getElementById("bar_color");
var bg_color_div = document.getElementById("bg_color");
const convertTo256 = num => Math.floor((parseFloat(num) + 1) * 128);
let canvasBgRgb = "rgb(128,128,128)";

// RF size slider logic:
rf_size_div.addEventListener('change', (event) => {
    rf_size = document.getElementById("bar_rf_size").value;
    update_rf_size(rf_size);
    document.getElementById("rf_size_label").innerHTML = `RF Size = ${rf_size}`;
    bar.update();
});

// Bar color slider logic:
bar_color_div.addEventListener('change', (event) => {
    let r = document.getElementById("bar_red").value;
    let g = document.getElementById("bar_green").value;
    let b = document.getElementById("bar_blue").value;
    bar.rgb = `rgb(${convertTo256(r)},${convertTo256(g)},${convertTo256(b)})`;
    document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(${r}, ${g}, ${b})`;
    bar.update();
});

// Background color slider logic:
bg_color_div.addEventListener('change', (event) => {
    let r = document.getElementById("bg_red").value;
    let g = document.getElementById("bg_green").value;
    let b = document.getElementById("bg_blue").value;
    let rgb = `rgb(${convertTo256(r)},${convertTo256(g)},${convertTo256(b)})`;
    document.getElementById("bg_color_label").innerHTML = `Background color = rgb(${r}, ${g}, ${b})`;
    canvasBgRgb = rgb;
    bar.update();
});

let response = 0;

// Initialize mouse object (used to keep track of mouse position):
let mouse = {
    x: undefined,
    y: undefined
};

// 2 classes to store user-drawn receptive field polygon.
class RfCorner {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
};

class Rf {
    constructor() {
        this.corners = [];
        this.closePath = false;
    }

    push(x, y) {
        if (!this.closePath) {  // can't add anymore corners if the path is closed
            this.corners.push(new RfCorner(x, y));
        }
    }

    pop() {
        if (this.corners.length > 0) {
            this.corners.pop();
        }
    }

    undo() {
        if (this.closePath) {
            this.closePath = false;
        } else {
            this.pop();
        }
    }

    reset() {
        this.corners = [];
        this.closePath = false;
    }

    draw(ctx, noLine = false) {
        if (this.corners.length > 0) {
            ctx.strokeStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(this.corners[0].x, this.corners[0].y);
            for (let i = 1; i < this.corners.length; i++) {
                ctx.lineTo(this.corners[i].x, this.corners[i].y);
            }
            if (this.closePath) {
                ctx.closePath();
                ctx.fillStyle=ground_truth_color;
                ctx.fill();
            }
            if (!noLine) {
                ctx.stroke();
            }
        }
    }
};


let polygon_rf = new Rf();
let gt_rf = new Rf();
// To keep track of which Rf has been last drawn.
let is_polygon_rf_last_drawn = true;

// To set a random color everytime the user generate a new ground truth.
let ground_truth_color;
const generate_random_gt_rf_color = () => {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    ground_truth_color = `rgba(${r}, ${g}, ${b}, 1)`;
}


// RF polygon logic:
let undo_button = document.getElementById("undo");
let reset_button = document.getElementById("reset");
undo_button.addEventListener("click", () => {
    is_polygon_rf_last_drawn = true;
    polygon_rf.undo();
    bar.update();
});
reset_button.addEventListener("click", () => {
    is_polygon_rf_last_drawn = true;
    polygon_rf.reset();
    bar.update();
});

// Ground truth RF logic:
let gt_undo_button = document.getElementById("gt_undo");
let gt_reset_button = document.getElementById("gt_reset");
let gt_hide_button = document.getElementById("gt_hide");
let is_gt_rf_hidden = false;
gt_undo_button.addEventListener("click", () => {
    is_polygon_rf_last_drawn = false;
    gt_rf.undo();
    bar.update();
});
gt_reset_button.addEventListener("click", () => {
    is_polygon_rf_last_drawn = false;
    gt_rf.reset();
    bar.update();
});
gt_hide_button.addEventListener("click", () => {
    if (is_gt_rf_hidden) {
        document.getElementById('groundTruthCanvasForDisplay').setAttribute('style', 'display:inline;');
        gt_hide_button.innerText = "Hide Groud Truth";
        is_gt_rf_hidden = false;
    } else {
        document.getElementById('groundTruthCanvasForDisplay').setAttribute('style', 'display:none;');
        is_gt_rf_hidden = true;
        gt_hide_button.innerText = "Show Ground Truth";
    }
});



// Initialize bar:
function Bar(x, y, width, height, angle, rgb) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;  // in radians
    this.rgb = rgb;   // as string like "rgb(255, 255, 255)" or "#FFFFFF"

    this.draw = function(ctx) {
        // Apply rotation matrix
        let top_left_x = this.x + (Math.cos(this.angle) * (-this.width/2) + Math.sin(this.angle) * (-this.height/2));
        let top_left_y = this.y + (-Math.sin(this.angle) * (-this.width/2) + Math.cos(this.angle) * (-this.height/2));

        let top_right_x = this.x + (Math.cos(this.angle) * (this.width/2) + Math.sin(this.angle) * (-this.height/2));
        let top_right_y = this.y + (-Math.sin(this.angle) * (this.width/2) + Math.cos(this.angle) * (-this.height/2));

        let bottom_left_x = this.x + (Math.cos(this.angle) * (-this.width/2) + Math.sin(this.angle) * (this.height/2));
        let bottom_left_y = this.y + (-Math.sin(this.angle) * (-this.width/2) + Math.cos(this.angle) * (this.height/2));

        let bottom_right_x = this.x + (Math.cos(this.angle) * (this.width/2) + Math.sin(this.angle) * (this.height/2));
        let bottom_right_y = this.y + (-Math.sin(this.angle) * (this.width/2) + Math.cos(this.angle) * (this.height/2));
        
        // Draw the rectangle
        ctx.beginPath();
        ctx.moveTo(top_left_x, top_left_y);
        ctx.lineTo(top_right_x, top_right_y);
        ctx.lineTo(bottom_right_x, bottom_right_y);
        ctx.lineTo(bottom_left_x, bottom_left_y);
        ctx.closePath();
        ctx.fillStyle = this.rgb;
        ctx.fill();
    }

    this.convert_mouse_xy_to_canvas_xy = function() {
        this.x = mouse.x - canvasPos.left - CANVAS_BORDER_WIDTH;
        this.x = this.x/canvasFactor;
        this.y = mouse.y - canvasPos.top - CANVAS_BORDER_WIDTH;
        this.y = this.y/canvasFactor;
    }

    this.update = function(freeze=false) {
        if (!freeze) {
            this.convert_mouse_xy_to_canvas_xy();
        }

        // 1. the canvas that the user interact with:
        context.fillStyle = canvasBgRgb;
        context.fillRect(0, 0, canvas.width, canvas.height);
        this.draw(context);  // draw bar
        polygon_rf.draw(context);  // draw user-defined recepetive field polygon

        // 2. the canvas that contains the actual input (i.e., without the user-drawn RF polygon):
        actualInputContext.fillStyle = canvasBgRgb;
        actualInputContext.fillRect(0, 0, actualInputCanvas.width, actualInputCanvas.height);
        this.draw(actualInputContext);  // draw bar

        // 3. the canvas that contains the region outlined by the user-drawn RF polygon
        rfPolygonContext.fillStyle = "rgba(0,0,0,1)";
        rfPolygonContext.fillRect(0, 0, rfPolygonCanvas.width, rfPolygonCanvas.height);
        polygon_rf.draw(rfPolygonContext, true);  // draw user-defined recepetive field polygon without outline

        // 4. the canvas that contains the region outlined by the user-drawn GROUND TRUTH RF polygon
        groundTruthCanvasForDisplayContext.fillStyle = "rgba(0,0,0,1)";
        groundTruthCanvasForDisplayContext.fillRect(0, 0, groundTruthCanvasForDisplayCanvas.width, groundTruthCanvasForDisplayCanvas.height);
        gt_rf.draw(groundTruthCanvasForDisplayContext);  // draw user-defined polygon with outline

        // 5. the canvas that contains the region outlined by the user-drawn GROUND TRUTH RF polygon
        groundTruthCanvasForMetricCalculationContext.fillStyle = "rgba(0,0,0,1)";
        groundTruthCanvasForMetricCalculationContext.fillRect(0, 0, groundTruthCanvasForMetricCalculationCanvas.width, groundTruthCanvasForMetricCalculationCanvas.height);
        gt_rf.draw(groundTruthCanvasForMetricCalculationContext, true);  // draw user-defined polygon without outline
    }
};
let bar = new Bar(0, 0, 5, 10, 0, "#FFFFFF");
update_rf_size(rf_size);


// Mouse move logic:
let barFrozen = false;  // bar will be frozen by spacebar.
window.addEventListener('mousemove',
    async (event) => {
        mouse.x = event.x + window.scrollX;
        mouse.y = event.y + window.scrollY;

        bar.update(barFrozen);
        await updatePredictions();
});


// Enlarge/shrink/rotate/freeze the bar:
document.addEventListener('keypress', (event) => {
    var name = event.key;

    if (name == 'w') {
        bar.height *= 1.1;
        bar.update();
    } else if (name == 's') {
        bar.height *= 0.9;
        bar.update();
    } else if (name == 'd') {
        bar.width *= 1.1;
        bar.update();
    } else if (name == 'a') {
        bar.width *= 0.9;
        bar.update();
    } else if (name == 'r') {
        bar.angle += Math.PI / 32;
        bar.update();
    } else if (name == 't') {
        bar.angle -= Math.PI / 32;
        bar.update();
    } else if (name == " ") {  // spacebar
        event.preventDefault();
        barFrozen = !barFrozen;  // prevents spacebar-evoked page scrolling.
    } else if (name == "1") { // red
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(255,0,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, -1, -1)`;
        bar.update();
    } else if (name == "2") {  // yellow
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(255,255,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, 1, -1)`;
        bar.update();
    } else if (name == "3") {  // green
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(0,255,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, 1, -1)`;
        bar.update();
    } else if (name == "4") {  // cyan
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(0,255,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, 1, 1)`;
        bar.update();
    } else if (name == "5") {  // blue
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(0,0,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, -1, 1)`;
        bar.update();
    } else if (name == "6") {  // magenta
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(255,0,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, -1, 1)`;
        bar.update();
    } else if (name == "7") {  // black
        document.getElementById("bar_red").value = -1;
        document.getElementById("bar_green").value = -1;
        document.getElementById("bar_blue").value = -1;
        bar.rgb = `rgb(0,0,0)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(-1, -1, -1)`;
        bar.update();
    } else if (name == "8") {  // white
        document.getElementById("bar_red").value = 1;
        document.getElementById("bar_green").value = 1;
        document.getElementById("bar_blue").value = 1;
        bar.rgb = `rgb(255,255,255)`;
        document.getElementById("bar_color_label").innerHTML = `Bar color = rgb(1, 1, 1)`;
        bar.update();
    } else if (name == "Enter") {
        if (is_polygon_rf_last_drawn) {
            polygon_rf.closePath = true;
        } else {
            generate_random_gt_rf_color();
            gt_rf.closePath = true;
        }
        bar.update(barFrozen);
    }
    updatePredictions();
});

// User-drawn receptive field polygon logic:
canvas.addEventListener('mousedown', (event) => {
    let x = mouse.x - canvasPos.left - CANVAS_BORDER_WIDTH;
    x = x/canvasFactor;
    let y = mouse.y - canvasPos.top - CANVAS_BORDER_WIDTH;
    y = y/canvasFactor;
    polygon_rf.push(x, y);
    polygon_rf.draw(context); 
    polygon_rf.draw(rfPolygonContext, true); 
    is_polygon_rf_last_drawn = true;
});


groundTruthCanvasForDisplayCanvas.addEventListener('mousedown', (event) => {
    let x = mouse.x - gtCanvasPos.left - CANVAS_BORDER_WIDTH;
    x = x/gtCanvasFactor;
    let y = mouse.y - gtCanvasPos.top - CANVAS_BORDER_WIDTH;
    y = y/gtCanvasFactor;
    gt_rf.push(x, y);
    bar.update();
    gt_rf.draw(groundTruthCanvasForDisplayContext);
    gt_rf.draw(groundTruthCanvasForMetricCalculationContext, true);
    is_polygon_rf_last_drawn = false;
});


// ultility function to calculate Pearson coorelation coefficient:
// Credit: https://stackoverflow.com/questions/15886527/javascript-library-for-pearson-and-or-spearman-correlations
const calculate_pcorr = (x, y) => {
    let sumX  = 0,
        sumY  = 0,
        sumXY = 0,
        sumX2 = 0,
        sumY2 = 0;
    const minLength = x.length = y.length = Math.min(x.length, y.length),
      reduce = (xi, idx) => {
        const yi = y[idx];
        sumX += xi;
        sumY += yi;
        sumXY += xi * yi;
        sumX2 += xi * xi;
        sumY2 += yi * yi;
      }
    x.forEach(reduce);
    let numerator = (minLength * sumXY - sumX * sumY);
    let denominator =  Math.sqrt((minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY));
    if (denominator == 0) { return 0; }
    return numerator / denominator;
};


// ultility function to convert canvas into array:
const convert_canvas_to_array = (temp_canvas) => {
    const ctx = temp_canvas.getContext('2d');
  
    let result = [];
    for (let y = 0; y < temp_canvas.height; y++) {
      for (let x = 0; x < temp_canvas.width; x++) {
        let data = ctx.getImageData(x, y, 1, 1).data; // get one pixel at (x, y)
        result.push(data[0]); // R
        result.push(data[1]); // G
        result.push(data[2]); // B
      }
    }
    return result;
  };


// Get prediction. This function is called whenever the mouse is moved.
async function updatePredictions() {
    // Get the flatten image array of the ground truth image.
    let ground_truth_array = convert_canvas_to_array(groundTruthCanvasForMetricCalculationCanvas);

    // Get the flatten image array of the user-drawn RF polygon (cropped).
    let actual_input_array = convert_canvas_to_array(actualInputCanvas);

    // Metric calculations:
    let R = calculate_pcorr(ground_truth_array, actual_input_array);

    response = R;
    let element = document.getElementById('output');
    element.innerHTML = `response = ${Math.round(response * 100) / 100}`;
};


// Mute button initialization:
let mute_button = document.getElementById("mute");
mute_button.innerHTML = 'Spike sound: off';
mute_button.style.background = 'lightcoral';

// Mute button logic:
mute_button.addEventListener('click', () => {
    if (spike.muted) {
        mute_button.innerHTML = 'Spike sound: on';
        mute_button.style.background = 'lightgreen';
    } else {
        mute_button.innerHTML = 'Spike sound: off';
        mute_button.style.background = 'lightcoral';
    }
    spike.muted = !spike.muted;
});


// Volume control logic:
let maxVolumeButton = document.getElementById("volume");
let maxVolume = 0.5;
maxVolumeButton.addEventListener('change', (event) => {
    maxVolume = maxVolumeButton.value;
    document.getElementById("volume_label").innerHTML = `Max-Volume Response: ${maxVolume}`;
});


// Continuously playing spike sound even when mouse is not moving:
var spike = document.getElementById("audio");
canvas.addEventListener('mouseover',
    event => {
    setInterval(() => {
        if (!spike.muted && response > 0) {
        spike.volume = Math.min(response/maxVolume, 1);
        spike.play();
        }
    }, 100);
});
