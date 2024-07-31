'use strict';

import helpers from './helpers.js';

const RenderEngine = {};

// Effect class to manage different rendering effects
class Effect {
  constructor() {
    this.index = 0;
  }

  initialize(context) {}
  update(context) {}
  resize(context) {}

  static extend(source) {
    return class extends Effect {
      constructor() {
        super();
        helpers.extendObject(this, source);
      }
    };
  }
}

RenderEngine.Effect = Effect;

// Utility function to retrieve WebGL context
const getWebGLContext = (canvas, options) => {
  return canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
};

// Renderer class to manage the rendering process
class Renderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
    this.gl = getWebGLContext(canvas, options.gl);
    if (!this.gl) {
      throw new Error('WebGL is not supported');
    }

    this.effects = [];
    this.effectNames = {};
    this.container = this.options.container || window;
    this.context = {
      gl: this.gl,
      width: this.container.innerWidth,
      height: this.container.innerHeight,
      effects: this.effectNames,
      aspect: this.container.innerWidth / this.container.innerHeight
    };

    window.addEventListener('resize', this.resize.bind(this));
  }

  // Add an effect to the rendering pipeline
  addEffect(effect) {
    this.effects.push(effect);
    if (effect.name) {
      this.effectNames[effect.name] = effect;
    }
    return this;
  }

  startRendering() {
    this.effects.sort((a, b) => a.index - b.index);
    this.effects.forEach(effect => effect.initialize(this.context));
    this.renderLoop();
    return this;
  }

  renderLoop() {
    requestAnimationFrame(() => this.renderLoop());
    this.effects.forEach(effect => effect.update(this.context));
  }

  // Resize the renderer
  resize() {
    this.context.width = this.container.innerWidth;
    this.context.height = this.container.innerHeight;
    this.context.aspect = this.context.width / this.context.height;
    this.effects.forEach(effect => effect.resize(this.context));
    return this;
  }
}

RenderEngine.Renderer = Renderer;
export default RenderEngine;
