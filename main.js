let firstTime = true; // global flag to switch from Plotly.newPlot() to .react()

let elements = [
  new UniformFlow(2, 0),
  new SourceFlow(200, -10, 0),
  new SourceFlow(-200, 10, 0),
];

plotData(getFieldToPlot());

document
  .querySelectorAll("input[name='field-toggle']")
  .forEach((fieldRadioButton) => {
    fieldRadioButton.addEventListener("change", (event) => {
      if (event.target.checked) plotData(getFieldToPlot());
    });
  });

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

    plotData(getFieldToPlot()); // plot the elements anew
  }
});

function addUniformFlow() {
  let U = Number(document.getElementById("uniform-flow-speed").value);
  let alpha = Number(document.getElementById("uniform-flow-alpha").value);
  elements.push(new UniformFlow(U, alpha));
}

function addSourceFlow(x, y) {
  let q = Number(document.getElementById("source-flow-discharge").value);
  elements.push(new SourceFlow(q, x, y));
}

function addFreeVortex(x, y) {
  let gamma = Number(document.getElementById("free-vortex-circulation").value);
  elements.push(new FreeVortex(gamma, x, y));
}

function plotData(fieldType) {
  let xStart = -50;
  let xEnd = 50;

  let yStart = -50;
  let yEnd = 50;

  let delX = 0.1;
  let delY = 0.1;

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
    for (let j = 0; j < yArray.length; j++) {
      for (let i = 0; i < xArray.length; i++) {
        let x = xArray[i];
        let y = yArray[j];

        let fieldValue = 0;
        if (fieldType == "phi") fieldValue = elements[k].PhiAt(x, y);
        else if (fieldType == "psi") fieldValue = elements[k].PsiAt(x, y);
        else if (fieldType == "v") {
          fieldValue = elements[k].PhiAt(x, y);
          // this will need numerical differentiation down the line
        } else if (fieldType == "cp") {
          fieldValue = elements[k].PhiAt(x, y);
          // TODO: further modify fieldValue for pressure coefficient calc.
        }

        fieldArray[j][i] = fieldValue;
      }
    }
    elementWiseFields.push({
      element: elements[k],
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
  if (fieldType == "v") {
    let xs = [], // start_x1, end_x1, start_x2, end_x2, ...
      ys = []; // start_y1, end_y1, start_y2, end_y2, ...
    for (let i = 0; i < xArray.length - 1; i += xArray.length / 50) { // we want some sparsity here so that the line segments don't start overlapping, hence the large increments
      for (let j = 0; j < yArray.length - 1; j += yArray.length / 50) {
        const u = (compositeField[j][i + 1] - compositeField[j][i]) / delX;
        const v = (compositeField[j + 1][i] - compositeField[j][i]) / delY;

        const vectorLength = 1;
        const uCap = u / Math.sqrt(u * u + v * v);
        const vCap = v / Math.sqrt(u * u + v * v);

        const x0 = xArray[i] - (uCap * vectorLength) / 2;
        const y0 = yArray[j] - (vCap * vectorLength) / 2;

        const x1 = xArray[i] + (uCap * vectorLength) / 2;
        const y1 = yArray[j] + (vCap * vectorLength) / 2;

        xs.push(x0, x1, null);
        ys.push(y0, y1, null);
      }
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
      // arrowAngles.push(
      //   -(
      //     90 -
      //     (Math.atan2(ys[i] - ys[i - 1], xs[i] - xs[i - 1]) / Math.PI) * 180
      //   )
      // );
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
  }

  let data = [
    {
      z: compositeField,
      x: xArray,
      y: yArray,
      type: "contour",
      //          autocontour:"true",
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
