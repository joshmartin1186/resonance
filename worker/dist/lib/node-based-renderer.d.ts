/**
 * Node-Based Renderer Integration
 *
 * Replaces simple shader rendering with full node system
 */
export interface NodeRenderOptions {
    audioPath: string;
    outputPath: string;
    duration: number;
    width: number;
    height: number;
    fps: number;
    colors?: {
        primary: string;
        secondary: string;
        accent: string;
    };
    intensity?: number;
    useAI?: boolean;
    parallel?: boolean;
}
/**
 * Render video using the node system
 */
export declare function renderNodeBasedVideo(options: NodeRenderOptions): Promise<void>;
//# sourceMappingURL=node-based-renderer.d.ts.map