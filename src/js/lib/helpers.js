'use strict';

const helpers = {};

// Utility function to extend an object with properties from another object
helpers.extendObject = (targetObject, sourceObject) => {
  Object.keys(sourceObject).forEach(key => {
    // If source object has the property, assign it to the target object
    if (sourceObject.hasOwnProperty(key)) {
      targetObject[key] = sourceObject[key];
    }
  });
  return targetObject;
};


// Default vertex shader source code
helpers.DEFAULT_VERTEX_SHADER = `
  attribute vec2 position;  // vertex position
  varying vec2 vUv;         // UV coordinates

  void main() {
    vUv = position;

    // Transform position to clip space
    vec2 vertexPosition = position * 2.0 - 1.0; 
    // Set position
    gl_Position = vec4(vertexPosition.x, vertexPosition.y, 0, 1);
  }
`;


// Default fragment shader source code to display the buffer
helpers.DEFAULT_FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D tSampler;   // texture sampler
  varying vec2 vUv;             // UV coordinates
  
  void main() {
    // Set the fragment color based on the texture
    gl_FragColor = texture2D(tSampler, vUv);
  }
`;


// Vertices for rendering a full-screen quad
helpers.QUAD_VERTICES = new Float32Array([
  -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
  1.0, -1.0, 1.0, 1.0, -1.0, 1.0
]);


// Utility function to create an empty texture
helpers.createEmptyTexture = function(glContext, textureWidth, textureHeight, textureOptions = {}) {
  // Set texture parameters
  const horizontalWrapMode = textureOptions.wrapS || glContext.CLAMP_TO_EDGE;     
  const verticalWrapMode = textureOptions.wrapT || glContext.CLAMP_TO_EDGE;     
  const textureFormat = textureOptions.type || glContext.UNSIGNED_BYTE;         
  const minificationFilter = textureOptions.minFilter || glContext.NEAREST;     
  const magnificationFilter = textureOptions.magFilter || glContext.NEAREST;    

  // Create the texture object
  const texture = glContext.createTexture();

  // Bind and set up the texture
  glContext.bindTexture(glContext.TEXTURE_2D, texture);
  glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, textureWidth, textureHeight, 0, glContext.RGBA, textureFormat, null);
  glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, magnificationFilter);
  glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, minificationFilter);
  glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, horizontalWrapMode);
  glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, verticalWrapMode);

  // Unbind the texture
  glContext.bindTexture(glContext.TEXTURE_2D, null);

  return texture;
};


// Utility function to apply a uniform
helpers.applyUniform = (glContext, shaderProgram, uniformType, uniformName, uniformValue, textureUnit) => {
  // Get the location of the uniform in the shader program
  const uniformLocation = glContext.getUniformLocation(shaderProgram, uniformName);
  // If the uniform value is null or the location is invalid, return early
  if (uniformValue === null || !uniformLocation) return;
  
  const args = [uniformLocation];
  if (Array.isArray(uniformValue)) {
    args.push(...uniformValue);
  } else {
    args.push(uniformValue);
  }

  // Apply the uniform value
  if (!textureUnit) {
    uniformType.apply(glContext, args);
  } else {
    uniformType.call(glContext, uniformLocation, uniformValue);
    // If the uniform is a texture, bind it to the appropriate texture unit
    if (Array.isArray(textureUnit)) {
      for (let i = 0; i < textureUnit.length; i++) {
        glContext.activeTexture(glContext.TEXTURE0 + uniformValue[i]);
        glContext.bindTexture(glContext.TEXTURE_2D, textureUnit[i]);
      }
    } else {
      glContext.activeTexture(glContext.TEXTURE0 + uniformValue);
      glContext.bindTexture(glContext.TEXTURE_2D, textureUnit);
    }
  }
};


// Utility function to apply an attribute
helpers.applyAttribute = (glContext, shaderProgram, attributeName, attributeSize, attributeBuffer, attributeData) => {
  // Get the location of the attribute in the shader program
  const attributeLocation = glContext.getAttribLocation(shaderProgram, attributeName);

  // If the attribute location is invalid, return early
  if (attributeLocation < 0) return;
  
  // Bind the attribute buffer and set up its data
  glContext.bindBuffer(glContext.ARRAY_BUFFER, attributeBuffer);
  glContext.bufferData(glContext.ARRAY_BUFFER, attributeData, glContext.STATIC_DRAW);

  // Enable the attribute and set its pointer
  glContext.enableVertexAttribArray(attributeLocation);
  glContext.vertexAttribPointer(attributeLocation, attributeSize, glContext.FLOAT, false, 0, 0);
};


// Utility function to compile a shader
helpers.compileShader = function(glContext, shaderSource, shaderType) {
  // Create a new shader object of the given type
  const shader = glContext.createShader(shaderType);
  // Set the source code of the shader and compile
  glContext.shaderSource(shader, shaderSource);
  glContext.compileShader(shader);

  return shader;
};


// Create and compile a WebGL shader program
helpers.createShaderProgram = function(glContext, vertexShaderSource, fragmentShaderSource) {
  let vertexShader, fragmentShader, shaderProgram = glContext.createProgram();

  try {
    // Compile the vertex and fragment shaders
    vertexShader = this.compileShader(glContext, vertexShaderSource, glContext.VERTEX_SHADER);
    fragmentShader = this.compileShader(glContext, fragmentShaderSource, glContext.FRAGMENT_SHADER);
  } catch (error) {
    // If an error occurs, delete the program and rethrow the error
    glContext.deleteProgram(shaderProgram);
    throw error;
  }

  // Attach the compiled vertex shader to the program
  glContext.attachShader(shaderProgram, vertexShader);
  // Delete the shader as it is now attached to the program
  glContext.deleteShader(vertexShader);

  // Attach the compiled fragment shader to the program
  glContext.attachShader(shaderProgram, fragmentShader);
  // Delete the shader as it is now attached to the program
  glContext.deleteShader(fragmentShader);

  // Link the shader program
  glContext.linkProgram(shaderProgram);

  return shaderProgram;
};

export default helpers;
