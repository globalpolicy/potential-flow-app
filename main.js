import { ElementListAdapter } from "./ElementListAdapter.js";
import { UniformFlow, SourceFlow, FreeVortex } from "./fields.js";

let firstTime = true; // global flag to switch from Plotly.newPlot() to .react()

const gpu = new GPU.GPU(); // instantiate GPU.js

let defaultElements = [
  new UniformFlow(2, 0),
  new SourceFlow(200, -10, 0),
  new SourceFlow(-200, 10, 0),
];

const elementListAdapter = new ElementListAdapter(plotDataWrapper);
elementListAdapter.add(defaultElements[0]);
elementListAdapter.add(defaultElements[1]);
elementListAdapter.add(defaultElements[2]);

// attach event handlers to all available field radio buttons
document
  .querySelectorAll("input[name='field-toggle']")
  .forEach((fieldRadioButton) => {
    fieldRadioButton.addEventListener("change", (event) => {
      if (event.target.checked) elementListAdapter.plot(); // trigger a plot of all active flow elements
    });
  });

// attach event handler to the chart area to add the selected flow element
const chartArea = document.getElementById("chart-area");
chartArea.on("plotly_click", function (data) {
  console.log(data);
  if (data.event.button == 0) {
    // left click
    let addElementCheckboxChecked =
      document.getElementById("add-element-chkbox").checked;
    if (addElementCheckboxChecked) {
      // adding elements is enabled
      if (document.getElementById("uniform-flow-radiobtn").checked) {
        addUniformFlow(); // add new uniform flow
      } else if (document.getElementById("source-flow-radiobtn").checked) {
        addSourceFlow(data.points[0].x, data.points[0].y); // add new source flow at the clicked location
      } else if (document.getElementById("free-vortex-radiobtn").checked) {
        addFreeVortex(data.points[0].x, data.points[0].y); // add new free vortex at the clicked location
      }
    }
  }
});

// attach event handler to all domain parameter textboxes to recalculate and redraw everything
document.querySelectorAll(".domain-param-textbox").forEach((el) => {
  el.addEventListener("change", (event) => {
    elementListAdapter.plot(); // trigger a recalculation/replot
  });
});

function addUniformFlow() {
  let U = Number(document.getElementById("uniform-flow-speed").value);
  let alpha = Number(document.getElementById("uniform-flow-alpha").value);

  elementListAdapter.add(new UniformFlow(U, alpha));
}

function addSourceFlow(x, y) {
  let q = Number(document.getElementById("source-flow-discharge").value);

  elementListAdapter.add(new SourceFlow(q, x, y));
}

function addFreeVortex(x, y) {
  let gamma = Number(document.getElementById("free-vortex-circulation").value);

  elementListAdapter.add(new FreeVortex(gamma, x, y));
}

function getFieldToPlot() {
  let fieldToPlot = "phi"; // default
  if (document.getElementById("field-stream-radiobtn").checked)
    fieldToPlot = "psi";
  else if (document.getElementById("field-velocity-radiobtn").checked)
    fieldToPlot = "v";
  else if (document.getElementById("field-cp-radiobtn").checked)
    fieldToPlot = "cp";
  return fieldToPlot;
}

function plotDataWrapper(elementsToPlot, speedAtInfinity) {
  const xStart = Number(document.getElementById("xStart").value);
  const yStart = Number(document.getElementById("yStart").value);
  const xEnd = Number(document.getElementById("xEnd").value);
  const yEnd = Number(document.getElementById("yEnd").value);
  const delX = Number(document.getElementById("delX").value);
  const delY = Number(document.getElementById("delY").value);

  plotData(
    getFieldToPlot(),
    elementsToPlot,
    speedAtInfinity,
    xStart,
    xEnd,
    yStart,
    yEnd,
    delX,
    delY
  );
}

function plotData(
  fieldType,
  elements,
  speedAtInfinity,
  xStart = -50,
  xEnd = 50,
  yStart = -50,
  yEnd = 50,
  delX = 0.1,
  delY = 0.1
) {
  let xRange = xEnd - xStart;
  let yRange = yEnd - yStart;

  // populate the x values array
  let xArray = new Array(xRange / delX);
  for (let i = 0; i < xArray.length; i++) {
    xArray[i] = xStart + i * delX;
  }

  // populate the y values array
  let yArray = new Array(yRange / delY);
  for (let i = 0; i < yArray.length; i++) {
    yArray[i] = yStart + i * delY;
  }

  // populate the field values array
  let fieldArray = new Array(yArray.length); // set the number of rows according to y's. this is the default expectation of plotly.js for z values.
  for (let i = 0; i < fieldArray.length; i++) {
    // run through all rows
    fieldArray[i] = new Array(xArray.length); // initialize an empty array the size of the x's
  }

  // calculate the field values
  let elementWiseFields = []; //list of fields for all the elements
  for (let k = 0; k < elements.length; k++) {
    let element = elements[k];

    for (let j = 0; j < yArray.length; j++) {
      for (let i = 0; i < xArray.length; i++) {
        let x = xArray[i];
        let y = yArray[j];

        let fieldValue = 0;
        if (fieldType == "phi") fieldValue = element.PhiAt(x, y);
        else if (fieldType == "psi") fieldValue = element.PsiAt(x, y);
        else if (fieldType == "v") {
          fieldValue = element.PhiAt(x, y);
          // this will need numerical differentiation and scatter plot for vector line segment calculations down the line
        } else if (fieldType == "cp") {
          fieldValue = element.PhiAt(x, y);
          // this will need numerical differentiation and magnitude calculation down the line
        }

        fieldArray[j][i] = fieldValue;
      }
    }
    elementWiseFields.push({
      element: element,
      field: structuredClone(fieldArray),
    }); // add the field for this element to elementWiseFields
  }

  // phase-unwrap the field for each element
  const DO_PHASE_UNWRAPPING = false;
  if (DO_PHASE_UNWRAPPING) {
    for (let k = 0; k < elementWiseFields.length; k++) {
      let element = elementWiseFields[k].element;
      let elementField = elementWiseFields[k].field;

      if (!element.NeedsPhaseUnwrapping()) continue;

      for (let j = 1; j < yArray.length - 1; j++) {
        for (let i = 1; i < xArray.length - 1; i++) {
          if (fieldType == "psi" && element instanceof SourceFlow) {
            let currentTheta = element.ThetaFromPsi(elementField[j][i]); // current grid's theta value
            let leftTheta = element.ThetaFromPsi(elementField[j][i - 1]); // left neighbor's theta
            let bottomTheta = element.ThetaFromPsi(elementField[j - 1][i]); // bottom neighbor's theta
            let topTheta = element.ThetaFromPsi(elementField[j + 1][i]);

            if (Math.abs(currentTheta - topTheta) > Math.PI) {
              elementField[j][i] = NaN;
            } else if (Math.abs(currentTheta - bottomTheta) > Math.PI) {
              elementField[j][i] = NaN;
            }
          } else if (fieldType == "phi" && element instanceof FreeVortex) {
            let currentTheta = element.ThetaFromPhi(elementField[j][i]); // current grid's theta value
            let leftTheta = element.ThetaFromPhi(elementField[j][i - 1]); // left neighbor's theta
            let bottomTheta = element.ThetaFromPhi(elementField[j - 1][i]); // bottom neighbor's theta
            let topTheta = element.ThetaFromPhi(elementField[j + 1][i]);

            if (Math.abs(currentTheta - topTheta) > Math.PI) {
              elementField[j][i] = NaN;
            } else if (Math.abs(currentTheta - bottomTheta) > Math.PI) {
              elementField[j][i] = NaN;
            }
          }
        }
      }
    }
  }

  // initialize the composite field array
  let compositeField = new Array(yArray.length); // set the number of rows according to y's. this is the default expectation of plotly.js for z values.
  for (let i = 0; i < compositeField.length; i++) {
    // run through all rows
    compositeField[i] = new Array(xArray.length); // initialize an empty array the size of the x's
  }

  // add up all the element wise fields to obtain the composite field
  for (let j = 0; j < yArray.length; j++) {
    for (let i = 0; i < xArray.length; i++) {
      compositeField[j][i] = 0;
      for (let k = 0; k < elementWiseFields.length; k++) {
        compositeField[j][i] += elementWiseFields[k].field[j][i];
      }
    }
  }

  // create velocity vectors as lines and markers
  const vectors = [];
  debugger;
  if (fieldType == "v" || fieldType == "cp") {
    const generateUField = gpu.createKernel(
      function (compositeField) {
        const u =
          (compositeField[this.thread.y][this.thread.x + 1] -
            compositeField[this.thread.y][this.thread.x]) /
          this.constants.delX;
        const v =
          (compositeField[this.thread.y + 1][this.thread.x] -
            compositeField[this.thread.y][this.thread.x]) /
          this.constants.delY;

        const vectorLength = 1;
        const uCap = u / Math.sqrt(u * u + v * v);

        const x0 =
          this.constants.xArray[this.thread.x] - (uCap * vectorLength) / 2;

        const x1 =
          this.constants.xArray[this.thread.x] + (uCap * vectorLength) / 2;

        return u;
      },
      {
        constants: { xArray: xArray, delX: delX, delY: delY },
        output: [xArray.length - 1, yArray.length - 1], // output is a 2D array [width, height] for u-velocities at all nodal points of the XY grid
      }
    );
    const generateVField = gpu.createKernel(
      function (compositeField) {
        const u =
          (compositeField[this.thread.y][this.thread.x + 1] -
            compositeField[this.thread.y][this.thread.x]) /
          this.constants.delX;
        const v =
          (compositeField[this.thread.y + 1][this.thread.x] -
            compositeField[this.thread.y][this.thread.x]) /
          this.constants.delY;

        const vectorLength = 1;
        const vCap = v / Math.sqrt(u * u + v * v);

        const y0 =
          this.constants.yArray[this.thread.y] - (vCap * vectorLength) / 2;

        const y1 =
          this.constants.yArray[this.thread.y] + (vCap * vectorLength) / 2;

        return v;
      },
      {
        constants: { yArray: yArray, delX: delX, delY: delY },
        output: [xArray.length - 1, yArray.length - 1], // output is a 2D [width, height] array for u-velocities at all nodal points of the XY grid
      }
    );

    const uField = generateUField(compositeField); // [row#][col#] from -ve to 0 to +ve
    const vField = generateVField(compositeField); // [row#][col#] from -ve to 0 to +ve

    if (fieldType == "v") {
      // generate the line segments for velocity vectors
      const generateXYTuplesForVelField = gpu.createKernel(
        function (uField, vField) {
          // convert flat 1D index to row and column indices to extract relevant elements from the u and vField 2D arrays
          const rowIndex = Math.floor(
            this.thread.x / this.constants.xArrayLength
          );
          const colIndex = this.thread.x % this.constants.xArrayLength;

          const u = uField[rowIndex][colIndex];
          const v = vField[rowIndex][colIndex];

          const vectorLength = 1;
          const uCap = u / Math.sqrt(u * u + v * v);
          const vCap = v / Math.sqrt(u * u + v * v);

          const x0 =
            this.constants.xArray[colIndex] - (uCap * vectorLength) / 2;
          const x1 =
            this.constants.xArray[colIndex] + (uCap * vectorLength) / 2;

          const y0 =
            this.constants.yArray[rowIndex] - (vCap * vectorLength) / 2;
          const y1 =
            this.constants.yArray[rowIndex] + (vCap * vectorLength) / 2;

          return [x0, x1, y0, y1];
        },
        {
          constants: {
            yArray: yArray,
            xArray: xArray,
            xArrayLength: xArray.length,
          },
          output: [(xArray.length - 1) * (yArray.length - 1)], // output is a 1D array of tuples (x0, x1, y0, y1) for each nodal point, x0,y0 and x1,y1 being the start and end of the vector line resp.
        }
      );

      let xyTuplesForVelField = generateXYTuplesForVelField(uField, vField);
      let sampledXYtuples = sampleWithoutReplacement(xyTuplesForVelField, 2000);

      let xs = flattenArrayForXs(sampledXYtuples);
      let ys = flattenArrayForYs(sampledXYtuples);

      // intended to convert [[1,2,5,2],[2,3,5,6]] to [1,2,null,2,3,null]. null is added for gap between consecutive vectors when plotting lines as a scatterplot
      function flattenArrayForXs(notFlatArray) {
        const retval = [];
        for (let i = 0; i < notFlatArray.length; i++) {
          let arrayElement = notFlatArray[i];
          retval.push(arrayElement[0], arrayElement[1], null);
        }
        return retval;
      }

      // intended to convert [[1,2,5,2],[2,3,5,6]] to [5,2,null,5,6,null]. null is added for gap between consecutive vectors when plotting lines as a scatterplot
      function flattenArrayForYs(notFlatArray) {
        const retval = [];
        for (let i = 0; i < notFlatArray.length; i++) {
          let arrayElement = notFlatArray[i];
          retval.push(arrayElement[2], arrayElement[3], null);
        }
        return retval;
      }

      function sampleWithoutReplacement(arr, k) {
        const result = [];
        const n = arr.length;

        for (let i = 0; i < k; i++) {
          const r = Math.floor(Math.random() * n);
          result.push(arr[r]);
        }
        return result;
      }

      // line segments for vector
      vectors.push({
        type: "scattergl",
        mode: "lines",
        x: xs,
        y: ys,
        line: { width: 1, color: "black" },
        showlegend: false,
        hoverinfo: "none",
        visible: fieldType == "v",
      });

      // arrowheads at the end of line segments
      let arrowXs = [],
        arrowYs = [],
        arrowAngles = [];
      for (let i = 1; i < xs.length; i += 3) {
        // start from 1 because the first is the start locations of the vectors
        // should be the same length as ys
        arrowXs.push(xs[i]);
        arrowYs.push(ys[i]);
        arrowAngles.push(
          -(Math.atan2(ys[i] - ys[i - 1], xs[i] - xs[i - 1]) / Math.PI) * 180
        ); // this, along with "arrow-right" and angleref:"previous" combo took half a day to figure out!
      }
      vectors.push({
        type: "scattergl",
        mode: "markers",
        x: arrowXs,
        y: arrowYs,
        line: { width: 0.5, color: "black" },
        marker: {
          symbol: "arrow-right",
          angleref: "previous",
          angle: arrowAngles,
          size: 4,
        },
        showlegend: false,
        hoverinfo: "none",
        visible: fieldType == "v",
      });
    } else if (fieldType == "cp") {
      // generate the pressure coefficient for each nodal point
      const generateCpField = gpu.createKernel(
        function (uField, vField, U_inf) {
          const speedSquared =
            Math.pow(uField[this.thread.y][this.thread.x], 2) +
            Math.pow(vField[this.thread.y][this.thread.x], 2);
          let cp = 1 - speedSquared / Math.pow(U_inf, 2);
          if (Math.abs(cp) > 100) {
            cp = 1 / 0; // proxy for NaN which we won't plot. can't directly return NaN
          }
          return cp;
        },
        {
          constants: {},
          output: [uField[0].length, uField.length], // vField also possible to use instead of uField since they should have the same span over the whole domain
        }
      );

      const cpField = generateCpField(uField, vField, speedAtInfinity); // 2D array [rows][columns]

      // overwrite compositeField from phi to the just calculated Cp values, except at the right and top boundaries since we don't have speed (nor Cp) values there
      for (let j = 0; j < compositeField.length - 1; j++) {
        // row positions
        for (let i = 0; i < compositeField[0].length - 1; i++) {
          // column positions
          compositeField[j][i] = cpField[j][i];
        }
      }

      // overwrite the last x and y boundary values with the penultimate ones
      for (let i = 0; i < compositeField[0].length; i++) {
        compositeField[compositeField.length - 1][i] =
          compositeField[compositeField.length - 2][i]; // replace the last row with the penultimate row
      }
      for (let j = 0; j < compositeField.length; j++) {
        compositeField[j][compositeField[0].length - 1] =
          compositeField[j][compositeField[0].length - 2]; // replace the last column with the penultimate column
      }
    }
  }

  let data;
  if (fieldType == "cp") {
    data = [
      {
        z: compositeField,
        x: xArray,
        y: yArray,
        type: "contour",

        contours: {
          start: -100,
          // size: 10,
          end: 1,
          // showlines: true,
          coloring: "heatmap",
        },
        line: { width: 0 },
        autocontour: true,

        opacity: 1.0,
        showscale: true,

        connectgaps: false,
      },
    ];
  } else {
    data = [
      {
        z: compositeField,
        x: xArray,
        y: yArray,
        type: "contour",

        contours: {
          start: -30,
          size: 10,
          end: 30,
          //showlines: false,
          coloring: "heatmap",
        },

        autocontour: true,
        ncontours: 50,
        opacity: 1.0,
        showscale: true,
        // line: {
        //   dash: "solid",
        // },
        connectgaps: false,
        visible: fieldType != "v",
      },
      ...vectors,
    ];
  }

  const selectedField =
    fieldType == "phi"
      ? "Potential"
      : fieldType == "psi"
      ? "Streamfunction"
      : fieldType == "v"
      ? "Velocity"
      : "Pressure";
  var layout = {
    title: {
      text: `${selectedField} field`,
    },
    font: { size: 18 },
  };

  var config = { responsive: true };

  if (firstTime) {
    Plotly.newPlot("chart-area", data, layout, config);
    firstTime = false;
  } else {
    Plotly.react("chart-area", data, layout, config);
  }
}
