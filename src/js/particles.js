import RenderEngine from './lib/renderer.js';
import TextureRenderer from './lib/rtt.js';

class ParticlesEffect extends RenderEngine.Effect {
  constructor() {
    super();
    this.name = 'particles';
  }

  static get PARTICLE_GRID_SIZE() {
    return Math.ceil(Math.sqrt(1024 * 256)); 
  }

  static get VERTICES() {
    const vertices = [];
    for (let i = 0, len = ParticlesEffect.PARTICLE_GRID_SIZE * ParticlesEffect.PARTICLE_GRID_SIZE; i < len; i++) {
      vertices.push(i % ParticlesEffect.PARTICLE_GRID_SIZE / ParticlesEffect.PARTICLE_GRID_SIZE);
      vertices.push(Math.floor(i / ParticlesEffect.PARTICLE_GRID_SIZE) / ParticlesEffect.PARTICLE_GRID_SIZE);
    }
    return vertices;
  }

  initialize(context) {
    this.context = context;
    const gl = context.gl;

    // Data uniforms for particle systems
    const dataUniforms = {
      'timeStep': { type: '1f', value: 0.25 },
      'gridSpacing': { type: '2f', value: [1 / ParticlesEffect.PARTICLE_GRID_SIZE, 1 / ParticlesEffect.PARTICLE_GRID_SIZE] },
      'solverTexture': { type: 't', value: context.effects.fluid.solver.output }
    };

    // Initialize data for particles
    this.data = new TextureRenderer(gl, {
      width: ParticlesEffect.PARTICLE_GRID_SIZE,
      height: ParticlesEffect.PARTICLE_GRID_SIZE,
      texture: { type: gl.FLOAT }
    }).addFragmentShader(document.getElementById('fragment-particle-data').textContent, dataUniforms)
      .render();

    // Check for WebGL errors
    this.checkGLError(gl, 'after initializing data for particles');

    // Initialize particles
    this.uniforms = {
      'aspectRatio': { type: '1f', value: context.aspect },
      'particleDataTexture': { type: 't', value: this.data.output }
    };

    this.particles = new TextureRenderer(gl, {
      texture: { type: gl.FLOAT },
      geometry: [new Float32Array(ParticlesEffect.VERTICES), gl.POINTS, 0, ParticlesEffect.VERTICES.length / 2]
    }).addShaderProgram(
      document.getElementById('vertex-particles').textContent,
      document.getElementById('fragment-particles').textContent, this.uniforms
    ).render();

    // Check for WebGL errors
    this.checkGLError(gl, 'after initializing particles');

    this.buffer = [];
    this.bufferIndex = 0;

    // Initialize particles across the screen
    this.initializeParticles();
  }

  initializeParticles() {
    const gl = this.context.gl;
    
    // Loop Through Particle Grid
    for (let x = 0; x < ParticlesEffect.PARTICLE_GRID_SIZE; x++) {
      for (let y = 0; y < ParticlesEffect.PARTICLE_GRID_SIZE; y++) {
        // Calculate Random Angle
        const angle = Math.random() * 2 * Math.PI;
        // Push Particle Data to Buffer
        this.buffer.push(
          x / ParticlesEffect.PARTICLE_GRID_SIZE + Math.cos(angle) * 0.01,
          y / ParticlesEffect.PARTICLE_GRID_SIZE + Math.sin(angle) * 0.01 * this.context.aspect,
          0.4, // sets the alpha value for the particle
          Math.random() * 5
        );
      }
    }
    // Bind the texture and update texture data
    gl.bindTexture(gl.TEXTURE_2D, this.data.output);
    gl.texSubImage2D(
      gl.TEXTURE_2D, 0, 0, 0, ParticlesEffect.PARTICLE_GRID_SIZE, ParticlesEffect.PARTICLE_GRID_SIZE,
      gl.RGBA, gl.FLOAT, new Float32Array(this.buffer)
    );

    this.buffer = [];

    // Check for WebGL errors
    this.checkGLError(gl, 'after initializing particle positions');
  }

  update(context) {
    this.context = context;
    const gl = context.gl;

    this.data.render();

    gl.enable(gl.BLEND);
    this.particles.clear().render(); 
    gl.disable(gl.BLEND);

    // Check for WebGL errors
    this.checkGLError(gl, 'after updating particles');
  }

  resize(context) {
    this.context = context;
    this.particles.resize();
  }

  // Utility method to check for WebGL errors
  checkGLError(gl, stage) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`WebGL Error at ${stage}:`, error);
    }
  }
}

export default ParticlesEffect;
