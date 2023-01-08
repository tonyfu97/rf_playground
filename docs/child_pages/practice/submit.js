var groundTruthCanvasForMetricCalculationCanvas = document.getElementById("groundTruthCanvasForMetricCalculation");
var groundTruthCanvasForDisplayCanvas = document.getElementById("groundTruthCanvasForDisplay");
var rfPolygonCanvas = document.getElementById("rfPolygonCanvas");
var groundTruthCanvasForMetricCalculationContext = groundTruthCanvasForMetricCalculationCanvas.getContext("2d");
var groundTruthCanvasForDisplayContext = groundTruthCanvasForDisplayCanvas.getContext("2d");
var rfPolygonContext = rfPolygonCanvas.getContext("2d");
const CANVAS_BORDER_WIDTH = 10;  // must be consistent with style.css

// utility function to create HTML.
function getHtml(template) {
    return template.join('\n');
};

// submit button logic:
var submitButton = document.getElementById("submit");
submitButton.addEventListener("click", async() => {
  // Wait 100 ms.
  await delay(100); 

  // Get the flatten image array of the ground truth image.
  let ground_truth_array = convert_canvas_to_array(groundTruthCanvasForMetricCalculationCanvas);

  // Get the flatten image array of the user-drawn RF polygon (cropped).
  let rf_polygon_array = convert_canvas_to_array(rfPolygonCanvas);

  // Metric calculations:
  let R = calculate_pcorr(ground_truth_array, rf_polygon_array);
  let threshold = 128;
  let IOU = calculate_iou(ground_truth_array, rf_polygon_array, threshold);

  // Update the html element to display the metrics:
  let submission_results_div = document.getElementById('submission_results');
  submission_results_div.innerHTML = getHtml([
    '<h3>Submission results:</h3>',
    '<ul>',
        `<li id="direct_corr">Direct correlation: ${round_num(R, 4)}</li>`,
        `<li id="iou">Intersection over union: ${round_num(IOU, 4)}</li>`,
    `</ul>`
  ]);

  // Display the ground truth image.
  // document.getElementById('ground_truth_img_div').setAttribute('style', 'display:inline;');
});

// ultility function to delay. Use in async function:
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
};

// ultility function to convert image to canvas:
const convert_image_to_canvas = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
  return canvas;
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

// ultility function to round a number:
const round_num = (num, decimal_places) => {
  const factor = Math.pow(10, decimal_places);
  return Math.round(num * factor) / factor;
}

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


// ultility function to threshold the array. Pixels above the threshold become
// 255, and those less than or equal to threshold become zeros.
const create_threshold_array = (arr, threshold) => {
  let output = arr.map(x => {
    if (x < threshold) {
      return 0;
    } else {
      return 255;
    }
  });
  return output;
}

// ultility function to calculate intersection over union (IOU):
const calculate_iou = (x, y, threshold) => {
  if (x.length != y.length) {
    throw new Error('iou function: x and y must have same length.');
  }

  let intersection = 0;
  let union = 0;

  for (let i = 0; i < x.length; i++) {
    if (x[i] > threshold || y[i] > threshold) {
      union++;
    }
    if (x[i] > threshold && y[i] > threshold) {
      intersection++;
    }
  }
  
  if (union == 0) { return 0; };
  return intersection/union;
};

