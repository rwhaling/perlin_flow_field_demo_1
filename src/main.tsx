import p5 from "p5";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createSketch, numericParameterDefs, initParameterStore } from "./sketch";

// Create the store with initial parameter values
const parameterStore = initParameterStore();

// Entrypoint code
function main(rootElement: HTMLElement) {
  // Create a p5 instance in instance mode
  new p5(createSketch(parameterStore), rootElement);
}

const rootEl = document.getElementById("p5-root");
if (!rootEl) {
  throw new Error("Cannot find element root #p5-root");
}
main(rootEl);

function TestApp() {
  const [numericParameters, setNumericParameters] = useState(initParameterStore());
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-6 text-gray-700">Parameters</h2>
      {Object.entries(numericParameterDefs).map(([key, value]) => (
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
              setNumericParameters({...numericParameters, [key]: parseFloat(e.target.value)});
              parameterStore[key as keyof typeof parameterStore] = parseFloat(e.target.value);
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
