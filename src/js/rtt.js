// RENDER TO TEXTURE (IN PROGRESS)

class RTT {
    constructor(gl, options) {
      this.gl = gl;
      this.width = options.width;
      this.height = options.height;
      this.texture = this.createTexture(options.texture);
      this.framebuffer = this.createFramebuffer(this.texture);
      this.render = this.render.bind(this);
    }
  
    // Create a WebGL texture
    createTexture(options) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter || gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter || gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    }
  
    // Create a framebuffer
    createFramebuffer(texture) {
      const gl = this.gl;
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return framebuffer;
    }
  
    // Set the fragment shader for the RTT
    fragment(fragmentSource, uniforms) {
      const gl = this.gl;
      this.program = this.createProgram(fragmentSource);
      this.uniforms = uniforms;
      this.setUniforms(uniforms);
      return this;
    }
  
    // Create a WebGL program
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
  
    // Create a WebGL shader
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
  
    // Set uniform variables for the shader program
    setUniforms(uniforms) {
      const gl = this.gl;
      gl.useProgram(this.program);
      for (let name in uniforms) {
        const uniform = uniforms[name];
        const location = gl.getUniformLocation(this.program, name);
        if (uniform.type === '1f') {
          gl.uniform1f(location, uniform.value);
        } else if (uniform.type === '2f') {
          gl.uniform2f(location, ...uniform.value);
        } else if (uniform.type === 't') {
          gl.uniform1i(location, 0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, uniform.value);
        }
      }
    }
  
    // Render the RTT
    render() {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        // Bind attributes and uniforms
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1, -1,
        -1,  1,
        1,  1,
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        for (let name in this.uniforms) {
        const uniform = this.uniforms[name];
        const location = gl.getUniformLocation(this.program, name);
        if (uniform.type === '1f') {
            gl.uniform1f(location, uniform.value);
        } else if (uniform.type === '2f') {
            gl.uniform2f(location, ...uniform.value);
        } else if (uniform.type === 't') {
            gl.uniform1i(location, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, uniform.value);
        }
        }

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Unbind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

  