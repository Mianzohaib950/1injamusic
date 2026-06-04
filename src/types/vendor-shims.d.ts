declare module "class-variance-authority" {
  export const cva: (...args: any[]) => any;
  export type VariantProps<T = any> = {
    variant?: string | null;
    size?: string | null;
    side?: "top" | "bottom" | "left" | "right" | null;
    orientation?: string | null;
    align?: string | null;
  };
}

declare module "nodemailer" {
  const nodemailer: any;
  export default nodemailer;
}
