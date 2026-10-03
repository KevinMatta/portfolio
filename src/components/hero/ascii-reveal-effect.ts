import {
  ASCIITexture,
  BlendFunction,
  Effect,
  EffectAttribute,
} from "postprocessing";
import {
  BasicDepthPacking,
  Color,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  Uniform,
  Vector2,
  Vector4,
  WebGLRenderTarget,
  type DepthPackingStrategies,
  type Texture,
  type WebGLRenderer,
} from "three";

/*
  Efecto de post-proceso sobre la escena 3D:
  - Fondo: un mapa topográfico ASCII que respira (curvas de nivel de ruido fbm).
  - Máscara de tinta (cursor) y barrido diagonal (scroll): revelan la escena
    física debajo, con bordes orgánicos y caracteres revueltos en el frente.

  Rendimiento: todo lo que solo depende de la celda (ruido, profundidad,
  elección de carácter) se calcula en una pasada diminuta, un píxel por celda
  (~15 mil en lugar de millones). La pasada final por píxel solo dibuja el
  carácter y, donde hay tinta, mezcla la escena física.

*/

const NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

// Pasada por celda: decide carácter, opacidad y tono de cada celda.
const cellVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const cellFragment = /* glsl */ `
#include <packing>
uniform sampler2D uScene;
uniform sampler2D uDepth;
uniform sampler2D uMask;
uniform vec4 uCells;
uniform float uTime;
uniform float uAspect;
${NOISE}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

float depthAt(vec2 uv) {
#ifdef RGBA_DEPTH
  return unpackRGBAToDepth(texture2D(uDepth, uv));
#else
  return texture2D(uDepth, uv).r;
#endif
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 cuv = (cell + 0.5) * uCells.zw;
  vec3 scene = texture2D(uScene, cuv).rgb;
  float d0 = depthAt(cuv);
  float hit = step(d0, 0.9999);
  float mask = texture2D(uMask, cuv).r;
  float t = uTime;

  float idx;
  float alpha;
  float accent = 0.0;

  if (hit > 0.5) {
    // Objetos: más sombra, más tinta; las siluetas (saltos de profundidad) en negrita.
    float lum = clamp(dot(scene, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
    idx = floor(mix(3.0, CHAR_COUNT_MINUS_ONE, pow(1.0 - lum, 0.55)));
    float dx = abs(depthAt(cuv + vec2(uCells.z, 0.0)) - d0);
    float dy = abs(depthAt(cuv + vec2(0.0, uCells.w)) - d0);
    if (max(dx, dy) > 0.0015) idx = CHAR_COUNT_MINUS_ONE;
    accent = step(max(scene.r, scene.g) * 2.2 + 0.02, scene.b);
    alpha = 1.0;
  } else {
    // Mapa topográfico de fondo. El cursor empuja el relieve.
    vec2 p = vec2(cuv.x * uAspect, cuv.y);
    float h = fbm(p * 2.1 + vec2(t * 0.03, -t * 0.018) + mask * 0.8);
    float bands = h * 10.0;
    float contour = 1.0 - smoothstep(0.0, 0.13, abs(fract(bands) - 0.5) - 0.37);
    float dust = step(0.985, hash(cell + floor(t * 0.4)));
    idx = contour > 0.5 ? 1.0 + floor(fract(bands * 0.37) * 3.0) : dust;
    alpha = 0.36;
  }

  // Frente de la tinta: caracteres revueltos que parpadean.
  float front = smoothstep(0.04, 0.22, mask) * (1.0 - smoothstep(0.35, 0.6, mask));
  float tick = floor(t * 22.0);
  if (hash(cell + tick) < front * 1.3) {
    idx = 1.0 + floor(hash(cell * 1.73 + tick) * CHAR_COUNT_MINUS_ONE);
    accent = 1.0;
    alpha = 1.0;
  }

  gl_FragColor = vec4(idx / 255.0, alpha, accent, 1.0);
}
`;

// Pasada final por píxel: dibuja el carácter y mezcla la escena física donde hay tinta.
const fragmentShader = /* glsl */ `
uniform sampler2D uAtlas;
uniform sampler2D uMask;
uniform sampler2D uCellMap;
uniform vec4 uCells;
uniform vec2 uCellRes;
uniform float uTime;
uniform float uReveal;
uniform float uAspect;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uAccent;
${NOISE}

float glyph(float index, vec2 uv) {
  vec2 pos = vec2(mod(index, TEX_CELLS), floor(index * INV_TEX_CELLS));
  vec2 offset = vec2(pos.x, -pos.y) * INV_TEX_CELLS;
  vec2 cuv = mod(uv * (uCells.xy * INV_TEX_CELLS), INV_TEX_CELLS);
  return texture(uAtlas, cuv - vec2(0.0, INV_TEX_CELLS) + offset).r;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec2 cell = floor(uv * uCells.xy);
  vec4 c = texture(uCellMap, (cell + 0.5) / uCellRes);
  float idx = floor(c.r * 255.0 + 0.5);
  vec3 ascii = mix(uPaper, mix(uInk, uAccent, c.b), glyph(idx, uv) * c.g);

  // Revelado: tinta del cursor + barrido diagonal del scroll.
  float mask = texture(uMask, uv).r;
  float diag = uv.x * 0.6 + (1.0 - uv.y) * 0.4;
  if (mask < 0.15 && uReveal * 1.3 - diag < -0.2) {
    outputColor = vec4(ascii, 1.0);
    return;
  }
  vec2 q = vec2(uv.x * uAspect, uv.y) * 5.0 + uTime * 0.12;
  float n = noise(q) * 0.65 + noise(q * 2.03) * 0.35;
  float ink = smoothstep(0.42, 0.5, mask + (n - 0.5) * 0.5);
  float wipe = smoothstep(0.0, 0.03, uReveal * 1.3 - diag - (n - 0.5) * 0.25);
  float reveal = max(ink, wipe);

  vec3 physical = mix(uInk, inputColor.rgb, step(depth, 0.9999));
  outputColor = vec4(mix(ascii, physical, reveal), 1.0);
}
`;

export type AsciiPalette = { paper: string; ink: string; accent: string };

export class AsciiRevealEffect extends Effect {
  private cellCss: number;
  private pixelRatio = 1;
  private width = 1;
  private height = 1;
  private cellTarget: WebGLRenderTarget;
  private cellMaterial: ShaderMaterial;
  private cellScene = new Scene();
  private cellCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor({
    font,
    cellCss = 11,
    palette,
  }: {
    font: string;
    cellCss?: number;
    palette: AsciiPalette;
  }) {
    const atlas = new ASCIITexture({
      characters: " .:-=+*o#%@",
      font,
      fontSize: 52,
      size: 1024,
      cellCount: 16,
    });
    const charCountMinusOne = (atlas.characterCount - 1).toFixed(1);
    const cellTarget = new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false,
    });

    super("AsciiRevealEffect", fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.SRC,
      defines: new Map([
        ["TEX_CELLS", atlas.cellCount.toFixed(1)],
        ["INV_TEX_CELLS", (1 / atlas.cellCount).toFixed(9)],
      ]),
      uniforms: new Map<string, Uniform>([
        ["uAtlas", new Uniform(atlas)],
        ["uMask", new Uniform(null)],
        ["uCellMap", new Uniform(cellTarget.texture)],
        ["uCells", new Uniform(new Vector4())],
        ["uCellRes", new Uniform(new Vector2(1, 1))],
        ["uTime", new Uniform(0)],
        ["uReveal", new Uniform(0)],
        ["uAspect", new Uniform(1)],
        ["uPaper", new Uniform(new Color())],
        ["uInk", new Uniform(new Color())],
        ["uAccent", new Uniform(new Color())],
      ]),
    });

    this.cellTarget = cellTarget;
    this.cellMaterial = new ShaderMaterial({
      vertexShader: cellVertex,
      fragmentShader: cellFragment,
      defines: { CHAR_COUNT_MINUS_ONE: charCountMinusOne },
      uniforms: {
        uScene: { value: null },
        uDepth: { value: null },
        uMask: { value: null },
        // Comparten objeto con la pasada final: se actualizan juntas.
        uCells: this.uniforms.get("uCells")!,
        uTime: this.uniforms.get("uTime")!,
        uAspect: this.uniforms.get("uAspect")!,
      },
      depthTest: false,
      depthWrite: false,
    });
    this.cellScene.add(new Mesh(new PlaneGeometry(2, 2), this.cellMaterial));

    this.cellCss = cellCss;
    this.setPalette(palette);
  }

  setPalette({ paper, ink, accent }: AsciiPalette) {
    this.uniforms.get("uPaper")!.value.set(paper);
    this.uniforms.get("uInk")!.value.set(ink);
    this.uniforms.get("uAccent")!.value.set(accent);
  }

  set mask(texture: Texture) {
    this.uniforms.get("uMask")!.value = texture;
    this.cellMaterial.uniforms.uMask.value = texture;
  }

  set reveal(value: number) {
    this.uniforms.get("uReveal")!.value = value;
  }

  setCellSize(cellCss: number, pixelRatio: number) {
    this.cellCss = cellCss;
    this.pixelRatio = pixelRatio;
    this.updateCells();
  }

  override setDepthTexture(
    depthTexture: Texture,
    depthPacking: DepthPackingStrategies = BasicDepthPacking,
  ) {
    this.cellMaterial.uniforms.uDepth.value = depthTexture;
    const rgba = depthPacking === RGBADepthPacking;
    if (rgba !== "RGBA_DEPTH" in this.cellMaterial.defines) {
      if (rgba) this.cellMaterial.defines.RGBA_DEPTH = "1";
      else delete this.cellMaterial.defines.RGBA_DEPTH;
      this.cellMaterial.needsUpdate = true;
    }
  }

  override setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.uniforms.get("uAspect")!.value = width / height;
    this.updateCells();
  }

  private updateCells() {
    const px = this.cellCss * this.pixelRatio;
    const cells = this.uniforms.get("uCells")!.value as Vector4;
    cells.x = this.width / px;
    cells.y = this.height / px;
    cells.z = 1 / cells.x;
    cells.w = 1 / cells.y;
    const cols = Math.max(1, Math.ceil(cells.x));
    const rows = Math.max(1, Math.ceil(cells.y));
    this.cellTarget.setSize(cols, rows);
    (this.uniforms.get("uCellRes")!.value as Vector2).set(cols, rows);
  }

  override update(
    renderer: WebGLRenderer,
    input: WebGLRenderTarget,
    delta?: number,
  ) {
    this.uniforms.get("uTime")!.value += delta ?? 0;
    this.cellMaterial.uniforms.uScene.value = input.texture;

    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(this.cellTarget);
    renderer.render(this.cellScene, this.cellCamera);
    renderer.setRenderTarget(previous);
  }

  override dispose() {
    (this.uniforms.get("uAtlas")!.value as Texture).dispose();
    this.cellTarget.dispose();
    this.cellMaterial.dispose();
    super.dispose();
  }
}
