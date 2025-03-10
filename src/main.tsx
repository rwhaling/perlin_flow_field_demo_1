import p5 from "p5";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createSketch, numericParameterDefs, initParameterStore, ParameterStore } from "./sketch";
import { createSketch as createCrimsonSketch, numericParameterDefs as crimsonNumericParameterDefs, initParameterStore as initCrimsonParameterStore } from "./crimsonSketch";

// Define sketch types for organization
type SketchType = "default" | "crimson";

// Create a map of sketch configurations
const sketchConfigs = {
  default: {
    name: "Blue Flow Field",
    createSketch,
    parameterDefs: numericParameterDefs,
    initStore: initParameterStore
  },
  crimson: {
    name: "Crimson Flow Field",
    createSketch: createCrimsonSketch,
    parameterDefs: crimsonNumericParameterDefs,
    initStore: initCrimsonParameterStore
  }
};

// Create initial parameter store
let parameterStore = initParameterStore();
let p5Instance: p5;

// Entrypoint code
function main(rootElement: HTMLElement) {
  // Create a p5 instance in instance mode
  p5Instance = new p5(createSketch(parameterStore), rootElement);
}

const rootEl = document.getElementById("p5-root");
if (!rootEl) {
  throw new Error("Cannot find element root #p5-root");
}
main(rootEl);

function TestApp() {
  // State for both the current sketch type and parameters
  const [sketchType, setSketchType] = useState<SketchType>("default");
  const [numericParameters, setNumericParameters] = useState(initParameterStore());

  // Effect to handle sketch changes
  useEffect(() => {
    // Get the config for the selected sketch
    const config = sketchConfigs[sketchType];
    
    // Initialize new parameters based on the selected sketch
    const newParams = config.initStore();
    
    // Update state with new parameters
    setNumericParameters(newParams);
    
    // Update the global parameter store
    parameterStore = newParams;
    
    // Remove the old p5 instance and create a new one
    if (p5Instance) {
      p5Instance.remove();
    }
    
    p5Instance = new p5(config.createSketch(parameterStore), rootEl!);
    
    // Clean up on unmount
    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [sketchType]);

  // Get the current parameter definitions
  const currentParameterDefs = sketchConfigs[sketchType].parameterDefs;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <label htmlFor="sketch-selector" className="block text-gray-700 font-medium mb-2">
          Select Sketch
        </label>
        <select
          id="sketch-selector"
          value={sketchType}
          onChange={(e) => setSketchType(e.target.value as SketchType)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(sketchConfigs).map(([key, config]) => (
            <option key={key} value={key}>
              {config.name}
            </option>
          ))}
        </select>
      </div>
      
      <h2 className="text-xl font-bold mb-6 text-gray-700">Parameters</h2>
      {Object.entries(currentParameterDefs).map(([key, value]) => (
        <div key={key} className="mb-4 flex items-center gap-4">
          <label className="w-32 font-medium text-gray-700">{key}</label>
          <input
            type="range"
            min={value.min}
            max={value.max}
            step={value.step}
            value={numericParameters[key as keyof typeof numericParameters]}
            className="flex-grow"
            onChange={(e) => {
              console.log(e.target.value, typeof e.target.value);
              const newValue = parseFloat(e.target.value);
              setNumericParameters({...numericParameters, [key]: newValue});
              parameterStore[key as keyof typeof parameterStore] = newValue;
            }}
          />
          <span className="w-16 text-right text-gray-600">
            {numericParameters[key as keyof typeof numericParameters]}
          </span>
        </div>
      ))}
    </div>
  );
}

const container = document.getElementById("react-root");
if (!container) {
  throw new Error("Cannot find element root #react-root");
}
const root = createRoot(container);
root.render(<TestApp />);
