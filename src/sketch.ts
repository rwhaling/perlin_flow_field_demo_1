import p5 from "p5";

// Parameter definitions moved from main.tsx to here
export const numericParameterDefs = {
  "timeMultiplier": {
    "min": 0,
    "max": 0.01,
    "step": 0.00001,
    "defaultValue": 0.00005, // Set to match initial value
  },
  "noiseSize": {
    "min": 0,
    "max": 100,
    "step": 1,
    "defaultValue": 80,
  },
  "noiseScale": {
    "min": 0,
    "max": 0.1,
    "step": 0.0001,
    "defaultValue": 0.1,
  },
  "noiseDetailOctave": {
    "min": 0,
    "max": 10,
    "step": 1,
    "defaultValue": 3,
  },
  "noiseDetailFalloff": {
    "min": 0,
    "max": 1,
    "step": 0.05,
    "defaultValue": 0.45,
  },
  "particleFrequency": {
    "min": 0,
    "max": 360,
    "step": 4,
    "defaultValue": 10, // Set to match initial value
  },
  "gridTransparency": {
    "min": 0,
    "max": 255,
    "step": 1,
    "defaultValue": 24,
  },
  "trailTransparency": {
    "min": 0,
    "max": 255,
    "step": 1,
    "defaultValue": 17,
  },
  "gridSize": {
    "min": 10,
    "max": 50,
    "step": 1,
    "defaultValue": 25,
  },
  // New parameters for particle behavior
  "particleMaxCount": {
    "min": 50,
    "max": 1000, 
    "step": 10,
    "defaultValue": 300,
  },
  "particleForceStrength": {
    "min": 0.01,
    "max": 0.5,
    "step": 0.01,
    "defaultValue": 0.27,
  },
  "particleMaxSpeed": {
    "min": 0.5,
    "max": 5,
    "step": 0.1,
    "defaultValue": 3.4,
  },
  "particleTrailWeight": {
    "min": 1,
    "max": 5,
    "step": 0.5,
    "defaultValue": 2,
  },
  // New parameter for configurable lines per region
  "linesPerRegion": {
    "min": 1,
    "max": 10,
    "step": 1,
    "defaultValue": 6, // Default to current behavior (2 lines)
  },
  // New parameters for line length control
  "lineMinLength": {
    "min": 50,
    "max": 200,
    "step": 5,
    "defaultValue": 20, // Default to current hardcoded value
  },
  "lineMaxLength": {
    "min": 100,
    "max": 400,
    "step": 5,
    "defaultValue": 150, // Default maximum length
  },
};

// This type represents the parameter store structure
export type ParameterStore = {
  [K in keyof typeof numericParameterDefs]: number;
};

// Create initialization function here too
export function initParameterStore(): ParameterStore {
  // Initialize from default values in the parameter definitions
  const store = {} as ParameterStore;
  
  Object.entries(numericParameterDefs).forEach(([key, def]) => {
    store[key as keyof ParameterStore] = def.defaultValue;
  });
  
  return store;
}

// This function creates the p5 sketch
export function createSketch(parameterStore: ParameterStore) {
  return function sketch(p: p5) {
    let font: p5.Font;
    let startTime = p.millis();
    // Create a separate graphics layer for particles
    let particleLayer: p5.Graphics;
    let gridLayer: p5.Graphics;
    let regions: any[];
    let lines: any[];
    let lineStepFactor: any[];
    let lineColors: any[];

    
    // Improved particle structure with vectors and previous position
    interface SimpleParticle {
      pos: p5.Vector;
      vel: p5.Vector;
      acc: p5.Vector;
      prevPos: p5.Vector;
    }
    
    // Array to store particles
    let particles: SimpleParticle[] = [];
    
    p.preload = function() {
      // can preload assets here...
      font = p.loadFont(
        new URL("/public/fonts/inconsolata.otf", import.meta.url).href
      );
    };
    
    p.setup = function() {
      p.createCanvas(1000, 500, p.WEBGL);
      p.translate(-p.width/2, -p.height/2); // Move to top-left for image drawing
      // Create particle layer with same dimensions and renderer
      particleLayer = p.createGraphics(500, 500, p.WEBGL);
      particleLayer.setAttributes({ alpha: true });
      gridLayer = p.createGraphics(500, 500, p.WEBGL);      

      regions = [  // 6 regions, 100 x 500, 25px padding each side
        [75, 25, 175, 475],
        [225, 25, 325, 475],
        [375, 25, 475, 475],
        [525, 25, 625, 475],
        [675, 25, 775, 475],
        [825, 25, 925, 475],        
      ]
      lines = [];
      lineStepFactor = [];
      
      for (let r = 0; r < regions.length; r++) {
        const region = regions[r];
        const linesPerRegion = Math.floor(parameterStore.linesPerRegion);
        const minLineLength = parameterStore.lineMinLength;
        const maxLineLength = parameterStore.lineMaxLength;
        
        // Create array to store line equations for this region's partition checking
        const regionLines = [];
        
        // Generate lines for this region
        for (let lineIndex = 0; lineIndex < linesPerRegion; lineIndex++) {
          let line_dist = 0;
          let x1, y1, x2, y2;
          
          if (lineIndex === 0) {
            // First line - generate randomly with minimum and maximum distance
            let attempts = 0;
            const maxAttempts = 50;
            
            while ((line_dist < minLineLength || line_dist > maxLineLength) && attempts < maxAttempts) {
              x1 = p.random(region[0] + 25, region[2] - 25);
              y1 = p.random(region[1] + 25, region[3] - 25);
              x2 = p.random(region[0] + 25, region[2] - 25);
              y2 = p.random(region[1] + 25, region[3] - 25);
              line_dist = p.dist(x1, y1, x2, y2);
              attempts++;
            }
            
            // If we couldn't find a line within length constraints, use best attempt
            if (attempts >= maxAttempts) {
              // Generate one more time, prioritizing minimum length
              x1 = p.random(region[0] + 25, region[2] - 25);
              y1 = p.random(region[1] + 25, region[3] - 25);
              x2 = p.random(region[0] + 25, region[2] - 25);
              y2 = p.random(region[1] + 25, region[3] - 25);
              line_dist = p.dist(x1, y1, x2, y2);
            }
            
            // Add to lines array and store line equation for partition checking
            lines.push([x1, y1, x2, y2]);
            lineStepFactor.push(p.random(10, 40));
            
            // Calculate line equation: ax + by + c = 0
            const a = y2 - y1;
            const b = x1 - x2;
            const c = x2 * y1 - x1 * y2;
            regionLines.push({ a, b, c });
          } else {
            // Subsequent lines - determine best partition
            
            // Function to determine which side of a line a point is on
            const lineSide = (point, lineEq) => {
              return lineEq.a * point.x + lineEq.b * point.y + lineEq.c;
            };
            
            // Generate and test sample points
            const numSamplePoints = 100;
            const samplePoints = [];
            
            for (let i = 0; i < numSamplePoints; i++) {
              samplePoints.push({
                x: p.random(region[0] + 25, region[2] - 25),
                y: p.random(region[1] + 25, region[3] - 25),
                partitionId: 0
              });
            }
            
            // Assign each point to a partition based on existing lines
            for (let i = 0; i < samplePoints.length; i++) {
              let partitionId = 0;
              const point = samplePoints[i];
              
              // Each line doubles the number of potential partitions
              for (let j = 0; j < regionLines.length; j++) {
                const side = lineSide(point, regionLines[j]);
                if (side > 0) {
                  partitionId |= (1 << j);
                }
              }
              
              point.partitionId = partitionId;
            }
            
            // Count points in each partition
            const partitionCounts = {};
            for (const point of samplePoints) {
              if (!partitionCounts[point.partitionId]) {
                partitionCounts[point.partitionId] = 0;
              }
              partitionCounts[point.partitionId]++;
            }
            
            // Find largest partition
            let largestPartition = 0;
            let largestCount = 0;
            for (const [id, count] of Object.entries(partitionCounts)) {
              if (count as number > largestCount) {
                largestCount = count as number;
                largestPartition = Number(id);
              }
            }
            
            // Filter points to largest partition
            const pointsInLargestPartition = samplePoints.filter(
              point => point.partitionId === largestPartition
            );
            
            // Generate a new line in the largest partition
            let attempts = 0;
            const maxAttempts = 30;
            
            while ((line_dist < minLineLength || line_dist > maxLineLength) && attempts < maxAttempts) {
              // Select two random points from the largest partition
              if (pointsInLargestPartition.length < 2) break;
              
              const point1Index = Math.floor(p.random(pointsInLargestPartition.length));
              let point2Index;
              do {
                point2Index = Math.floor(p.random(pointsInLargestPartition.length));
              } while (point1Index === point2Index && pointsInLargestPartition.length > 1);
              
              x1 = pointsInLargestPartition[point1Index].x;
              y1 = pointsInLargestPartition[point1Index].y;
              x2 = pointsInLargestPartition[point2Index].x;
              y2 = pointsInLargestPartition[point2Index].y;
              
              line_dist = p.dist(x1, y1, x2, y2);
              attempts++;
            }
            
            // If we found a suitable line or made best effort
            if (line_dist >= minLineLength || attempts >= maxAttempts) {
              // Add new line to arrays
              lines.push([x1, y1, x2, y2]);
              lineStepFactor.push(p.random(10, 40));
              
              // Calculate and store line equation
              const a = y2 - y1;
              const b = x1 - x2;
              const c = x2 * y1 - x1 * y2;
              regionLines.push({ a, b, c });
            }
          }
        }
      }

      // let's populate lineColors with random lerps between black and 4C585B
      lineColors = [];
      for (let i = 0; i < lines.length; i++) {
        lineColors.push(p.lerpColor(p.color(0), p.color("#2C3639"), p.random(0, 1)));
      }
    }
    

    let frameCount = 0;
    p.draw = function() {
      frameCount++;
      p.translate(-p.width/2, -p.height/2); // Move to top-left for image drawing
      let time = startTime;
      time = frameCount * 0;
      p.background("#FFF8E6");

      // draw a rectangle around each region
      for (let r = 0; r < regions.length; r++) {
        console.log("REGION",regions[r]);
        let region = regions[r];
        p.noFill();
        p.stroke("#2C3639");
        p.strokeWeight(2);
        p.rect(region[0], region[1], region[2] - region[0], region[3] - region[1]);
      }

      for (let l = 0; l < lines.length; l++) {
        console.log(lines);
        let x1 = lines[l][0];
        let y1 = lines[l][1];
        let x2 = lines[l][2];
        let y2 = lines[l][3];
        console.log(l, x1, y1, x2, y2);
        // p.line(x1, y1, x2, y2);
        // iterate over the line in 100 steps and draw a line with x/y perturbed by noise
        // draw the line by first computing the even step along the line, then use the noise to displace on an axis perpendicular to the line 

        let steps = 1000;
        p.noiseDetail(2, 0.5);

        let line_length = p.dist(x1, y1, x2, y2);

        // let lineStepFactor = p.random(5,40)

        let lineStepFreq = Math.ceil((200 / line_length) * lineStepFactor[l]);

        // do it again with an offset to the noise
        // for the first/last 10% of the line, blend the noise with the original line 
        for (let i = 0; i < steps; i++) {
          let x = p.lerp(x1, x2, i/steps);
          let y = p.lerp(y1, y2, i/steps);
          let angle = p.atan2(y2 - y1, x2 - x1);
          let perpAngle = angle + p.PI/2;

          // Simple soft absolute value function - smooth everywhere
          let smoothAbsNoise = (noiseVal) => {
            // Shift noise to be centered at 0
            let centered = noiseVal - 0.5;
            
            // Soft absolute value using sqrt(x² + ε)
            let epsilon = 0.01; // Controls smoothness at zero
            return Math.sqrt(centered * centered + epsilon);
          };
          
          let noise1 = smoothAbsNoise(p.noise(x * 0.008, i * 0.002, time * 0.1));
          let noise2 = noise1 + smoothAbsNoise(p.noise(x * 0.008, i * 0.002, (time + 2054) * 0.001));
          let blendFactor = 1.0;
          let blendedNoise1 = noise1;
          
          if (i < steps * 0.1) {
            // Cubic ease-in-out for first 10%
            let t = i / (steps * 0.1);
            // Cubic ease-in-out formula
            blendFactor = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          } else if (i > steps * 0.9) {
            // Cubic ease-in-out for last 10%
            let t = (steps - i) / (steps * 0.1);
            // Cubic ease-in-out formula

            blendFactor = 1.0;
            let blendOutFactor = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            blendedNoise1 = p.lerp(noise2, noise1, blendOutFactor);
          }
          let blendedNoise = p.lerp(noise1, noise2, blendFactor);
          let xNoise1 = Math.cos(perpAngle) * blendedNoise1 * 100;
          let yNoise1 = Math.sin(perpAngle) * blendedNoise1 * 100;
          let xNoise2 = Math.cos(perpAngle) * blendedNoise * 100;
          let yNoise2 = Math.sin(perpAngle) * blendedNoise * 100;
          p.fill(lineColors[l]);
          p.circle(x + xNoise1, y + yNoise1, 1);
          p.circle(x + xNoise2, y + yNoise2, 1);
          p.strokeWeight(noise1 * 3);
          p.stroke(lineColors[l]);

          if (i % lineStepFreq == 0) {
            p.line(x + xNoise1, y + yNoise1, x + xNoise2, y + yNoise2);
          }
        }   
      }   

      // Draw overlay rectangles for areas outside the regions
      p.noStroke();
      p.fill("#FFF8E6"); // Same as background color
      
      // Top and bottom borders
      p.rect(0, 0, p.width, 25);
      p.rect(0, 475, p.width, p.height - 475);
      
      // Areas between regions
      p.rect(0, 25, regions[0][0], 450); // Left edge to first region
      
      // Between each region
      for (let i = 0; i < regions.length - 1; i++) {
        p.rect(regions[i][2], 25, regions[i+1][0] - regions[i][2], 450);
      }
      
      // After the last region to right edge
      p.rect(regions[regions.length-1][2], 25, p.width - regions[regions.length-1][2], 450);
    };
  };
}