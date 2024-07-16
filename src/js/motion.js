// *** DEBUG NEEDED ****

class Motion {
  constructor(gl, particles) {
    this.gl = gl;
    this.particles = particles;
    this.isDragging = false; // Track if the mouse is being dragged
    this.initMouseEvents();
  }

  // Initialize mouse event listeners
  initMouseEvents() {
    const canvas = this.gl.canvas;

    // When the mouse button is pressed, start dragging
    canvas.addEventListener('mousedown', (event) => {
      this.isDragging = true;
      this.updateParticlesVelocity(event);
    });

    // When the mouse is moved, update particle velocities if dragging
    canvas.addEventListener('mousemove', (event) => {
      if (this.isDragging) {
        this.updateParticlesVelocity(event);
      }
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }

  // Update particle velocities based on the mouse event
  updateParticlesVelocity(event) {
    const rect = this.gl.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / this.gl.canvas.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / this.gl.canvas.height) * 2 - 1;
    this.particles.updateVelocities(x, y);
  }
}

window.Motion = Motion;
