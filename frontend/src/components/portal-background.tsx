import { memo } from "react";
import GradientASCII from "./GradientASCII";
import "./portal-background.css";

const PORTAL_GRADIENT_COLORS = [
  "#040807",
  "#081412",
  "#0c1f1b",
  "#122d28",
  "#183b34",
];

export interface PortalBackgroundProps {
  className?: string;
}

export const PortalBackground = memo(function PortalBackground({
  className = "",
}: PortalBackgroundProps) {
  return (
    <div
      className={`portal-ascii-background-layer${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <GradientASCII
        colors={PORTAL_GRADIENT_COLORS}
        shape="horizon"
        characters=" =+xX0S8#@"
        cellSize={18}
        density={0.9}
        scale={1.8}
        glyphOpacity={0.85}
        gradientOpacity={0.35}
        glow={0.15}
        depthOfField={0.08}
        flicker={0.15}
        softness={0.6}
        flow={0.6}
        speed={0.5}
        grain={0.05}
        variation={0}
        mouseInteraction={true}
        scrambleRadius={0.1}
        clickEffect="wave"
        intro={true}
        fontFamily="'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
      />
    </div>
  );
});

export default PortalBackground;
