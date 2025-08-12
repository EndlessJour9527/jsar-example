/**
 * ES6 Module version of m4.js
 * This file re-exports the functions from the original m4.js
 */

// Import the original m4.js script (it sets global m4)
import '../resources/m4.js';

// Access the global m4 object
const m4Original = globalThis.m4 || window.m4;

// Re-export all functions and properties
export const add = m4Original.add;
export const addVectors = m4Original.addVectors;
export const axisRotate = m4Original.axisRotate;
export const axisRotation = m4Original.axisRotation;
export const copy = m4Original.copy;
export const cross = m4Original.cross;
export const distance = m4Original.distance;
export const distanceSq = m4Original.distanceSq;
export const dot = m4Original.dot;
export const frustum = m4Original.frustum;
export const getAxis = m4Original.getAxis;
export const getTranslation = m4Original.getTranslation;
export const identity = m4Original.identity;
export const inverse = m4Original.inverse;
export const length = m4Original.length;
export const lengthSq = m4Original.lengthSq;
export const lerp = m4Original.lerp;
export const lookAt = m4Original.lookAt;
export const multiply = m4Original.multiply;
export const negate = m4Original.negate;
export const normalize = m4Original.normalize;
export const orthographic = m4Original.orthographic;
export const perspective = m4Original.perspective;
export const rotateX = m4Original.rotateX;
export const rotateY = m4Original.rotateY;
export const rotateZ = m4Original.rotateZ;
export const rotationX = m4Original.rotationX;
export const rotationY = m4Original.rotationY;
export const rotationZ = m4Original.rotationZ;
export const scale = m4Original.scale;
export const scaling = m4Original.scaling;
export const setAxis = m4Original.setAxis;
export const setDefaultType = m4Original.setDefaultType;
export const setTranslation = m4Original.setTranslation;
export const subtract = m4Original.subtract;
export const subtractVectors = m4Original.subtractVectors;
export const transformDirection = m4Original.transformDirection;
export const transformNormal = m4Original.transformNormal;
export const transformPoint = m4Original.transformPoint;
export const translate = m4Original.translate;
export const translation = m4Original.translation;
export const transpose = m4Original.transpose;
export const xRotate = m4Original.xRotate;
export const xRotation = m4Original.xRotation;
export const yRotate = m4Original.yRotate;
export const yRotation = m4Original.yRotation;
export const zRotate = m4Original.zRotate;
export const zRotation = m4Original.zRotation;

// Also export the entire object as default
export default m4Original;