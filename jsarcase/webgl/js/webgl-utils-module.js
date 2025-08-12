/**
 * ES6 Module version of webgl-utils.js
 * This file re-exports the functions from the original webgl-utils.js
 */

// Import the original webgl-utils.js script (it sets global webglUtils)
import '../resources/webgl-utils.js';

// Access the global webglUtils object
const webglUtilsOriginal = globalThis.webglUtils || window.webglUtils;

// Re-export all functions individually
export const createAugmentedTypedArray = webglUtilsOriginal.createAugmentedTypedArray;
export const createAttribsFromArrays = webglUtilsOriginal.createAttribsFromArrays;
export const createBuffersFromArrays = webglUtilsOriginal.createBuffersFromArrays;
export const createBufferInfoFromArrays = webglUtilsOriginal.createBufferInfoFromArrays;
export const createAttributeSetters = webglUtilsOriginal.createAttributeSetters;
export const createProgram = webglUtilsOriginal.createProgram;
export const createProgramFromScripts = webglUtilsOriginal.createProgramFromScripts;
export const createProgramFromSources = webglUtilsOriginal.createProgramFromSources;
export const createProgramInfo = webglUtilsOriginal.createProgramInfo;
export const createUniformSetters = webglUtilsOriginal.createUniformSetters;
export const createVAOAndSetAttributes = webglUtilsOriginal.createVAOAndSetAttributes;
export const createVAOFromBufferInfo = webglUtilsOriginal.createVAOFromBufferInfo;
export const drawBufferInfo = webglUtilsOriginal.drawBufferInfo;
export const drawObjectList = webglUtilsOriginal.drawObjectList;
export const glEnumToString = webglUtilsOriginal.glEnumToString;
export const getExtensionWithKnownPrefixes = webglUtilsOriginal.getExtensionWithKnownPrefixes;
export const resizeCanvasToDisplaySize = webglUtilsOriginal.resizeCanvasToDisplaySize;
export const setAttributes = webglUtilsOriginal.setAttributes;
export const setBuffersAndAttributes = webglUtilsOriginal.setBuffersAndAttributes;
export const setUniforms = webglUtilsOriginal.setUniforms;

// Also export the entire object as default
export default webglUtilsOriginal;