import { UniformFlow, SourceFlow, FreeVortex } from "./fields.js";

export class ElementListAdapter {
/**This class maintains an inventory of flow elements, their active status and their flow and positional properties and provides methods to add, modify and delete flow elements.
 * The plot() method can then be called to plot the modified flows. For this of course, this class's constructor requires the plotter function as the argument.
*/


  #elementsList = [];
  /* entries of this list should be a POJO of format: 
  {
   id: 0,
   active: true,
   element: ComplexField
  }
  */

  #plotterFunc = function plotData(
    elements,
    speedAtInfinity
  ) {};

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

    const uAtInfinity = this.#elementsList
      .filter((x) => x.active)
      ?.filter((x) => x.element instanceof UniformFlow)
      ?.reduce((accumulator, currentValue, idx, arr) => {
        return (
          accumulator +
          currentValue.element.U * Math.cos(currentValue.element.alpha)
        ); // return the accumulated x-velocity
      }, 0);
    const vAtInfinity = this.#elementsList
      .filter((x) => x.active)
      ?.filter((x) => x.element instanceof UniformFlow)
      ?.reduce((accumulator, currentValue, idx, arr) => {
        return (
          accumulator +
          currentValue.element.U * Math.sin(currentValue.element.alpha)
        ); // return the accumulated y-velocity
      }, 0);
    let speedAtInfinity = Math.hypot(uAtInfinity, vAtInfinity);
    if (speedAtInfinity == 0) speedAtInfinity = 1;
    // default to 1 if no uniform flow

    debugger;

    this.#plotterFunc(
      activeFields,
      speedAtInfinity
    );
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
}
