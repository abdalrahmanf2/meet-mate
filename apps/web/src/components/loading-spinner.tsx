import { cva, VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-zinc-600 border-t-blue-600",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-6 border-4",
        lg: "size-8 border-4",
        xl: "size-12 border-8",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

const LoadingSpinner = (props: VariantProps<typeof spinnerVariants>) => {
  return <div className={spinnerVariants({ size: props.size })} {...props} />;
};

export default LoadingSpinner;
