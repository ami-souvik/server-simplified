import * as React from "react";

const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, children, ...props }, ref) => (
		<div
			ref={ref}
			className={`relative overflow-auto ${className}`}
			data-radix-scroll-area-viewport
			{...props}
		>
			<div className="h-full w-full">{children}</div>
		</div>
	)
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
