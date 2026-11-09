import { cn } from "@/lib/utils";

/**
 * The word out of the studio logo, drawn as a shape rather than a picture, so it
 * takes the colour of whatever is around it: light on the dark sections, ink on
 * the pale ones. Give it a height and a width at 2.668:1.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-current [-webkit-mask-image:url(/brand/iconic-word.png)] [-webkit-mask-position:left_center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain] [mask-image:url(/brand/iconic-word.png)] [mask-position:left_center] [mask-repeat:no-repeat] [mask-size:contain]",
        className,
      )}
    />
  );
}
