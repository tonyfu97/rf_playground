# rf_playground

![Overview](docs/images/overview.jpg?raw=true "Overview of RF Playground")

Let the user map the receptive field of a chosen artificial unit using a bar stimulus, then compare the mapping result with the ground truth map. The web app reduces latency by using ONNX.js to load the neural network and HTML5 Canvas for user interactions. **The website is under construction**.

For local development, consider turning off CORS by typing the following in the terminal:

`open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security`

*Note: This command above opens a Chrome window without CORS. Remember to close this window after development. Do not use it to browse unsecure websites (or any websites, just to be safe!).*

The web app is deployed [here (powered by GitHub Pages)](https://tonyfu97.github.io/rf_playground/)

Credit: This work is inspired by [elliotwaite's work](https://github.com/elliotwaite/pytorch-to-javascript-with-onnx-js)
