import RenderEngine from './lib/renderer.js';
import TextureRenderer from './lib/rtt.js';

class FluidEffect extends RenderEngine.Effect {
  constructor() {
    super();
    this.name = 'fluid';
  }

  initialize(context) {
    this.context = context;
    const gl = context.gl;

    // Default values for the swirl effect
    this.swirlCenter = [0.5, 0.5]; // Center of the canvas
    this.swirlStrength = 0.1;      // Initial swirl strength

    // Uniforms for the fluid solver shader
    this.uniforms = {
      timeStep: { type: '1f', value: 0.25 },
      motionTexture: { type: 't', value: context.effects.motion.motion.output },
      gridSpacing: { type: '2f', value: [1 / 256, 1 / 256] },
      swirlCenter: { type: '2f', value: this.swirlCenter },
      swirlStrength: { type: '1f', value: this.swirlStrength },
    };

    // Initialize the solver RTT for the fluid simulation
    this.solver = new TextureRenderer(gl, {
      width: 256,
      height: 256,
      texture: { type: gl.FLOAT }
    })
      .addFragmentShader(document.getElementById('fluid-dynamics').textContent, this.uniforms)
      .render();

    // Add the solver texture to the uniforms for the next pass
    this.uniforms.solverTexture = { type: 't', value: this.solver.output };

    // Set up the GUI
    this.setupGUI();
  }

  setupGUI() {
    const gui = new dat.GUI();
    gui.add(this, 'swirlStrength', 0.0, 2.0).name('Swirl Strength').onChange(value => {
      this.uniforms.swirlStrength.value = value;
    });

    gui.add(this.swirlCenter, 0, 1).name('Swirl X').onChange(value => {
      this.uniforms.swirlCenter.value[0] = value;
    });

    gui.add(this.swirlCenter, 1, 1).name('Swirl Y').onChange(value => {
      this.uniforms.swirlCenter.value[1] = value;
    });
  }

  update(context) {
    // Update the motion texture uniform
    this.uniforms.motionTexture.value = context.effects.motion.motion.output;

    // Render the solver and update the solver texture uniform
    this.solver.render();
    this.uniforms.solverTexture.value = this.solver.output;
  }
}

export default FluidEffect;
