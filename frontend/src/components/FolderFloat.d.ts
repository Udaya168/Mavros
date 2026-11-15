import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

export type FolderFloatItem = {
  label: string;
  value?: string;
  icon?: LucideIcon;
};

export type FolderFloatProps = {
  items?: Array<string | FolderFloatItem>;
  label?: string;
  sublabel?: string;
  trigger?: "hover" | "click";
  defaultOpen?: boolean;
  closeOnSelect?: boolean;
  physics?: boolean;
  drift?: number;
  onSelect?: (value: string | undefined, index: number) => void;
  onOpenChange?: (open: boolean) => void;
  folderColor?: string;
  frontColor?: string;
  paperColor?: string;
  itemColor?: string;
  itemTextColor?: string;
  labelColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  spread?: number;
  lift?: number;
  tilt?: number;
  flapAngle?: number;
  restAngle?: number;
  openDuration?: number;
  stagger?: number;
  bounce?: number;
  className?: string;
};

declare function FolderFloat(props: FolderFloatProps): ReactElement;

export default FolderFloat;
