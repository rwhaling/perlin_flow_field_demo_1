import p5 from "p5";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createSketch, numericParameterDefs, initParameterStore, ParameterStore } from "./sketch";
import { createSketch as createCrimsonSketch, numericParameterDefs as crimsonNumericParameterDefs, initParameterStore as initCrimsonParameterStore } from "./crimsonSketch";
import { createSketch as createQrSketch, numericParameterDefs as qrNumericParameterDefs, initParameterStore as initQrParameterStore } from "./sketch_qr_1";
import { createSketch as createQrSketch2, numericParameterDefs as qrNumericParameterDefs2, initParameterStore as initQrParameterStore2 } from "./sketch_qr_2";
import { createSketch as createQrSketch3, numericParameterDefs as qrNumericParameterDefs3, initParameterStore as initQrParameterStore3 } from "./sketch_qr_3";
import { createSketch as createQrSketch4, numericParameterDefs as qrNumericParameterDefs4, initParameterStore as initQrParameterStore4 } from "./sketch_qr_4";
import { createSketch as createVoronoiSketch, numericParameterDefs as voronoiNumericParameterDefs, initParameterStore as initVoronoiParameterStore } from "./voronoi_sketch";
import { createSketch as createQrSketch5, numericParameterDefs as qrNumericParameterDefs5, initParameterStore as initQrParameterStore5 } from "./sketch_qr_5";
import { createSketch as createQrSketch6, numericParameterDefs as qrNumericParameterDefs6, initParameterStore as initQrParameterStore6 } from "./sketch_qr_6";
// Define sketch types for organization
type SketchType = "default" | "crimson";

// Create a map of sketch configurations
const sketchConfigs = {
  default: {
    name: "Test Field",
    createSketch,
    parameterDefs: numericParameterDefs,
    initStore: initParameterStore
  },
  qr: {
    name: "QR Code",
    createSketch: createQrSketch,
    parameterDefs: qrNumericParameterDefs,
    initStore: initQrParameterStore
  },
  qr2: {
    name: "QR Code 2",
    createSketch: createQrSketch2,
    parameterDefs: qrNumericParameterDefs2,
    initStore: initQrParameterStore2
  },
  qr3: {
    name: "QR Code 3",
    createSketch: createQrSketch3,
    parameterDefs: qrNumericParameterDefs3,
    initStore: initQrParameterStore3
  },
  qr4: {
    name: "QR Code 4",
    createSketch: createQrSketch4,
    parameterDefs: qrNumericParameterDefs4,
    initStore: initQrParameterStore4
  },
  qr5: {
    name: "QR Code 5",
    createSketch: createQrSketch5,
    parameterDefs: qrNumericParameterDefs5,
    initStore: initQrParameterStore5
  },
  qr6: {
    name: "QR Code 6",
    createSketch: createQrSketch6,
    parameterDefs: qrNumericParameterDefs6,
    initStore: initQrParameterStore6
  },
  crimson: {
    name: "Crimson Flow Field",
    createSketch: createCrimsonSketch,
    parameterDefs: crimsonNumericParameterDefs,
    initStore: initCrimsonParameterStore
  },
  voronoi: {
    name: "Voronoi",
    createSketch: createVoronoiSketch,
    parameterDefs: voronoiNumericParameterDefs,
    initStore: initVoronoiParameterStore
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
  const [showParams, setShowParams] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true';
  });
  
  const [sketchType, setSketchType] = useState<SketchType>("default");
  const [numericParameters, setNumericParameters] = useState(initParameterStore());

  // Function to cycle to next sketch
  const cycleToNextSketch = () => {
    const sketchTypes = Object.keys(sketchConfigs) as SketchType[];
    const currentIndex = sketchTypes.indexOf(sketchType);
    const nextIndex = (currentIndex + 1) % sketchTypes.length;
    setSketchType(sketchTypes[nextIndex]);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (showParams) {
      url.searchParams.set('debug', 'true');
    } else {
      url.searchParams.delete('debug');
    }
    window.history.replaceState({}, '', url);
  }, [showParams]);

  useEffect(() => {
    const config = sketchConfigs[sketchType];
    
    const newParams = config.initStore();
    
    setNumericParameters(newParams);
    
    parameterStore = newParams;
    
    if (p5Instance) {
      p5Instance.remove();
    }
    
    p5Instance = new p5(config.createSketch(parameterStore), rootEl!);
    
    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [sketchType]);

  const currentParameterDefs = sketchConfigs[sketchType].parameterDefs;

  // Only render the controls panel if showParams is true
  if (!showParams) {
    return null; // This will hide the entire card when display !== 'true'
  }

  return (
    <>
      {/* Add the next sketch button to the p5-root div */}
      <button 
        className="next-sketch-button"
        onClick={cycleToNextSketch}
      >
        Next Sketch
      </button>

      {showParams && (
        <div className="controls-panel">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex-grow">
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
            <button
              onClick={() => setShowParams(!showParams)}
              className="ml-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {showParams ? 'Hide Parameters' : 'Show Parameters'}
            </button>
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
      )}
    </>
  );
}

const container = document.getElementById("react-root");
if (!container) {
  throw new Error("Cannot find element root #react-root");
}
const root = createRoot(container);
root.render(<TestApp />);
