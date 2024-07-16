class Particles {
  constructor(gl) {
    this.gl = gl; // Store the WebGL context
    //this.fluid = fluid; // fluid simulation
    this.particleCount = 900; // Number of particles
    this.particleData = new Float32Array(this.particleCount * 2);  // Array to store particle positions
    this.particleVelocity = new Float32Array(this.particleCount * 2); // Array to store particle velocities

    // Initialize particle positions and velocities
    for (let i = 0; i < this.particleCount; i++) {
      this.particleData[i * 2] = (Math.random() * 2 - 1) * 0.5; // x position, larger area
      this.particleData[i * 2 + 1] = (Math.random() * 2 - 1) * 0.5; // y position, larger area
      this.particleVelocity[i * 2] = (Math.random() * 2 - 1) * 0.01; // x velocity
      this.particleVelocity[i * 2 + 1] = (Math.random() * 2 - 1) * 0.01; // y velocity
    }

    // Vertex shader source code
    this.vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_PointSize = 2.0;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader source code
    this.fragmentShaderSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
      }
    `;

    this.initShaderProgram();
  }

  // Initialize the shader program
  initShaderProgram() {
    const gl = this.gl;

    // Compile vertex and fragment shader
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    // Create a shader program, attach vertex and fragment shader, and link program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    // Use the shader program
    gl.useProgram(shaderProgram);

    // Get the location of the position attribute and enable it
    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    this.positionBuffer = gl.createBuffer();    // Create a buffer for particle positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);   // Bind the buffer
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData, gl.STATIC_DRAW);   // Upload the particle data to the buffer
    gl.enableVertexAttribArray(positionAttributeLocation);    // Enable the attribute
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0); // Define how to read the buffer
  }

  // Load and compile shader
  loadShader(type, source) {
    const gl = this.gl;
    // Create a shader of the given type, set the source code of the shader, and compile the shader
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    // Delete the shader if compilation failed
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

/*  **** DEBUG NEEDED *** 
 // Update particle positions based on the fluid velocity field
  update() {
    for (let i = 0; i < this.particleCount; i++) {
      // Get the current position of the particle
      const x = this.particleData[i * 2];
      const y = this.particleData[i * 2 + 1];

      // Get the velocity from the fluid simulation
      const [vx, vy] = this.fluid.getVelocity(x, y);

      // Update the particle velocity based on fluid velocity
      this.particleVelocity[i * 2] += vx * 0.1; // Adjust the scaling factor as needed
      this.particleVelocity[i * 2 + 1] += vy * 0.1; // Adjust the scaling factor as needed

      // Update particle positions based on velocity
      this.particleData[i * 2] += this.particleVelocity[i * 2];
      this.particleData[i * 2 + 1] += this.particleVelocity[i * 2 + 1];

      // Bounce particles off the edges
      if (this.particleData[i * 2] > 1 || this.particleData[i * 2] < -1) {
        this.particleVelocity[i * 2] *= -1;
      }
      if (this.particleData[i * 2 + 1] > 1 || this.particleData[i * 2 + 1] < -1) {
        this.particleVelocity[i * 2 + 1] *= -1;
      }
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData, gl.STATIC_DRAW);
  }
*/

// Update particle positions based on velocity
  update() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particleData[i * 2] += this.particleVelocity[i * 2]; // Update x position
      this.particleData[i * 2 + 1] += this.particleVelocity[i * 2 + 1]; // Update y position

      // Boundary conditions
      if (this.particleData[i * 2] > 1) {
        this.particleData[i * 2] = -1; // Wrap around to the opposite side
      } else if (this.particleData[i * 2] < -1) {
        this.particleData[i * 2] = 1; // Wrap around to the opposite side
      }

      if (this.particleData[i * 2 + 1] > 1) {
        this.particleData[i * 2 + 1] = -1; 
      } else if (this.particleData[i * 2 + 1] < -1) {
        this.particleData[i * 2 + 1] = 1; 
      }
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData, gl.STATIC_DRAW);
  }

  // Update particle velocities based on mouse position
  updateVelocities(mouseX, mouseY) {
    for (let i = 0; i < this.particleCount; i++) {
      const dx = this.particleData[i * 2] - mouseX;
      const dy = this.particleData[i * 2 + 1] - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Influence factor - inversely proportional to the distance
      const influence = 1 / (dist + 0.1);

      // Update velocities based on the influence
      this.particleVelocity[i * 2] += dx * influence * 0.1;
      this.particleVelocity[i * 2 + 1] += dy * influence * 0.1;
    }
  }

  // Draw the particles on the canvas
  draw() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, this.particleCount);
  }
  }

window.Particles = Particles;