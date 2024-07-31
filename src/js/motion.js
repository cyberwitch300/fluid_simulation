import RenderEngine from './lib/renderer.js';
import TextureRenderer from './lib/rtt.js';

class MotionEffect extends RenderEngine.Effect {
  constructor() {
    super();
    this.name = 'motion';
  }

  initialize(context) {
    this.context = context;
    const gl = context.gl;

    // Initialize uniforms for the motion effect
    this.uniforms = {
      'aspectRatio': { type: '1f', value: context.aspect }, // Aspect ratio of the canvas
      'curPos': { type: '2f', value: null },                // Current mouse position
      'prevPos': { type: '2f', value: null },               // Previous mouse position
      'velocity': { type: '2f', value: [0, 0] }             // Mouse movement velocity
    };

    // Initialize RTT (Render-to-Texture) for the motion effect
    this.motion = new TextureRenderer(gl, {
      width: 256,
      height: 256,
      texture: { type: gl.FLOAT }
    }).addFragmentShader(document.getElementById('fluid-motion').textContent, this.uniforms)
      .render();

    this.setupEventListeners();
  }

  handleMouseMove(event) {
    // Extract mouse coordinates
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    // Calculate normalized coordinates
    const i = (mouseX / this.context.width) * 256 | 0;
    const j = (mouseY / this.context.height) * 256 | 0;

    // Update previous and current positions
    this.uniforms.prevPos.value = this.uniforms.curPos.value || [i / 256, 1.0 - j / 256];
    this.uniforms.curPos.value = [i / 256, 1.0 - j / 256];

    // Calculate delta values for velocity
    const deltaX = (mouseX - (this.prevMouseX || 0)) / this.context.width;
    const deltaY = (mouseY - (this.prevMouseY || 0)) / this.context.height;

    // Update velocity and store current mouse coordinates
    this.uniforms.velocity.value = [deltaX, -deltaY];
    this.prevMouseX = mouseX;
    this.prevMouseY = mouseY;
  }

  setupEventListeners() {
    // Set up mouse move event listener
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
  }

  update(context) {
    this.context = context;
    // Render the motion effect
    this.motion.render(); 
    // Reset velocity after rendering              
    this.uniforms.velocity.value = [0, 0]; 
  }

  resize(context) {
    this.context = context;
    // Update aspect ratio on resize
    this.uniforms.aspectRatio.value = context.aspect;
  }
}

export default MotionEffect;
