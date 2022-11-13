# rf_playground
Let the user map the receptive field of a chosen artificial unit using simple stimuli like bars and gratings, then compare the mapping result with the ground truth map. The web app reduces latency by using ONNX.js to load the neural network and HTML5 Canvas for user interactions. The website is under construction.


For local development, consider turning off the CORS by typing the following in the terminal:
`open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security`

The web app is deployed at:
[demo](https://tonyfu97.github.io/rf_playground/)

Credit: This work is inspired by [elliotwaite's work] (https://github.com/elliotwaite/pytorch-to-javascript-with-onnx-js)
