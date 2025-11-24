let firstTime = true; // global flag to switch from Plotly.newPlot() to .react()

const gpu = new GPU.GPU(); // instantiate GPU.js

let defaultElements = [
  new UniformFlow(2, 0),
  new SourceFlow(200, -10, 0),
  new SourceFlow(-200, 10, 0),
];

class ElementListAdapter {
  #elementsList = [];
  /* entries of this list should be a POJO of format: 
  {
   id: 0,
   active: true,
   element: ComplexField
  }
  */

  #plotterFunc = function plotData(fieldType, elements) {};

  constructor(plotterFunc) {
    this.#elementsList = [];
    this.#plotterFunc = plotterFunc;
  }

  add(newElement) {
    let existingLargestId =
      this.#elementsList.length > 0
        ? this.#elementsList[this.#elementsList.length - 1].id
        : -1;

    let newElementObj = {
      id: existingLargestId + 1,
      active: true,
      element: newElement,
    };
    this.#elementsList.push(newElementObj);

    this.#addEntryToHtmlElementsList(newElementObj);

    this.#plotActiveFields();
  }

  plot() {
    this.#plotActiveFields();
  }

  #plotActiveFields() {
    const activeFields = this.#elementsList
      .filter((x) => x.active)
      .map((x) => x.element);
    debugger;
    this.#plotterFunc(this.#getFieldToPlot(), activeFields);
  }

  #addEntryToHtmlElementsList(newElementObj) {
    /*
    newElementObj will be a POJO of type
    {
      id: 1,
      active: true,
      element: ComplexField,
    }
    */

    let uniformFlowListItemTemplate = `
    <div class="control-panel-flow-element" id="element-list-item-${
      newElementObj.id
    }">
              <div class="element-list-item">
                <div style="display: flex">
                  <input
                    type="checkbox"
                    id="element-list-item-checkbox-${newElementObj.id}"
                    value="uniform-flow"
                    ${newElementObj.active ? "checked" : ""}
                  />
                  <label for="element-list-uniform-flow-checkbox-${
                    newElementObj.id
                  }"
                    >Uniform flow</label
                  >

                  <div style="margin-left: auto; padding-right: 2px">
                    <button id="btn-del-${newElementObj.id}">Del</button>
                  </div>
                </div>

                <div class="element-property">
                  <label for="element-list-uniform-flow-speed-${
                    newElementObj.id
                  }">U</label>
                  <input
                    type="number"
                    id="element-list-uniform-flow-speed-${newElementObj.id}"
                    class="element-list-item-property-textbox"
                    value="${newElementObj.element.U}"
                  />
                </div>
                <div class="element-property">
                  <label for="element-list-uniform-flow-alpha-${
                    newElementObj.id
                  }">α</label>
                  <input
                    type="number"
                    id="element-list-uniform-flow-alpha-${newElementObj.id}"
                    class="element-list-item-property-textbox"
                    value="${newElementObj.element.alpha}"
                  />
                </div>
              </div>
            </div>
    `;

    let sourceFlowListItemTemplate = `
    <div class="control-panel-flow-element" id="element-list-item-${
      newElementObj.id
    }">
              <div class="element-list-item">
                <div style="display: flex">
                  <input
                    type="checkbox"
                    id="element-list-item-checkbox-${newElementObj.id}"
                    value="source-flow"
                    ${newElementObj.active ? "checked" : ""}
                  />
                  <label for="element-list-item-checkbox-${newElementObj.id}"
                    >Source flow</label
                  >

                  <div style="margin-left: auto; padding-right: 2px">
                    <button id="btn-del-${newElementObj.id}">Del</button>
                  </div>
                </div>

                <div class="element-property">
                  <label for="element-list-source-flow-discharge-${
                    newElementObj.id
                  }">q</label>
                  <input
                    type="number"
                    id="element-list-source-flow-discharge-${newElementObj.id}"
                    class="element-list-item-property-textbox"
                    value="${newElementObj.element.q}"
                  />
                </div>

                <div class="element-property">
                  <label for="element-list-item-x-${newElementObj.id}">x</label>
                  <input
                    type="number"
                    id="element-list-item-x-${newElementObj.id}"
                    value="${newElementObj.element.x0}"
                  />
                </div>
                <div class="element-property">
                  <label for="element-list-item-y-${newElementObj.id}">y</label>
                  <input
                    type="number"
                    id="element-list-item-y-${newElementObj.id}"
                    value="${newElementObj.element.y0}"
                  />
                </div>
              </div>
            </div>
    `;

    let freeVortexListItemTemplate = `
    <div class="control-panel-flow-element" id="element-list-item-${
      newElementObj.id
    }">
              <div class="element-list-item">
                <div style="display: flex">
                  <input
                    type="checkbox"
                    id="element-list-item-checkbox-${newElementObj.id}"
                    ${newElementObj.active ? "checked" : ""}
                  />
                  <label for="element-list-item-checkbox-${newElementObj.id}"
                    >Free vortex</label
                  >

                  <div style="margin-left: auto; padding-right: 2px">
                    <button id="btn-del-${newElementObj.id}">Del</button>
                  </div>
                </div>

                <div class="element-property">
                  <label for="element-list-item-free-vortex-circulation-${
                    newElementObj.id
                  }">Γ</label>
                  <input
                    type="number"
                    id="element-list-item-free-vortex-circulation-${
                      newElementObj.id
                    }"
                    class="element-list-item-property-textbox"
                    value="${newElementObj.element.gamma}"
                  />
                </div>

                <div class="element-property">
                  <label for="element-list-item-x-${newElementObj.id}">x</label>
                  <input
                    type="number"
                    id="element-list-item-x-${newElementObj.id}"
                    value="${newElementObj.element.x0}"
                  />
                </div>
                <div class="element-property">
                  <label for="element-list-item-y-${newElementObj.id}">y</label>
                  <input
                    type="number"
                    id="element-list-item-y-${newElementObj.id}"
                    value="${newElementObj.element.y0}"
                  />
                </div>
              </div>
            </div>
    `;

    let htmlTemplateStringToAdd = "";
    if (newElementObj.element instanceof UniformFlow) {
      htmlTemplateStringToAdd = uniformFlowListItemTemplate;
    } else if (newElementObj.element instanceof SourceFlow) {
      htmlTemplateStringToAdd = sourceFlowListItemTemplate;
    } else if (newElementObj.element instanceof FreeVortex) {
      htmlTemplateStringToAdd = freeVortexListItemTemplate;
    }

    // insert the flow element to the control panel list of elements
    const elementListContainer = document.getElementById(
      "control-panel-flow-elements-list-content"
    );
    elementListContainer.insertAdjacentHTML(
      "beforeend",
      htmlTemplateStringToAdd
    );

    // attach event handler to the "Active" checkbox of the element listitem
    elementListContainer
      .querySelector(`#element-list-item-checkbox-${newElementObj.id}`)
      .addEventListener("change", (e) =>
        this.#elementListItemActivityCheckboxValueChanged(e)
      );

    // attach event handler to the "Delete" button of the element listitem
    elementListContainer
      .querySelector(`#btn-del-${newElementObj.id}`)
      .addEventListener("click", (e) => this.#elementListItemDeleteClicked(e));

    // attach event handler to the x,y parameter textboxes of the element listitem
    elementListContainer
      .querySelector(`#element-list-item-x-${newElementObj.id}`)
      ?.addEventListener("change", (e) => this.#elementListItemXChanged(e));
    elementListContainer
      .querySelector(`#element-list-item-y-${newElementObj.id}`)
      ?.addEventListener("change", (e) => this.#elementListItemYChanged(e));

    // attach event handler to the unique parameter (U, alpha, q, gamma) textboxes of the element listitem
    elementListContainer
      .querySelectorAll(".element-list-item-property-textbox")
      .forEach((x) => {
        x.addEventListener("change", (e) => {
          this.#elementListItemPropertyChanged(e);
        });
      });
  }

  #elementListItemPropertyChanged(event) {
    // event handler for when any element's unique property (U, alpha, q, gamma) textbox is changed
    const idInterHypenTokens = event.target.id.split("-");
    const id = Number(
      idInterHypenTokens[idInterHypenTokens.length - 1] // final token
    );

    const dataElement = this.#elementsList.filter((x) => x.id == id)[0].element;

    const value = event.target.value;
    const targetHtmlId = event.target.id;

    if (dataElement instanceof FreeVortex) dataElement.gamma = Number(value);
    else if (dataElement instanceof SourceFlow) dataElement.q = Number(value);
    else if (dataElement instanceof UniformFlow) {
      if (targetHtmlId.includes("alpha")) dataElement.alpha = Number(value);
      else if (targetHtmlId.includes("speed")) dataElement.U = Number(value);
    }
    this.#plotActiveFields();
  }

  #elementListItemXChanged(event) {
    // event handler for when any element's X parameter textbox content is changed
    const id = Number(event.target.id.replace("element-list-item-x-", ""));
    this.#setElementXParam(id, event.target.value);
    this.#plotActiveFields();
  }

  #elementListItemYChanged(event) {
    // event handler for when any element's Y parameter textbox content is changed
    const id = Number(event.target.id.replace("element-list-item-y-", ""));
    this.#setElementYParam(id, event.target.value);
    this.#plotActiveFields();
  }

  #elementListItemActivityCheckboxValueChanged(event) {
    // event handler for when any element's "Active" checkbox's checked state is changed
    const id = Number(
      event.target.id.replace("element-list-item-checkbox-", "")
    );
    this.#setElementActiveState(id, event.target.checked);
    this.#plotActiveFields();
  }

  #setElementActiveState(id, activeState) {
    // updates the internal elements list and redraw the correct field with active elements
    for (let i = 0; i < this.#elementsList.length; i++) {
      const elementObj = this.#elementsList[i];
      if (elementObj.id == id) {
        elementObj.active = activeState;
        break;
      }
    }
  }

  #setElementXParam(id, x) {
    // updates the internal elements list and redraw the correct field with active elements
    for (let i = 0; i < this.#elementsList.length; i++) {
      const elementObj = this.#elementsList[i];
      if (elementObj.id == id) {
        elementObj.element.x0 = x;
        break;
      }
    }
  }

  #setElementYParam(id, y) {
    // updates the internal elements list and redraw the correct field with active elements
    for (let i = 0; i < this.#elementsList.length; i++) {
      const elementObj = this.#elementsList[i];
      if (elementObj.id == id) {
        elementObj.element.y0 = y;
        break;
      }
    }
  }

  #elementListItemDeleteClicked(event) {
    // event handler for when any element's "Delete" button is clicked
    const id = Number(event.target.id.replace("btn-del-", ""));
    this.#deleteElement(id);
    this.#plotActiveFields();
  }

  #deleteElement(id) {
    // deletes the element with the specified id from the internal elements list
    const elementIndex = this.#elementsList.findIndex((x) => x.id == id);
    this.#elementsList.splice(elementIndex, 1);

    // deletes the DOM node as well
    const elementDiv = document.getElementById(`element-list-item-${id}`);
    elementDiv.remove();
  }

  #getFieldToPlot() {
    let fieldToPlot = "phi"; // default
    if (document.getElementById("field-stream-radiobtn").checked)
      fieldToPlot = "psi";
    else if (document.getElementById("field-velocity-radiobtn").checked)
      fieldToPlot = "v";
    else if (document.getElementById("field-cp-radiobtn").checked)
      fieldToPlot = "cp";
    return fieldToPlot;
  }
}

const elementListAdapter = new ElementListAdapter(plotData);
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

function plotData(fieldType, elements) {
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
          // this will need numerical differentiation down the line
        } else if (fieldType == "cp") {
          fieldValue = element.PhiAt(x, y);
          // TODO: further modify fieldValue for pressure coefficient calc.
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
  if (fieldType == "v") {
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
        output: [xArray.length - 1, yArray.length - 1], // output is a 2D array for u-velocities at all nodal points of the XY grid
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
        output: [xArray.length - 1, yArray.length - 1], // output is a 2D array for u-velocities at all nodal points of the XY grid
      }
    );

    const uField = generateUField(compositeField); // [row#][col#] from -ve to 0 to +ve
    const vField = generateVField(compositeField); // [row#][col#] from -ve to 0 to +ve

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

        const x0 = this.constants.xArray[colIndex] - (uCap * vectorLength) / 2;
        const x1 = this.constants.xArray[colIndex] + (uCap * vectorLength) / 2;

        const y0 = this.constants.yArray[rowIndex] - (vCap * vectorLength) / 2;
        const y1 = this.constants.yArray[rowIndex] + (vCap * vectorLength) / 2;

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

    // let xs = [], // start_x1, end_x1, start_x2, end_x2, ...
    //   ys = []; // start_y1, end_y1, start_y2, end_y2, ...
    // for (let i = 0; i < xArray.length - 1; i += xArray.length / 50) {
    //   // we want some sparsity here so that the line segments don't start overlapping, hence the large increments
    //   for (let j = 0; j < yArray.length - 1; j += yArray.length / 50) {
    //     const u = (compositeField[j][i + 1] - compositeField[j][i]) / delX;
    //     const v = (compositeField[j + 1][i] - compositeField[j][i]) / delY;

    //     const vectorLength = 1;
    //     const uCap = u / Math.sqrt(u * u + v * v);
    //     const vCap = v / Math.sqrt(u * u + v * v);

    //     const x0 = xArray[i] - (uCap * vectorLength) / 2;
    //     const y0 = yArray[j] - (vCap * vectorLength) / 2;

    //     const x1 = xArray[i] + (uCap * vectorLength) / 2;
    //     const y1 = yArray[j] + (vCap * vectorLength) / 2;

    //     xs.push(x0, x1, null);
    //     ys.push(y0, y1, null);
    //   }
    // }

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
