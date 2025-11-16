/**
 * This file contains the classes different elementary flows.
 */

"use strict";

class ComplexField {
  PhiAt(x, y) {}
  PsiAt(x, y) {}
  NeedsPhaseUnwrapping() {}
  FullArcTan(delY, delX) {
    // returns angle from 0 to 2PI (ACW positive)
    let theta = Math.atan2(delY, delX);

    if (theta < 0) {
      theta += Math.PI * 2;
    }
    return theta;
  }
}

class UniformFlow extends ComplexField {
  #U = 0;
  #alpha = 0;

  constructor(U, alpha) {
    super();
    this.#U = U;
    this.#alpha = alpha;
  }

  PhiAt(x, y) {
    return this.#U * (x * Math.cos(this.#alpha) + y * Math.sin(this.#alpha));
  }

  PsiAt(x, y) {
    return this.#U * (y * Math.cos(this.#alpha) - x * Math.sin(this.#alpha));
  }

  NeedsPhaseUnwrapping() {
    return false;
  }
}

class SourceFlow extends ComplexField {
  #q = 0;
  #x0 = 0;
  #y0 = 0;

  constructor(q, x0, y0) {
    super();
    this.#q = q;
    this.#x0 = x0;
    this.#y0 = y0;
  }

  PhiAt(x, y) {
    let delX = x - this.#x0;
    let delY = y - this.#y0;
    let r = Math.sqrt(delX * delX + delY * delY);

    return (this.#q / (2 * 3.14)) * Math.log(r);
  }

  PsiAt(x, y) {
    let delX = x - this.#x0;
    let delY = y - this.#y0;
    let r = Math.sqrt(delX * delX + delY * delY);
    let theta = super.FullArcTan(delY, delX); //Math.atan2(delY, delX);

    return (this.#q / (2 * 3.14)) * theta;
  }

  ThetaFromPsi(psi) {
    return (psi * (2 * 3.14)) / this.#q;
  }

  PsiFromTheta(theta) {
    return (this.#q / (2 * 3.14)) * theta;
  }

  NeedsPhaseUnwrapping() {
    return true;
  }
}

class FreeVortex extends ComplexField {
  #gamma = 0;
  #x0 = 0;
  #y0 = 0;

  constructor(gamma, x0, y0) {
    super();
    this.#gamma = gamma;
    this.#x0 = x0;
    this.#y0 = y0;
  }

  PhiAt(x, y) {
    let delX = x - this.#x0;
    let delY = y - this.#y0;
    let theta = super.FullArcTan(delY, delX); // Math.atan2(delY, delX);

    return (this.#gamma / (2 * 3.14)) * theta;
  }

  PsiAt(x, y) {
    let delX = x - this.#x0;
    let delY = y - this.#y0;
    let r = Math.sqrt(delX * delX + delY * delY);

    return (-this.#gamma / (2 * 3.14)) * Math.log(r);
  }

  ThetaFromPhi(phi) {
    return (Math.PI * 2 * phi) / this.#gamma;
  }

  PhiFromTheta(theta) {
    return (this.#gamma * theta) / (2 * Math.PI);
  }

  NeedsPhaseUnwrapping() {
    return true;
  }
}
