
<h1> <span style="color:#013C4D;">About</span> <span style="color:#2B7F84;">Knfs ALB</span></h1>

### A simple application load balancer (ALB) for Node.js

This package implements a simple application load balancer (ALB) using Node.js's `cluster` module. It helps distribute incoming requests across multiple worker processes while maintaining configurable settings for minimum, maximum, and idle time for workers. This is ideal for scaling applications on multi-core systems.

---

## Install

To install the package, use either `npm` or `yarn`:

```bash
npm i @knfs-tech/alb
# or
yarn add @knfs-tech/alb
```

## Usage
You can integrate the ALB into your Node.js app by following the example below:

```javascript
const express = require("express");
const app = express();

const alb = require("@knfs-tech/alb");
const port = 3000;

// Define a simple route
app.get('/', (req, res) => {
  process.send({ type: 'request_handled' });
  console.log(`${process.pid}`);
  res.send(`Handled by worker ${process.pid}`);
});

// Run the app
const runApp = () => {
  app.listen(port, () => {
    console.log("App is running on port 3000");
  });
};

// Start the ALB with your app and configuration
alb(runApp, {
  max: 4, // Maximum number of worker processes
  min: 2  // Minimum number of worker processes
});
```

This code sets up a load balancer with the specified configurations. The alb module will manage the worker processes and ensure that the application is efficiently scaled across multiple CPU cores.

## Configuration
You can customize the following options in the configuration object:

- **max**: Maximum number of worker processes (default: number of CPU cores available).
- **min**: Minimum number of worker processes to maintain (default: 2).
- **idleTime**: Maximum idle time (in milliseconds) for a worker before it is terminated (default: 30,000ms).
- **log**: <boolean> Log when run

## Author
* [Kent Phung](https://github.com/khapu2906)
  
## Owner
* [Knfs.,jsc](https://github.com/knfs-library)

## More

## License

Bamimi is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
