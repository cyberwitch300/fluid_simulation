class Fluid {
  constructor(gl, cells, timestep) {
    this.gl = gl;
    this.cells = cells;
    this.timestep = timestep;
    this.uniforms = {
      'd': { type: '2f', value: [1 / cells, 1 / cells] },
      'dt': { type: '1f', value: timestep },
      'motion': { type: 't', value: null } // NOTE: To be set later
    };
    this.initShaders();
    this.initTextures();
  }

  // Initialize the shaders for the fluid solver and dye
  initShaders() {
    const gl = this.gl;
    this.solverProgram = this.createProgram(document.getElementById('fluid-solver').textContent);
    this.dyeProgram = this.createProgram(document.getElementById('fluid-dye').textContent);
  }

  // Initialize the RTT textures
  initTextures() {
    const gl = this.gl;
    this.solver = new RTT(gl, {
      width: this.cells,
      height: this.cells,
      texture: { type: gl.FLOAT }
    }).fragment(this.solverProgram, this.uniforms).render();
    
    this.uniforms.solver = { type: 't', value: this.solver.output };
    
    this.dye = new RTT(gl, {
      width: this.cells,
      height: this.cells,
      texture: { type: gl.FLOAT, minFilter: gl.LINEAR, magFilter: gl.LINEAR }
    }).fragment(this.dyeProgram, this.uniforms).render();
  }

  // Create a WebGL program from the provided shader source
  createProgram(fragmentSource) {
    const gl = this.gl;
    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Could not initialize shaders');
    }
    return program;
  }

  // Create a WebGL shader from the provided source
  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  // Update the fluid simulation
  update(motionTexture) {
    this.uniforms.motion.value = motionTexture;
    this.solver.render();
    this.uniforms.solver.value = this.solver.output;
    this.dye.render();
  }
}

window.Fluid = Fluid;
