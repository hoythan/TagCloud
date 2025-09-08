export interface TagCloud {
    update(texts: Array<string | { text: string; pr?: number }>): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}

export interface TagCloudOptions {
    radius?: number;
    maxSpeed?: "slow" | "normal" | "fast";
    initSpeed?: "slow" | "normal" | "fast";
    direction?: number;
    keep?: boolean;
    reverseDirection?: boolean;
    containerClass?: string;
    itemClass?: string;
    useContainerInlineStyles?: boolean;
    useItemInlineStyles?: boolean;
    useHTML?: boolean;
    minFontSize?: number;
    maxFontSize?: number;
    hls?: boolean;
}

export default function (
    container: string,
    texts: Array<string | { text: string; pr?: number }>,
    options?: TagCloudOptions
): TagCloud;

export default function (
    container: Element,
    texts: Array<string | { text: string; pr?: number }>,
    options?: TagCloudOptions
): TagCloud;

export default function (
    container: [Element],
    texts: Array<string | { text: string; pr?: number }>,
    options?: TagCloudOptions
): TagCloud;

export default function (
    container: Array<Element>,
    texts: Array<string | { text: string; pr?: number }>,
    options?: TagCloudOptions
): Array<TagCloud> | TagCloud;
