import RenderEngine from './lib/renderer.js';
import TextureRenderer from './lib/rtt.js';

class VisualEffect extends RenderEngine.Effect {
  constructor() {
    super();
    this.name = 'visual';
  }

  initialize(context) {
    this.context = context;
    const gl = context.gl;

    this.uniforms = {
      'samplerTexture': { type: 't', value: context.effects.fluid.solver.output }, 
      'particlesTexture': { type: 't', value: context.effects.particles.particles.output }
    };

    this.visualizer = new TextureRenderer(gl, {
      texture: { minFilter: gl.LINEAR, magFilter: gl.LINEAR }
    }).addFragmentShader(document.getElementById('fluid-visual').textContent, this.uniforms)
      .render();
  }

  update(context) {
    const gl = context.gl;

    this.uniforms.particlesTexture.value = context.effects.particles.particles.output;

    gl.enable(gl.BLEND);
    this.visualizer.clear().render();
    gl.disable(gl.BLEND);

    this.visualizer.displayToScreen();
  }

  resize(context) {
    this.context = context;
    this.visualizer.resize();
  }
}

export default VisualEffect;
