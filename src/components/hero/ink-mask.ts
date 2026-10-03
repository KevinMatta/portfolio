import {
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;


const fragmentShader = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uPointer;
uniform vec2 uLast;
uniform float uAspect;
uniform float uDecay;
uniform float uForce;
uniform float uRadius;
uniform float uTime;
varying vec2 vUv;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 drift = vec2(sin(vUv.y * 14.0 + uTime * 1.3) * 0.0012, 0.0016);
  float prev = texture2D(uPrev, vUv - drift).r * uDecay;

  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float d = segment(p, vec2(uLast.x * uAspect, uLast.y), vec2(uPointer.x * uAspect, uPointer.y));
  float splat = exp(-(d * d) / (uRadius * uRadius)) * uForce;

  gl_FragColor = vec4(min(prev + splat, 1.4), 0.0, 0.0, 1.0);
}
`;

export class InkMask {
  private targets: [WebGLRenderTarget, WebGLRenderTarget];
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: ShaderMaterial;
  private pointer = new Vector2(-1, -1);
  private last = new Vector2(-1, -1);
  private speed = 0;
  private time = 0;
  active = false;

  constructor(width = 320) {
    const make = () =>
      new WebGLRenderTarget(width, width, {
        type: HalfFloatType,
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false,
      });
    this.targets = [make(), make()];
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPrev: { value: null },
        uPointer: { value: this.pointer },
        uLast: { value: this.last },
        uAspect: { value: 1 },
        uDecay: { value: 0.97 },
        uForce: { value: 0 },
        uRadius: { value: 0.06 },
        uTime: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.scene.add(new Mesh(new PlaneGeometry(2, 2), this.material));
  }

  get texture() {
    return this.targets[0].texture;
  }

  setAspect(aspect: number, width = 320) {
    this.material.uniforms.uAspect.value = aspect;
    const height = Math.max(8, Math.round(width / aspect));
    this.targets.forEach((t) => t.setSize(width, height));
  }

  /** uv en [0,1], origen abajo a la izquierda. */
  move(x: number, y: number) {
    if (this.pointer.x < 0) this.last.set(x, y);
    this.speed += Math.hypot(x - this.pointer.x, y - this.pointer.y);
    this.pointer.set(x, y);
    this.active = true;
  }

  update(renderer: WebGLRenderer, delta: number) {
    this.time += delta;
    const u = this.material.uniforms;
    const frames = delta * 60;
    const moving = Math.min(this.speed * 14, 1);
    // Quieto, el cursor sigue goteando un poco: la tinta no desaparece bajo él.
    u.uForce.value = this.active ? 0.05 * frames + moving * 0.55 : 0;
    u.uRadius.value = 0.05 + moving * 0.05;
    u.uDecay.value = Math.pow(0.968, frames);
    u.uTime.value = this.time;
    u.uPrev.value = this.targets[0].texture;

    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(this.targets[1]);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(previous);

    this.targets.reverse();
    this.last.copy(this.pointer);
    this.speed = 0;
  }

  dispose() {
    this.targets.forEach((t) => t.dispose());
    this.material.dispose();
  }
}
