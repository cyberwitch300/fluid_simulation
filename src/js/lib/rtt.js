'use strict';

import helpers from './helpers.js';

// Render to texture (RTT) class
class TextureRenderer {
  constructor(glContext, options = {}) {
    this.gl = glContext;
    
    // Initialize texture and viewport sizes
    this.width = options.width || glContext.canvas.width;
    this.height = options.height || glContext.canvas.height;
    this.viewportWidth = options.viewportWidth || glContext.canvas.width;
    this.viewportHeight = options.viewportHeight || glContext.canvas.height;
    this.options = options;

    this.initialize(true);
  }

  // Initialize or reset the RTT instance
  initialize(init) {
    const context = this.gl;

    if (!init) {
      // Clean up resources
      this.textures.forEach(texture => context.deleteTexture(texture));
      this.shaders.forEach(shader => context.deleteProgram(shader));
      context.deleteFramebuffer(this.frameBuffer);
      context.deleteBuffer(this.geometryBuffer);
      this.history.forEach(texture => context.deleteTexture(texture));
    }

    this.renderIndex = 0;
    this.shaders = [];
    this.attributes = [];
    this.uniforms = [];
    
    // Create framebuffer and textures
    this.frameBuffer = context.createFramebuffer();
    this.textures = [
      helpers.createEmptyTexture(context, this.width, this.height, this.options.texture),
      helpers.createEmptyTexture(context, this.width, this.height, this.options.texture)
    ];

    // Initialize history textures
    this.history = new Array(this.options.history + 1 || 0).fill(null).map(() =>
      helpers.createEmptyTexture(context, this.width, this.height, this.options.texture)
    );

    // Initialize display buffer and shader
    this.quadBuffer = context.createBuffer();
    this.displayShader = helpers.createShaderProgram(context, helpers.DEFAULT_VERTEX_SHADER, helpers.DEFAULT_FRAGMENT_SHADER);

    // Initialize quad buffer for display and geometry for rendering
    context.bindBuffer(context.ARRAY_BUFFER, this.quadBuffer);
    this.quadVertices = new Float32Array(helpers.QUAD_VERTICES);
    this.geometryBuffer = this.quadBuffer;
    this.vertices = this.quadVertices;
    this.geometry = [context.TRIANGLE_STRIP, 0, helpers.QUAD_VERTICES.length / 2];

    // Process custom geometry if provided
    if (this.options.geometry) {
      this.geometryBuffer = context.createBuffer();
      this.vertices = this.options.geometry.shift();
      this.geometry = this.options.geometry;
    }
  }

  // Add a new vertex and fragment shader to the RTT chain
  addShaderProgram(vertexShader, fragmentShader, uniforms, attributes) {
    const shaderProgram = helpers.createShaderProgram(this.gl, vertexShader, fragmentShader);

    this.shaders.push(shaderProgram);
    this.uniforms.push(uniforms);

    // Initialize buffers before pushing to stack
    for (const attribute in attributes) {
      attributes[attribute].buffer = this.gl.createBuffer();
    }

    this.attributes.push(attributes);

    return this;
  }

  // Add a new fragment shader to the RTT chain
  addFragmentShader(fragmentShader, uniforms) {
    return this.addShaderProgram(helpers.DEFAULT_VERTEX_SHADER, fragmentShader, uniforms);
  }

  // Render the shaders in the RTT chain
  render() {
    const context = this.gl;
    let input, textureUnit, units;

    for (let i = 0; i < this.shaders.length; i++) {
      textureUnit = 0;
      this.renderIndex = (this.renderIndex + 1) % 2;

      // Read A + Write B; then
      // Read B + Write A; then
      // Repeat...
      input = this.output;
      this.output = this.textures[this.renderIndex];
      // Switch history texture
      if (this.history.length && i === this.shaders.length - 1) {
        this.history.unshift(this.history.pop());
        this.output = this.history[0];
      }

      // Bind program and framebuffer
      context.useProgram(this.shaders[i]);
      context.bindFramebuffer(context.FRAMEBUFFER, this.frameBuffer);
      context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, this.output, 0);
      helpers.applyAttribute(context, this.shaders[i], 'position', 2, this.geometryBuffer, this.vertices);

      // Apply additional attributes
      const attributes = this.attributes[i] || {};
      for (const attribute in attributes) {
        helpers.applyAttribute(context, this.shaders[i], attribute, attributes[attribute].size, attributes[attribute].buffer, attributes[attribute].data);
      }

      // Apply the previous shader result as a texture
      helpers.applyUniform(context, this.shaders[i], context.uniform1i, 'tSampler', textureUnit, input);
      textureUnit++;

      // Apply other uniforms
      const uniforms = this.uniforms[i] || {};
      for (const uniform in uniforms) {
        if (uniforms[uniform].type === 't') {
          helpers.applyUniform(context, this.shaders[i], context.uniform1i, uniform, textureUnit, uniforms[uniform].value);
          textureUnit++;
        } else {
          helpers.applyUniform(context, this.shaders[i], context[`uniform${uniforms[uniform].type}`], uniform, uniforms[uniform].value);
        }
      }

      // Apply history textures if needed
      if (this.history.length) {
        units = [];
        for (let j = 1; j < this.history.length; j++) {
          units.push(++textureUnit);
        }
        helpers.applyUniform(context, this.shaders[i], context.uniform1iv, 'tHistory', units, this.history.slice(1));
      }

      // Draw the geometry
      context.viewport(0, 0, this.width, this.height);
      context.drawArrays.apply(context, this.geometry);
    }

    return this;
  }

  // Resize the RTT instance
  resize(options) {
    const glContext = this.gl;
    this.width = options.width || glContext.canvas.width;
    this.height = options.height || glContext.canvas.height;
    this.viewportWidth = options.viewportWidth || glContext.canvas.width;
    this.viewportHeight = options.viewportHeight || glContext.canvas.height;

    // Update texture sizes
    this.textures.forEach(texture => {
      const pixelType = this.options.texture.pixelType || glContext.UNSIGNED_BYTE;
      glContext.bindTexture(glContext.TEXTURE_2D, texture);
      glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, this.width, this.height, 0, glContext.RGBA, pixelType, null);
    });

    // Update history sizes
    this.history.forEach(texture => {
      const pixelType = this.options.texture.pixelType || glContext.UNSIGNED_BYTE;
      glContext.bindTexture(glContext.TEXTURE_2D, texture);
      glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, this.width, this.height, 0, glContext.RGBA, pixelType, null);
    });

    return this;
  }

  // Iterate the last shader in the chain
  iterate(count) {
    // Get the last shader program and set of uniforms
    const shaderProgram = this.shaders[this.shaders.length - 1];
    const uniformSet = this.uniforms[this.uniforms.length - 1];

    for (let i = 0; i < count; i++) {
      this.shaders.push(shaderProgram);
      this.uniforms.push(uniformSet);
    }

    return this;
  }

  swapTextures() {
    const temp = this.textures[0];
    this.textures[0] = this.textures[1];
    this.textures[1] = temp;

    return this;
  }

  // Clear the framebuffer
  clear() {
    if (!this.output) return this;

    const context = this.gl;
    context.bindFramebuffer(context.FRAMEBUFFER, this.frameBuffer);
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT | context.STENCIL_BUFFER_BIT);

    return this;
  }

  displayToScreen() {
    if (!this.output) {
      console.error('ERROR: No output to display.');
      return this;
    }

    const context = this.gl;

    // Use the display shader program and bind the default framebuffer
    context.useProgram(this.displayShader);
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    
    helpers.applyAttribute(context, this.displayShader, 'position', 2, this.quadBuffer, this.quadVertices);
    helpers.applyUniform(context, this.displayShader, context.uniform1i, 'tSampler', 0, this.output);

    context.viewport(0, 0, this.viewportWidth, this.viewportHeight);
    context.drawArrays(context.TRIANGLE_STRIP, 0, helpers.QUAD_VERTICES.length / 2);

    return this;
  }
}

export default TextureRenderer;
