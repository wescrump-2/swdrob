import OBR, {Image, isImage} from "@owlbear-rodeo/sdk";

export class Debug {
	private static _enabled = false;
	private static wasEnabled = false;

	static get enabled() {
		return this._enabled;
	}
		static set enabled(flag:boolean) {
		this._enabled=flag;
	}
    static async   sceneOnChange() {
    const isReady = await OBR.scene.isReady();
    if (isReady) {
        Debug.log("Scene is ready, executing scene-dependent code");
        const initialItems = await OBR.scene.items.getItems((item): item is Image => item.layer === "CHARACTER" && isImage(item));
        Debug.updateFromPlayers(initialItems.map(i => i.name))
        Debug.log(`Scene ready - found ${initialItems.length} character items`);
    } else {
        Debug.log("Scene is not ready, skipping scene-dependent code");
    }
}
	static updateFromPlayers(names: string[]) {
	    const hasDebugPlayer = names.some(p =>
	        p.toLowerCase().includes("debug")
	    );
	    if (hasDebugPlayer !== this._enabled) {
	        this._enabled = hasDebugPlayer;

	        if (hasDebugPlayer && !this.wasEnabled) {
	            console.log(
	                "%cINITIATIVE DEBUG MODE ACTIVATED — 'debug' player in room.'",
	                "color: lime; background: #000; font-weight: bold; font-size: 16px; padding: 8px 12px; border-radius: 4px;"
	            );
	        }
	        if (!hasDebugPlayer && this.wasEnabled) {
	            console.log(
	                "%cINITIATIVE DEBUG MODE DEACTIVATED — no 'debug' player in room.",
	                "color: red; background: #000; font-weight: bold; font-size: 16px; padding: 8px 12px; border-radius: 4px;"
	            );
	        }
	        this.wasEnabled = hasDebugPlayer;
	    } else {
	        console.log(`No change needed - hasDebugPlayer: ${hasDebugPlayer}, _enabled: ${this._enabled}`);
	    }
	}

	// Method to manually enable debug mode for testing
	static enableDebugMode() {
		if (!this._enabled) {
			this._enabled = true;
			this.wasEnabled = true;
		}
	}

	static log(...args: any[]) {
		if (this._enabled) {
			console.log(...args);
		}
	}

	static warn(...args: any[]) {
		if (this._enabled) {
			console.warn(...args);
		}
	}

	static error(...args: any[]) {
		if (this._enabled) {
			console.error(...args);
		}
	}



	// --- List ALL room and scene metadata keys and their sizes ---
	static async dumpRoomMetadata() {
		if (!Debug.enabled) return;
		// Check room metadata
		const roomMeta = await OBR.room.getMetadata();
		Debug.log("=== ROOM METADATA ===");
		for (const [key, value] of Object.entries(roomMeta)) {
			const size = Debug.getObjectMemorySize(value);
			Debug.log(`${key}  →  ${size} bytes`, value);
		}

		// Check scene metadata if scene is ready
		try {
			const isSceneReady = await OBR.scene.isReady();
			if (isSceneReady) {
				const sceneMeta = await OBR.scene.getMetadata();
				Debug.log("=== SCENE METADATA ===");
				for (const [key, value] of Object.entries(sceneMeta)) {
					const size = Debug.getObjectMemorySize(value);
					Debug.log(`${key}  →  ${size} bytes`, value);
				}
			} else {
				Debug.log("Scene not ready, skipping scene metadata dump");
			}
		} catch (error) {
			Debug.log("Failed to check scene metadata:", error);
		}
	}

	// --- List ALL extensions that have stored something on scene items ---
	static async findItemMetadataKeys() {
		if (!Debug.enabled) return;
		const items = await OBR.scene.items.getItems();
		const keys = new Set();
		items.forEach(item => {
			if (item.metadata) {
				Object.keys(item.metadata).forEach(k => keys.add(k));
			}
		});
		Debug.log("=== METADATA KEYS FOUND ON SCENE ITEMS ===");
		Debug.log(Array.from(keys).sort());
	}

	/**
	 * Improved cleanup: Deletes keys by setting them to null individually (reliable removal).
	 * Retries on failure and checks total size to avoid 16 kB errors.
	 * Now handles room metadata only for cleanup purposes.
	 */
	static async cleanupDeadExtensionMetadata() {
		if (!Debug.enabled) return;
		try {
			// Check room metadata only
			const roomMetadata = await OBR.room.getMetadata();

			// Log current size for debugging
			let currentRoomSize = 0;
			for (const [value] of Object.entries(roomMetadata)) {
				currentRoomSize += Debug.getObjectMemorySize(value);
			}
			Debug.log(`Current room metadata size: ${currentRoomSize} bytes`);

			if (currentRoomSize > 16000) {  // Close to limit — abort to avoid write failure
				console.warn("Room metadata too large (>15 kB). Manual room reset needed.");
				return;
			}

			// List of our legacy room metadata keys to clean up
			const ourRoomKeys: string[] = [
				"com.wescrump.dice-roller/rollHistory", // Legacy room key
				// Add more of our legacy room keys here as needed
			];

			// Find our keys in room metadata
			const keysToDelete: string[] = [];
			for (const key of ourRoomKeys) {
				if (roomMetadata[key] !== undefined) {
					keysToDelete.push(key);
				}
			}

			if (keysToDelete.length === 0) {
				Debug.log("No our room metadata keys found for cleanup.");
				return;
			}

			Debug.log(`Found ${keysToDelete.length} our room keys to clean up:`, keysToDelete);

			// Delete each key individually by setting to undefined (reliable method)
			let successCount = 0;
			for (const key of keysToDelete) {
				try {
					await OBR.room.setMetadata({ [key]: undefined });
					successCount++;
					Debug.log(`Deleted room key: ${key}`);
				} catch (deleteErr: unknown) {
					console.error(`Failed to delete room ${key}:`, deleteErr);
					// Optional: Retry once after delay
					setTimeout(async () => {
						try {
							await OBR.room.setMetadata({ [key]: undefined });
							Debug.log(`Retried and deleted room:${key}`);
						} catch (retryErr) {
							console.error(`Retry failed for room ${key}:`, retryErr);
						}
					}, 500);
				}
			}

			Debug.log(`Cleanup complete: ${successCount}/${keysToDelete.length} keys deleted.`);

			// Final size check for room
			const newRoomMetadata = await OBR.room.getMetadata();
			let newRoomSize = 0;
			for (const [value] of Object.entries(newRoomMetadata)) {
				newRoomSize += Debug.getObjectMemorySize(value);
			}
			Debug.log(`New room metadata size: ${newRoomSize} bytes (reduced by ${currentRoomSize - newRoomSize} bytes)`);

		} catch (err: unknown) {
			console.error("Room cleanup failed (safe to ignore):", err);
		}
	}

	/**
	 * Approximate the memory size of an object in bytes with circular reference protection.
	 */
	static getObjectMemorySize(obj: any, seen: WeakSet<object> = new WeakSet()): number {
		// Handle circular references
		if (obj && typeof obj === 'object') {
			if (seen.has(obj)) {
				return 0; // Circular reference detected, return 0 to avoid infinite recursion
			}
			seen.add(obj);
		}

		if (obj instanceof Uint8Array) {
			return obj.byteLength;
		}

		const type = typeof obj;
		if (type === 'string') {
			return obj.length * 2; // UTF-16
		} else if (type === 'number') {
			return 8;
		} else if (type === 'boolean') {
			return 4;
		} else if (obj === null || obj === undefined) {
			return 0;
		} else if (Array.isArray(obj)) {
			let size = 16; // array overhead
			for (const item of obj) {
				size += Debug.getObjectMemorySize(item, seen);
			}
			return size;
		} else if (type === 'object') {
			let size = 16; // object overhead
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) { // Only count own properties
					size += key.length * 2 + 8; // key + pointer
					size += Debug.getObjectMemorySize(obj[key], seen);
				}
			}
			return size;
		}
		return 0;
	}
}// end Debug