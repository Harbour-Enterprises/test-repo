export type BaseEvent = {
    /**
     * - Unique event identifier
     */
    id: string;
    /**
     * - ISO timestamp of the event
     */
    timestamp: string;
    /**
     * - Current session identifier
     */
    sessionId: string;
    /**
     * - SuperDoc ID
     */
    superdocId: string;
    /**
     * - Document information
     */
    document: {
        id?: string;
        type?: string;
        internalId?: string;
        hash?: string;
        lastModified?: string;
    };
};
export type UsageEvent = any;
export type ParsingEvent = any;
export type TelemetryEvent = (UsageEvent & BaseEvent) | (ParsingEvent & BaseEvent);
export type TelemetryConfig = {
    /**
     * - Licence key for telemetry service
     */
    licenceKey?: string;
    /**
     * - Whether telemetry is enabled
     */
    enabled?: boolean;
    /**
     * - service endpoint
     */
    endpoint: string;
    /**
     * - SuperDoc id
     */
    superdocId: string;
};
export class Telemetry {
    /** @type {number} */
    static BATCH_SIZE: number;
    /** @type {number} */
    static FLUSH_INTERVAL: number;
    /** @type {string} */
    static COMMUNITY_LICENSE_KEY: string;
    /** @type {string} */
    static DEFAULT_ENDPOINT: string;
    /**
     * Initialize telemetry service
     * @param {TelemetryConfig} config
     */
    constructor(config?: TelemetryConfig);
    /** @type {boolean} */
    enabled: boolean;
    /** @type {string} */
    superdocId: string;
    /** @type {string} */
    licenseKey: string;
    /** @type {string} */
    endpoint: string;
    /** @type {string} */
    sessionId: string;
    /** @type {TelemetryEvent[]} */
    events: TelemetryEvent[];
    /** @type {number|undefined} */
    flushInterval: number | undefined;
    /**
     * Create source payload for request
     */
    getSourceData(): {
        userAgent: string;
        url: string;
        host: string;
        referrer: string;
        screen: {
            width: number;
            height: number;
        };
    };
    /**
     * Track feature usage
     * @param {File} fileSource - File object
     * @param {string} documentId - document id
     * @param {string} name - Name of the feature/event
     * @param {Object.<string, *>} [properties] - Additional properties
     */
    trackUsage(fileSource: File, documentId: string, name: string, properties?: {
        [x: string]: any;
    }): Promise<void>;
    /**
     * Track parsing events
     * @param {File} fileSource - File object
     * @param {string} documentId - document id
     * @param {'mark'|'element'} category - Category of parsed item
     * @param {string} name - Name of the item
     * @param {string} path - Document path where item was found
     * @param {Object.<string, *>} [metadata] - Additional context
     */
    trackParsing(fileSource: File, documentId: string, category: "mark" | "element", name: string, path: string, metadata?: {
        [x: string]: any;
    }): Promise<void>;
    /**
     * Process document metadata
     * @param {File} file - Document file
     * @param {Object} options - Additional metadata options
     * @returns {Promise<Object>} Document metadata
     */
    processDocument(file: File, options?: any): Promise<any>;
    /**
     * Generate CRC32 hash for a file
     * @param {File} file - File to hash
     * @returns {Promise<string>} CRC32 hash
     * @private
     */
    private generateCrc32Hash;
    /**
     * Queue event for sending
     * @param {TelemetryEvent} event
     * @private
     */
    private queueEvent;
    /**
     * Flush queued events to server
     * @returns {Promise<void>}
     */
    flush(): Promise<void>;
    /**
     * Start periodic flush interval
     * @private
     */
    private startPeriodicFlush;
    /**
     * Generate unique identifier
     * @returns {string}
     * @private
     */
    private generateId;
    /**
     * Clean up telemetry service
     * @returns {Promise<void>}
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=Telemetry.d.ts.map