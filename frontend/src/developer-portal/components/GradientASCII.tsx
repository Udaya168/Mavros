"use client";

import { useEffect, useRef, useState } from "react";
import "./GradientASCII.css";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_texCoord;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_cellSize;
uniform float u_density;
uniform float u_glyphOpacity;
uniform float u_gradientOpacity;
uniform float u_glow;
uniform float u_dof;
uniform float u_flicker;
uniform float u_softness;
uniform float u_scale;
uniform float u_flow;
uniform float u_speed;
uniform float u_grain;
uniform float u_variation;
uniform float u_scrambleRadius;
uniform bool u_mouseInteraction;
uniform bool u_intro;
uniform vec3 u_colorA;
uniform vec3 u_colorB;

#define PI 3.14159265359
#define TAU 6.28318530718

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

vec3 palette(float t, vec3 a, vec3 b) {
  return mix(a, b, smoothstep(0.0, 1.0, t));
}

float letters(vec2 uv, float cellSize) {
  vec2 id = floor(uv / cellSize);
  vec2 p = fract(uv / cellSize) - 0.5;
  
  float n = hash(id);
  float charIndex = floor(n * 26.0);
  
  float shape = 0.0;
  
  if (charIndex < 1.0) { shape = max(abs(p.x) - 0.12, abs(p.y) - 0.4); }
  else if (charIndex < 2.0) { shape = length(p) - 0.28; }
  else if (charIndex < 3.0) { shape = max(abs(p.x) - 0.22, abs(p.y) - 0.22); }
  else if (charIndex < 4.0) { shape = abs(p.x) + abs(p.y) - 0.32; }
  else if (charIndex < 5.0) { shape = length(p - vec2(0.12, 0.0)) - 0.12; }
  else if (charIndex < 6.0) { shape = length(p + vec2(0.12, 0.0)) - 0.12; }
  else if (charIndex < 7.0) { shape = abs(p.x) - 0.08; }
  else if (charIndex < 8.0) { shape = abs(p.y) - 0.08; }
  else if (charIndex < 9.0) { shape = length(p) - 0.22; }
  else if (charIndex < 10.0) { shape = max(abs(p.x) - 0.18, abs(p.y) - 0.18); }
  else if (charIndex < 11.0) { shape = max(p.x, -p.y) - 0.18; }
  else if (charIndex < 12.0) { shape = max(-p.x, p.y) - 0.18; }
  else if (charIndex < 13.0) { shape = max(p.x + p.y, -p.x - p.y) - 0.25; }
  else if (charIndex < 14.0) { shape = max(p.x - p.y, -p.x + p.y) - 0.25; }
  else if (charIndex < 15.0) { shape = length(p) - 0.28; }
  else if (charIndex < 16.0) { shape = abs(p.x) + abs(p.y) - 0.38; }
  else if (charIndex < 17.0) { shape = max(abs(p.x) - 0.12, p.y); }
  else if (charIndex < 18.0) { shape = max(abs(p.x) - 0.12, -p.y); }
  else if (charIndex < 19.0) { shape = max(p.x, abs(p.y) - 0.12); }
  else if (charIndex < 20.0) { shape = max(-p.x, abs(p.y) - 0.12); }
  else if (charIndex < 21.0) { shape = length(p) - 0.22; }
  else if (charIndex < 22.0) { shape = max(abs(p.x) - 0.18, abs(p.y) - 0.18); }
  else if (charIndex < 23.0) { shape = max(p.x, -p.x) - 0.12; }
  else if (charIndex < 24.0) { shape = max(p.y, -p.y) - 0.12; }
  else if (charIndex < 25.0) { shape = length(p - vec2(sin(u_time * 0.3) * 0.08, 0.0)) - 0.18; }
  else { shape = length(p) - 0.28; }
  
  return shape;
}

void main() {
  vec2 uv = v_texCoord * u_resolution;
  vec2 center = u_resolution * 0.5;
  vec2 mouseNorm = u_mouse / u_resolution;
  
  float aspect = u_resolution.x / u_resolution.y;
  vec2 q = (uv - center) / min(u_resolution.x, u_resolution.y) * u_scale;
  
  float time = u_time * u_speed;
  
  float introProgress = u_intro ? smoothstep(0.0, 4.0, u_time) : 1.0;
  
  vec2 flowDir = vec2(cos(time * u_flow * 0.15), sin(time * u_flow * 0.08)) * u_flow * 0.3;
  q += flowDir * time * 0.06;
  
  if (u_mouseInteraction) {
    vec2 mouseDelta = (mouseNorm - 0.5) * 2.0;
    float mouseDist = length(q - mouseDelta * 0.4);
    q += normalize(q - mouseDelta * 0.4) * (0.12 / (mouseDist + 0.15)) * 0.2;
  }
  
  float n = fbm(q * 1.6 + time * 0.07, 4);
  
  float field = n * 0.5 * u_softness;
  field += fbm(q * 3.2 + time * 0.035, 3) * 0.22 * u_softness;
  field += fbm(q * 6.5 + time * 0.018, 2) * 0.1 * u_softness;
  
  float grain = u_grain * hash2(floor(uv / u_cellSize) + floor(time * 8.0)).x;
  field += grain * 0.025;
  
  float scramble = u_scrambleRadius * hash2(floor(uv / u_cellSize)).y;
  field += scramble * 0.035;
  
  float variation = u_variation * sin(time * 1.2 + q.x * 2.0 + q.y * 3.5);
  field += variation * 0.06;
  
  float flicker = u_flicker * hash2(floor(uv / u_cellSize) + floor(time * 4.0)).x;
  float horizontalBand = 1.0 - smoothstep(0.0, 0.6, abs(q.y * 1.1));
  float densityMask = smoothstep(0.5 - u_density * 0.5, 0.5 + u_density * 0.5, n + 0.5) * horizontalBand;
  float alpha = smoothstep(0.02, 0.0, abs(field)) * densityMask * (1.0 + flicker * 0.25);
  
  float glyph = letters(uv, u_cellSize);
  float glyphMask = 1.0 - smoothstep(-0.04, 0.05, glyph);
  
  float dof = u_dof * length(q) * 0.5;
  alpha *= (1.0 - dof);
  glyphMask *= (1.0 - dof);
  
  float distToCenter = length(v_texCoord - 0.5) * 2.0;
  float vignette = smoothstep(1.4, 0.15, distToCenter);
  
  float horizontalPos = q.y * 1.1 + sin(time * 0.1) * 0.3 + n * 0.3;
  float gradient = smoothstep(-0.6, 0.6, horizontalPos);
  vec3 bgColor = palette(gradient, u_colorA, u_colorB);
  
  float horizontalGlow = smoothstep(0.25, -0.25, abs(q.y + sin(time * 0.1) * 0.2 + n * 0.15));
  float glowAmount = u_glow * 0.15 * horizontalGlow * (1.0 - abs(q.y) * 0.2);
  vec3 glowColor = mix(vec3(0.15, 0.45, 0.45), vec3(0.1, 0.35, 0.35), smoothstep(-0.4, 0.4, q.y));
  
vec3 accentCyan = vec3(0.12, 0.45, 0.5);
  vec3 accentTeal = vec3(0.08, 0.38, 0.35);
  vec3 glyphColor = mix(accentCyan, accentTeal, smoothstep(-0.5, 0.5, q.y));

  vec3 finalColor = bgColor * u_gradientOpacity * vignette;
  float glyphAlpha = alpha * horizontalBand * 0.7;
  finalColor += glyphColor * glyphMask * u_glyphOpacity * glyphAlpha * (1.0 + glowAmount * 0.2);
  finalColor += glowColor * glowAmount * 0.4;
  finalColor += vec3(0.015, 0.04, 0.04) * alpha * 0.2;
  
  fragColor = vec4(finalColor * introProgress, 1.0);
}
`;

interface GradientASCIIProps {
  className?: string;
}

export function GradientASCII({ className = "" }: GradientASCIIProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const buffersRef = useRef<{ position: WebGLBuffer; texCoord: WebGLBuffer } | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation>>({});
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const initGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      console.warn("WebGL2 not supported");
      return;
    }

    glRef.current = gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error("Vertex shader error:", gl.getShaderInfoLog(vertexShader));
      return;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fragmentShader));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );

    buffersRef.current = { position: positionBuffer, texCoord: texCoordBuffer };

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");

    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    const uniformNames = [
      "u_resolution",
      "u_time",
      "u_mouse",
      "u_cellSize",
      "u_density",
      "u_glyphOpacity",
      "u_gradientOpacity",
      "u_glow",
      "u_dof",
      "u_flicker",
      "u_softness",
      "u_scale",
      "u_flow",
      "u_speed",
      "u_grain",
      "u_variation",
      "u_scrambleRadius",
      "u_mouseInteraction",
      "u_intro",
      "u_colorA",
      "u_colorB",
    ];

    for (const name of uniformNames) {
      uniformsRef.current[name] = gl.getUniformLocation(program, name)!;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const resize = () => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      setCanvasSize({ width, height });
    }
  };

  const render = (timestamp: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const buffers = buffersRef.current;
    const uniforms = uniformsRef.current;
    if (!gl || !program || !buffers) return;

    const elapsed = (timestamp - startTimeRef.current) / 1000;

    gl.useProgram(program);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const getUniform = (name: string) => uniforms[name]!;

    gl.uniform2f(getUniform("u_resolution"), canvas.width, canvas.height);
    gl.uniform1f(getUniform("u_time"), elapsed);
    gl.uniform2f(getUniform("u_mouse"), mousePos.x, canvas.height - mousePos.y);
    gl.uniform1f(getUniform("u_cellSize"), 18.0);
    gl.uniform1f(getUniform("u_density"), 0.55);
    gl.uniform1f(getUniform("u_glyphOpacity"), 0.45);
    gl.uniform1f(getUniform("u_gradientOpacity"), 0.95);
    gl.uniform1f(getUniform("u_glow"), 0.65);
    gl.uniform1f(getUniform("u_dof"), 0.0);
    gl.uniform1f(getUniform("u_flicker"), 0.08);
    gl.uniform1f(getUniform("u_softness"), 0.4);
    gl.uniform1f(getUniform("u_scale"), 1.0);
    gl.uniform1f(getUniform("u_flow"), 0.5);
    gl.uniform1f(getUniform("u_speed"), 0.7);
    gl.uniform1f(getUniform("u_grain"), 0.05);
    gl.uniform1f(getUniform("u_variation"), 0.0);
    gl.uniform1f(getUniform("u_scrambleRadius"), 0.1);
    gl.uniform1i(getUniform("u_mouseInteraction"), 1);
    gl.uniform1i(getUniform("u_intro"), 1);

    const colorA = [0x0a / 255, 0x1a / 255, 0x1a / 255];
    const colorB = [0x0d / 255, 0x25 / 255, 0x25 / 255];
    gl.uniform3fv(getUniform("u_colorA"), colorA);
    gl.uniform3fv(getUniform("u_colorB"), colorB);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationRef.current = requestAnimationFrame(render);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    setMousePos({
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    });
  };

  useEffect(() => {
    initGL();
    resize();

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      const gl = glRef.current;
      if (gl) {
        const program = programRef.current;
        const buffers = buffersRef.current;
        if (program) gl.deleteProgram(program);
        if (buffers) {
          gl.deleteBuffer(buffers.position);
          gl.deleteBuffer(buffers.texCoord);
        }
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`gradient-ascii-canvas ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 0,
      }}
    />
  );
}
